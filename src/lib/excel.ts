import ExcelJS from "exceljs";
import { num } from "./format";
import { logger } from "./logger";
import {
  getAccounts,
  getAnnualPlans,
  getBills,
  getBudgets,
  getDebts,
  getEmergencyItems,
  getGoals,
  getInsurance,
  getInvestments,
  getMembers,
  getSnapshots,
  getTaxProfile,
  getAllTransactions,
  getWatchlist,
} from "./data";

// ── Colour palette (no green — using indigo/amber/rose/slate) ──
const C = {
  ink:        "FF0F172A",
  muted:      "FF64748B",
  faint:      "FF94A3B8",
  primary:    "FF4F46E5",   // indigo
  primarySoft:"FFEEF2FF",
  accent:     "FF7C3AED",   // violet
  accentSoft: "FFF5F3FF",
  head:       "FF1E293B",
  band:       "FFF8FAFC",
  border:     "FFE6EAF2",
  positive:   "FF2563EB",   // blue (income / gains)
  positiveBg: "FFDBEAFE",
  negative:   "FFE11D48",   // rose (expenses / losses)
  negativeBg: "FFFCE7F3",
  warning:    "FFD97706",   // amber
  warningBg:  "FFFEF3C7",
  white:      "FFFFFFFF",
};

const INR = '"₹"#,##0';
const PCT = "0.0%";

function titleBlock(ws: ExcelJS.Worksheet, title: string, subtitle: string) {
  ws.mergeCells("A1:H1");
  const t = ws.getCell("A1");
  t.value = title;
  t.font = { size: 20, bold: true, color: { argb: C.ink } };
  ws.mergeCells("A2:H2");
  const s = ws.getCell("A2");
  s.value = subtitle;
  s.font = { size: 11, color: { argb: C.muted } };
  ws.getRow(1).height = 28;
  ws.getRow(2).height = 18;
}

function headerRow(ws: ExcelJS.Worksheet, rowIdx: number, headers: string[]) {
  const row = ws.getRow(rowIdx);
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: C.white }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.head } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: C.border } } };
  });
  row.height = 22;
}

function zebra(ws: ExcelJS.Worksheet, start: number, end: number, cols: number) {
  for (let r = start; r <= end; r++) {
    if ((r - start) % 2 === 1) {
      for (let c = 1; c <= cols; c++) {
        ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.band } };
      }
    }
  }
}

function moneyCell(ws: ExcelJS.Worksheet, r: number, c: number, value: number, color?: string) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.numFmt = INR;
  if (color) cell.font = { color: { argb: color } };
}

// ── Main builder ──────────────────────────────────────────────
export async function buildWorkbook(): Promise<ExcelJS.Buffer> {
  try {
    return await buildWorkbookInner();
  } catch (err) {
    logger.error("Excel export failed", err);
    throw new Error("Failed to generate Excel file. Please try again.");
  }
}

async function buildWorkbookInner(): Promise<ExcelJS.Buffer> {
  const [members, accounts, txns, budgets, goals, investments, debts, bills, insurance, snaps, annual, tax, emergency, watch] =
    await Promise.all([
      getMembers(), getAccounts(), getAllTransactions(), getBudgets(), getGoals(),
      getInvestments(), getDebts(), getBills(), getInsurance(), getSnapshots(),
      getAnnualPlans(), getTaxProfile(), getEmergencyItems(), getWatchlist(),
    ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Personal CFO";
  wb.created = new Date();
  const memberName = (id: number | null) => members.find((m) => m.id === id)?.name ?? "";

  // ── COMPUTED SUMMARY ──
  const totalIncome = txns.filter((t) => t.type === "income").reduce((s, t) => s + num(t.amount), 0);
  const totalExpense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + num(t.amount), 0);
  const totalInvested = investments.reduce((s, i) => s + num(i.invested), 0);
  const totalCurrent = investments.reduce((s, i) => s + num(i.currentValue), 0);
  const totalDebt = debts.reduce((s, d) => s + num(d.outstanding), 0);
  const totalEmi = debts.reduce((s, d) => s + num(d.emi), 0);
  const totalLiquid = accounts.filter((a) => a.category === "liquid").reduce((s, a) => s + num(a.balance), 0);
  const totalAssets = accounts.reduce((s, a) => s + num(a.balance), 0) + totalCurrent;
  const netWorth = totalAssets - totalDebt;
  const totalGoalSaved = goals.reduce((s, g) => s + num(g.saved), 0);
  const totalGoalTarget = goals.reduce((s, g) => s + num(g.target), 0);
  const totalBillsUnpaid = bills.filter((b) => !b.paid).reduce((s, b) => s + num(b.amount), 0);
  const totalInsurancePremium = insurance.reduce((s, p) => s + num(p.premium), 0);
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

  // ══════════════════════════════════════════════════════════
  // SHEET 1: DASHBOARD (Summary of everything)
  // ══════════════════════════════════════════════════════════
  const dash = wb.addWorksheet("Dashboard", { properties: { tabColor: { argb: C.primary } } });
  dash.columns = [{ width: 28 }, { width: 22 }, { width: 4 }, { width: 28 }, { width: 22 }];

  dash.mergeCells("A1:E1");
  dash.getCell("A1").value = "📊 Personal CFO — Financial Summary";
  dash.getCell("A1").font = { size: 22, bold: true, color: { argb: C.primary } };
  dash.mergeCells("A2:E2");
  dash.getCell("A2").value = `Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`;
  dash.getCell("A2").font = { size: 11, color: { argb: C.muted } };
  dash.getRow(1).height = 32;

  // KPI section
  const kpis: [string, number, string, string][] = [
    ["Net Worth", netWorth, INR, C.primary],
    ["Liquid Cash", totalLiquid, INR, C.primary],
    ["Total Assets", totalAssets, INR, C.primary],
    ["Total Debt", totalDebt, INR, C.negative],
    ["Monthly Income", totalIncome, INR, C.positive],
    ["Monthly Expenses", totalExpense, INR, C.negative],
    ["Savings Rate", savingsRate, PCT, C.positive],
    ["Investments (Current)", totalCurrent, INR, C.primary],
    ["Investment P&L", totalCurrent - totalInvested, INR, totalCurrent >= totalInvested ? C.positive : C.negative],
    ["Total EMI", totalEmi, INR, C.warning],
    ["Unpaid Bills", totalBillsUnpaid, INR, C.warning],
    ["Goals Saved", totalGoalSaved, INR, C.primary],
    ["Goals Target", totalGoalTarget, INR, C.muted],
    ["Insurance Premium", totalInsurancePremium, INR, C.muted],
  ];

  let kr = 4;
  dash.getCell(kr, 1).value = "KEY METRICS";
  dash.getCell(kr, 1).font = { size: 12, bold: true, color: { argb: C.ink } };
  dash.getCell(kr, 4).value = "KEY METRICS";
  dash.getCell(kr, 4).font = { size: 12, bold: true, color: { argb: C.ink } };
  kr++;

  kpis.forEach((kpi, idx) => {
    const [label, value, fmt, color] = kpi;
    const col = idx % 2 === 0 ? 1 : 4;
    const row = 5 + Math.floor(idx / 2) * 2;
    const labelCell = dash.getCell(row, col);
    labelCell.value = label;
    labelCell.font = { size: 10, bold: true, color: { argb: C.muted } };
    labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.primarySoft } };
    const valCell = dash.getCell(row + 1, col);
    valCell.value = value;
    valCell.numFmt = fmt;
    valCell.font = { size: 16, bold: true, color: { argb: color } };
    valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.white } };
    dash.getRow(row).height = 16;
    dash.getRow(row + 1).height = 26;
  });

  // Accounts summary
  let ar = 20;
  dash.getCell(ar, 1).value = "ACCOUNTS";
  dash.getCell(ar, 1).font = { size: 12, bold: true, color: { argb: C.ink } };
  ar++;
  headerRow(dash, ar, ["Account", "Type", "", "Balance"]);
  dash.getCell(ar, 4).alignment = { horizontal: "right" };
  ar++;
  const accStart = ar;
  accounts.forEach((a) => {
    dash.getCell(ar, 1).value = a.name;
    dash.getCell(ar, 2).value = a.type;
    moneyCell(dash, ar, 4, num(a.balance));
    ar++;
  });
  zebra(dash, accStart, ar - 1, 4);
  dash.getCell(ar, 1).value = "TOTAL";
  dash.getCell(ar, 1).font = { bold: true };
  dash.getCell(ar, 4).value = { formula: `SUM(D${accStart}:D${ar - 1})` };
  dash.getCell(ar, 4).numFmt = INR;
  dash.getCell(ar, 4).font = { bold: true, color: { argb: C.primary } };

  // ══════════════════════════════════════════════════════════
  // SHEET 2: TRANSACTIONS (combined income + expense)
  // ══════════════════════════════════════════════════════════
  const wsTxn = wb.addWorksheet("Transactions", { properties: { tabColor: { argb: C.accent } } });
  wsTxn.columns = [{ width: 14 }, { width: 12 }, { width: 20 }, { width: 20 }, { width: 24 }, { width: 16 }];
  titleBlock(wsTxn, "Transaction Ledger", "All income and expenses in one place");
  headerRow(wsTxn, 4, ["Date", "Type", "Category", "Member", "Note", "Amount"]);
  let tr = 5;
  const sortedTxns = [...txns].sort((a, b) => new Date(b.txnDate).getTime() - new Date(a.txnDate).getTime());
  sortedTxns.forEach((t) => {
    wsTxn.getCell(tr, 1).value = new Date(t.txnDate);
    wsTxn.getCell(tr, 1).numFmt = "dd-mmm-yy";
    wsTxn.getCell(tr, 2).value = t.type;
    wsTxn.getCell(tr, 2).font = { color: { argb: t.type === "income" ? C.positive : C.negative }, bold: true };
    wsTxn.getCell(tr, 3).value = t.category;
    wsTxn.getCell(tr, 4).value = memberName(t.memberId);
    wsTxn.getCell(tr, 5).value = t.note ?? "";
    const amt = wsTxn.getCell(tr, 6);
    amt.value = num(t.amount);
    amt.numFmt = INR;
    amt.font = { color: { argb: t.type === "income" ? C.positive : C.negative } };
    tr++;
  });
  zebra(wsTxn, 5, tr - 1, 6);
  const txnLast = tr - 1;
  wsTxn.getCell(tr, 5).value = "TOTAL INCOME";
  wsTxn.getCell(tr, 5).font = { bold: true };
  wsTxn.getCell(tr, 6).value = { formula: `SUMIF(B5:B${txnLast},"income",F5:F${txnLast})` };
  wsTxn.getCell(tr, 6).numFmt = INR;
  wsTxn.getCell(tr, 6).font = { bold: true, color: { argb: C.positive } };
  tr++;
  wsTxn.getCell(tr, 5).value = "TOTAL EXPENSES";
  wsTxn.getCell(tr, 5).font = { bold: true };
  wsTxn.getCell(tr, 6).value = { formula: `SUMIF(B5:B${txnLast},"expense",F5:F${txnLast})` };
  wsTxn.getCell(tr, 6).numFmt = INR;
  wsTxn.getCell(tr, 6).font = { bold: true, color: { argb: C.negative } };
  tr++;
  wsTxn.getCell(tr, 5).value = "NET SAVINGS";
  wsTxn.getCell(tr, 5).font = { bold: true };
  wsTxn.getCell(tr, 6).value = { formula: `F${tr - 2}-F${tr - 1}` };
  wsTxn.getCell(tr, 6).numFmt = INR;
  wsTxn.getCell(tr, 6).font = { bold: true, color: { argb: C.primary } };
  wsTxn.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 3: BUDGET
  // ══════════════════════════════════════════════════════════
  const wsBud = wb.addWorksheet("Budget", { properties: { tabColor: { argb: C.primary } } });
  wsBud.columns = [{ width: 22 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 }];
  titleBlock(wsBud, "Budget Planner", "Planned vs actual spending");
  headerRow(wsBud, 4, ["Category", "Monthly Budget", "Actual Spent", "Difference", "% Used", "Status"]);
  let br = 5;
  budgets.forEach((b) => {
    wsBud.getCell(br, 1).value = b.category;
    moneyCell(wsBud, br, 2, num(b.monthlyLimit));
    const act = wsBud.getCell(br, 3);
    act.value = { formula: `SUMIFS(Transactions!$F$5:$F$${txnLast},Transactions!$C$5:$C$${txnLast},A${br},Transactions!$B$5:$B$${txnLast},"expense")` };
    act.numFmt = INR;
    const diff = wsBud.getCell(br, 4);
    diff.value = { formula: `B${br}-C${br}` };
    diff.numFmt = INR;
    const pct = wsBud.getCell(br, 5);
    pct.value = { formula: `IF(B${br}=0,0,C${br}/B${br})` };
    pct.numFmt = PCT;
    const st = wsBud.getCell(br, 6);
    st.value = { formula: `IF(C${br}>B${br},"⚠ OVER",IF(C${br}>=0.8*B${br},"👁 WATCH","✓ OK"))` };
    st.alignment = { horizontal: "center" };
    br++;
  });
  zebra(wsBud, 5, br - 1, 6);
  wsBud.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 4: FAMILY BUDGET
  // ══════════════════════════════════════════════════════════
  if (members.length > 0) {
    const wsFam = wb.addWorksheet("Family Budget", { properties: { tabColor: { argb: C.accent } } });
    wsFam.columns = [{ width: 22 }, { width: 16 }, { width: 16 }, { width: 16 }];
    titleBlock(wsFam, "Family Budget", "Spending per family member");
    headerRow(wsFam, 4, ["Member", "Income", "Expenses", "Savings"]);
    let fr = 5;
    members.forEach((m) => {
      wsFam.getCell(fr, 1).value = m.name;
      moneyCell(wsFam, fr, 2, txns.filter((t) => t.memberId === m.id && t.type === "income").reduce((s, t) => s + num(t.amount), 0), C.positive);
      moneyCell(wsFam, fr, 3, txns.filter((t) => t.memberId === m.id && t.type === "expense").reduce((s, t) => s + num(t.amount), 0), C.negative);
      const sv = wsFam.getCell(fr, 4);
      sv.value = { formula: `B${fr}-C${fr}` };
      sv.numFmt = INR;
      fr++;
    });
    zebra(wsFam, 5, fr - 1, 4);
    wsFam.views = [{ state: "frozen", ySplit: 4 }];
  }

  // ══════════════════════════════════════════════════════════
  // SHEET 5: SAVINGS GOALS
  // ══════════════════════════════════════════════════════════
  const wsGoal = wb.addWorksheet("Savings Goals", { properties: { tabColor: { argb: C.accent } } });
  wsGoal.columns = [{ width: 8 }, { width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];
  titleBlock(wsGoal, "Savings Goals", "Track progress toward your targets");
  headerRow(wsGoal, 4, ["Icon", "Goal", "Category", "Saved", "Target", "Remaining", "% Done"]);
  let gr = 5;
  goals.forEach((g) => {
    wsGoal.getCell(gr, 1).value = g.icon || "🎯";
    wsGoal.getCell(gr, 1).alignment = { horizontal: "center" };
    wsGoal.getCell(gr, 2).value = g.name;
    wsGoal.getCell(gr, 3).value = g.category;
    moneyCell(wsGoal, gr, 4, num(g.saved));
    moneyCell(wsGoal, gr, 5, num(g.target));
    const rem = wsGoal.getCell(gr, 6);
    rem.value = { formula: `E${gr}-D${gr}` };
    rem.numFmt = INR;
    const pct = wsGoal.getCell(gr, 7);
    pct.value = { formula: `IF(E${gr}=0,0,D${gr}/E${gr})` };
    pct.numFmt = PCT;
    gr++;
  });
  zebra(wsGoal, 5, gr - 1, 7);
  wsGoal.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 6: INVESTMENTS
  // ══════════════════════════════════════════════════════════
  const wsInv = wb.addWorksheet("Investments", { properties: { tabColor: { argb: C.primary } } });
  wsInv.columns = [{ width: 26 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }];
  titleBlock(wsInv, "Investment Portfolio", "Holdings, P&L and CAGR");
  headerRow(wsInv, 4, ["Name", "Type", "Units", "Invested", "Current Value", "P&L", "P&L %", "Symbol", "Start Date"]);
  let vr = 5;
  investments.forEach((iv) => {
    wsInv.getCell(vr, 1).value = iv.name;
    wsInv.getCell(vr, 2).value = iv.type;
    wsInv.getCell(vr, 3).value = iv.units ? num(iv.units) : "";
    moneyCell(wsInv, vr, 4, num(iv.invested));
    moneyCell(wsInv, vr, 5, num(iv.currentValue));
    const pnl = wsInv.getCell(vr, 6);
    pnl.value = { formula: `E${vr}-D${vr}` };
    pnl.numFmt = INR;
    const pnlPct = wsInv.getCell(vr, 7);
    pnlPct.value = { formula: `IF(D${vr}=0,0,(E${vr}-D${vr})/D${vr})` };
    pnlPct.numFmt = PCT;
    wsInv.getCell(vr, 8).value = iv.symbol || iv.schemeCode || "";
    if (iv.startDate) {
      wsInv.getCell(vr, 9).value = new Date(iv.startDate);
      wsInv.getCell(vr, 9).numFmt = "dd-mmm-yy";
    }
    vr++;
  });
  zebra(wsInv, 5, vr - 1, 9);
  wsInv.getCell(vr, 1).value = "TOTAL";
  wsInv.getCell(vr, 1).font = { bold: true };
  wsInv.getCell(vr, 4).value = { formula: `SUM(D5:D${vr - 1})` };
  wsInv.getCell(vr, 5).value = { formula: `SUM(E5:E${vr - 1})` };
  wsInv.getCell(vr, 6).value = { formula: `E${vr}-D${vr}` };
  [4, 5, 6].forEach((c) => { wsInv.getCell(vr, c).numFmt = INR; wsInv.getCell(vr, c).font = { bold: true }; });
  wsInv.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 7: DEBT
  // ══════════════════════════════════════════════════════════
  const wsDebt = wb.addWorksheet("Debt", { properties: { tabColor: { argb: C.negative } } });
  wsDebt.columns = [{ width: 26 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 14 }, { width: 16 }];
  titleBlock(wsDebt, "Debt & Loan Dashboard", "Balances, EMI and payoff timeline");
  headerRow(wsDebt, 4, ["Loan", "Type", "Principal", "Outstanding", "Rate %", "EMI", "Months to Payoff"]);
  let dr = 5;
  debts.forEach((d) => {
    wsDebt.getCell(dr, 1).value = d.name;
    wsDebt.getCell(dr, 2).value = d.type;
    moneyCell(wsDebt, dr, 3, num(d.principal));
    moneyCell(wsDebt, dr, 4, num(d.outstanding));
    const rate = wsDebt.getCell(dr, 5);
    rate.value = num(d.interestRate) / 100;
    rate.numFmt = PCT;
    moneyCell(wsDebt, dr, 6, num(d.emi));
    const nper = wsDebt.getCell(dr, 7);
    nper.value = { formula: `IFERROR(ROUNDUP(NPER(E${dr}/12,-F${dr},D${dr}),0),"—")` };
    dr++;
  });
  zebra(wsDebt, 5, dr - 1, 7);
  wsDebt.getCell(dr, 2).value = "TOTAL";
  wsDebt.getCell(dr, 2).font = { bold: true };
  wsDebt.getCell(dr, 4).value = { formula: `SUM(D5:D${dr - 1})` };
  wsDebt.getCell(dr, 6).value = { formula: `SUM(F5:F${dr - 1})` };
  [4, 6].forEach((c) => { wsDebt.getCell(dr, c).numFmt = INR; wsDebt.getCell(dr, c).font = { bold: true }; });
  wsDebt.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 8: NET WORTH
  // ══════════════════════════════════════════════════════════
  const wsNW = wb.addWorksheet("Net Worth", { properties: { tabColor: { argb: C.primary } } });
  wsNW.columns = [{ width: 16 }, { width: 18 }, { width: 18 }, { width: 18 }];
  titleBlock(wsNW, "Net Worth Tracker", "Monthly assets, liabilities & net worth");
  headerRow(wsNW, 4, ["Month", "Assets", "Liabilities", "Net Worth"]);
  let nr = 5;
  snaps.forEach((s) => {
    wsNW.getCell(nr, 1).value = new Date(s.snapshotDate);
    wsNW.getCell(nr, 1).numFmt = "mmm-yy";
    moneyCell(wsNW, nr, 2, num(s.assets));
    moneyCell(wsNW, nr, 3, num(s.liabilities));
    const net = wsNW.getCell(nr, 4);
    net.value = { formula: `B${nr}-C${nr}` };
    net.numFmt = INR;
    net.font = { bold: true, color: { argb: C.primary } };
    nr++;
  });
  zebra(wsNW, 5, nr - 1, 4);
  wsNW.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 9: BILLS
  // ══════════════════════════════════════════════════════════
  const wsBill = wb.addWorksheet("Bills", { properties: { tabColor: { argb: C.warning } } });
  wsBill.columns = [{ width: 26 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 14 }];
  titleBlock(wsBill, "Bill Tracker", "Due dates, amounts and reminders");
  headerRow(wsBill, 4, ["Bill", "Category", "Frequency", "Amount", "Due Date", "Paid?", "Days Left"]);
  let blr = 5;
  bills.forEach((b) => {
    wsBill.getCell(blr, 1).value = b.name;
    wsBill.getCell(blr, 2).value = b.category;
    wsBill.getCell(blr, 3).value = b.frequency;
    moneyCell(wsBill, blr, 4, num(b.amount));
    wsBill.getCell(blr, 5).value = new Date(b.dueDate);
    wsBill.getCell(blr, 5).numFmt = "dd-mmm-yy";
    const paid = wsBill.getCell(blr, 6);
    paid.value = b.paid ? "Yes" : "No";
    paid.alignment = { horizontal: "center" };
    paid.dataValidation = { type: "list", allowBlank: false, formulae: ['"Yes,No"'] };
    const days = wsBill.getCell(blr, 7);
    days.value = { formula: `IF(F${blr}="Yes","Paid",E${blr}-TODAY())` };
    days.alignment = { horizontal: "right" };
    blr++;
  });
  zebra(wsBill, 5, blr - 1, 7);
  wsBill.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 10: ANNUAL PLAN
  // ══════════════════════════════════════════════════════════
  const wsAnn = wb.addWorksheet("Annual Plan", { properties: { tabColor: { argb: C.primary } } });
  wsAnn.columns = [{ width: 8 }, { width: 40 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 14 }];
  titleBlock(wsAnn, "Annual Financial Planner", "Yearly goals & milestones");
  headerRow(wsAnn, 4, ["Year", "Goal", "Category", "Target", "Progress %", "Status"]);
  let anr = 5;
  annual.forEach((p) => {
    wsAnn.getCell(anr, 1).value = p.year;
    wsAnn.getCell(anr, 2).value = p.title;
    wsAnn.getCell(anr, 2).alignment = { horizontal: "left" };
    wsAnn.getCell(anr, 3).value = p.category;
    moneyCell(wsAnn, anr, 4, num(p.targetAmount));
    const pr = wsAnn.getCell(anr, 5);
    pr.value = p.progress / 100;
    pr.numFmt = PCT;
    wsAnn.getCell(anr, 6).value = p.status;
    wsAnn.getCell(anr, 6).alignment = { horizontal: "center" };
    anr++;
  });
  zebra(wsAnn, 5, anr - 1, 6);
  wsAnn.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 11: TAX PLANNER
  // ══════════════════════════════════════════════════════════
  const wsTax = wb.addWorksheet("Tax Planner", { properties: { tabColor: { argb: C.warning } } });
  wsTax.columns = [{ width: 34 }, { width: 18 }, { width: 6 }, { width: 30 }, { width: 18 }];
  titleBlock(wsTax, "Tax Planner (India)", "FY 2024-25 · Old vs New regime — edit blue cells");
  const taxRows: [string, number][] = [
    ["Gross Salary (annual)", tax ? num(tax.grossSalary) : 0],
    ["Business / Professional Income", tax ? num(tax.businessIncome) : 0],
    ["Capital Gains (LTCG equity)", tax ? num(tax.capitalGains) : 0],
    ["Section 80C (max 1.5L)", tax ? num(tax.section80c) : 0],
    ["Section 80D (health)", tax ? num(tax.section80d) : 0],
    ["HRA Exemption", tax ? num(tax.hraExemption) : 0],
    ["Home Loan Interest (max 2L)", tax ? num(tax.homeLoanInterest) : 0],
  ];
  let txr = 5;
  taxRows.forEach(([label, val]) => {
    wsTax.getCell(txr, 1).value = label;
    const c = wsTax.getCell(txr, 2);
    c.value = val;
    c.numFmt = INR;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.primarySoft } };
    c.border = { top: { style: "thin", color: { argb: C.border } }, bottom: { style: "thin", color: { argb: C.border } }, left: { style: "thin", color: { argb: C.border } }, right: { style: "thin", color: { argb: C.border } } };
    txr++;
  });
  const GS = "B5", BI = "B6", CG = "B7", S80C = "B8", S80D = "B9", HRA = "B10", HLI = "B11";

  wsTax.getCell("D4").value = "CALCULATION";
  wsTax.getCell("D4").font = { bold: true, color: { argb: C.ink } };
  const taxCalc: [string, string, string][] = [
    ["Base income", `${GS}+${BI}`, INR],
    ["Std deduction", "50000", INR],
    ["OLD: Total deductions", `50000+MIN(${S80C},150000)+MIN(${S80D},100000)+${HRA}+MIN(${HLI},200000)`, INR],
    ["OLD: Taxable income", `MAX(0,(${GS}+${BI})-(50000+MIN(${S80C},150000)+MIN(${S80D},100000)+${HRA}+MIN(${HLI},200000)))`, INR],
    ["NEW: Taxable income", `MAX(0,(${GS}+${BI})-50000)`, INR],
  ];
  let tcr = 5;
  taxCalc.forEach(([label, formula, fmt]) => {
    wsTax.getCell(tcr, 4).value = label;
    wsTax.getCell(tcr, 4).alignment = { horizontal: "left" };
    const cell = wsTax.getCell(tcr, 5);
    cell.value = { formula };
    cell.numFmt = fmt;
    tcr++;
  });
  wsTax.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 12: INSURANCE
  // ══════════════════════════════════════════════════════════
  const wsIns = wb.addWorksheet("Insurance", { properties: { tabColor: { argb: C.accent } } });
  wsIns.columns = [{ width: 26 }, { width: 12 }, { width: 18 }, { width: 14 }, { width: 16 }, { width: 14 }];
  titleBlock(wsIns, "Insurance Tracker", "Policies, premiums & renewals");
  headerRow(wsIns, 4, ["Policy", "Type", "Provider", "Premium", "Coverage", "Renewal"]);
  let isr = 5;
  insurance.forEach((p) => {
    wsIns.getCell(isr, 1).value = p.name;
    wsIns.getCell(isr, 2).value = p.type;
    wsIns.getCell(isr, 3).value = p.provider;
    moneyCell(wsIns, isr, 4, num(p.premium));
    moneyCell(wsIns, isr, 5, num(p.coverage));
    wsIns.getCell(isr, 6).value = new Date(p.renewalDate);
    wsIns.getCell(isr, 6).numFmt = "dd-mmm-yy";
    isr++;
  });
  zebra(wsIns, 5, isr - 1, 6);
  wsIns.getCell(isr, 3).value = "TOTAL";
  wsIns.getCell(isr, 3).font = { bold: true };
  wsIns.getCell(isr, 4).value = { formula: `SUM(D5:D${isr - 1})` };
  wsIns.getCell(isr, 5).value = { formula: `SUM(E5:E${isr - 1})` };
  [4, 5].forEach((c) => { wsIns.getCell(isr, c).numFmt = INR; wsIns.getCell(isr, c).font = { bold: true }; });
  wsIns.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // SHEET 13: EMERGENCY
  // ══════════════════════════════════════════════════════════
  const wsEmg = wb.addWorksheet("Emergency", { properties: { tabColor: { argb: C.negative } } });
  wsEmg.columns = [{ width: 12 }, { width: 40 }, { width: 40 }, { width: 10 }];
  titleBlock(wsEmg, "Emergency Planning", "Contacts & document checklist");
  headerRow(wsEmg, 4, ["Type", "Item", "Detail", "Done?"]);
  let emr = 5;
  emergency.forEach((e) => {
    wsEmg.getCell(emr, 1).value = e.kind;
    wsEmg.getCell(emr, 2).value = e.label;
    wsEmg.getCell(emr, 2).alignment = { horizontal: "left" };
    wsEmg.getCell(emr, 3).value = e.detail ?? "";
    wsEmg.getCell(emr, 3).alignment = { horizontal: "left" };
    const done = wsEmg.getCell(emr, 4);
    done.value = e.done ? "Yes" : "No";
    done.alignment = { horizontal: "center" };
    done.dataValidation = { type: "list", allowBlank: false, formulae: ['"Yes,No"'] };
    emr++;
  });
  zebra(wsEmg, 5, emr - 1, 4);
  wsEmg.views = [{ state: "frozen", ySplit: 4 }];

  // ══════════════════════════════════════════════════════════
  // Write buffer
  // ══════════════════════════════════════════════════════════
  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}
