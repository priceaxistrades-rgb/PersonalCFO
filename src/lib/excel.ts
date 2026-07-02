import ExcelJS from "exceljs";
import { num } from "./format";
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
  getTransactions,
  getWatchlist,
} from "./data";

// ---------- style helpers ----------
const INR = '"₹"#,##0';
const PCT = "0.0%";

const COL = {
  ink: "FF0F172A",
  muted: "FF64748B",
  faint: "FF94A3B8",
  primary: "FF4F46E5",
  primarySoft: "FFEEF2FF",
  head: "FF1E293B",
  band: "FFF8FAFC",
  border: "FFE6EAF2",
  success: "FF16A34A",
  successSoft: "FFDCFCE7",
  danger: "FFDC2626",
  dangerSoft: "FFFEE2E2",
  warning: "FFD97706",
  warningSoft: "FFFEF3C7",
  white: "FFFFFFFF",
};

function colToNum(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function parseAddr(a: string): { row: number; col: number } {
  const m = a.match(/^([A-Z]+)(\d+)$/);
  if (!m) return { row: 1, col: 1 };
  return { col: colToNum(m[1]), row: Number(m[2]) };
}

function titleBlock(ws: ExcelJS.Worksheet, title: string, subtitle: string) {
  ws.mergeCells("A1:H1");
  const t = ws.getCell("A1");
  t.value = title;
  t.font = { size: 20, bold: true, color: { argb: COL.ink } };
  ws.mergeCells("A2:H2");
  const s = ws.getCell("A2");
  s.value = subtitle;
  s.font = { size: 11, color: { argb: COL.muted } };
  ws.getRow(1).height = 28;
  ws.getRow(2).height = 18;
}

function headerRow(ws: ExcelJS.Worksheet, rowIdx: number, headers: string[]) {
  const row = ws.getRow(rowIdx);
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: COL.white }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL.head } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: COL.border } } };
  });
  row.height = 22;
}

function zebra(ws: ExcelJS.Worksheet, startRow: number, endRow: number, cols: number) {
  for (let r = startRow; r <= endRow; r++) {
    if ((r - startRow) % 2 === 1) {
      for (let c = 1; c <= cols; c++) {
        ws.getCell(r, c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COL.band },
        };
      }
    }
  }
}

// ---------- main builder ----------
export async function buildWorkbook(): Promise<ExcelJS.Buffer> {
  const [
    members,
    accounts,
    txns,
    budgets,
    goals,
    investments,
    debts,
    bills,
    insurance,
    snaps,
    annual,
    tax,
    emergency,
    watch,
  ] = await Promise.all([
    getMembers(),
    getAccounts(),
    getTransactions(),
    getBudgets(),
    getGoals(),
    getInvestments(),
    getDebts(),
    getBills(),
    getInsurance(),
    getSnapshots(),
    getAnnualPlans(),
    getTaxProfile(),
    getEmergencyItems(),
    getWatchlist(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Personal CFO — Indian Family Financial Planner";
  wb.created = new Date();

  // ===== COVER =====
  const cover = wb.addWorksheet("Home", { properties: { tabColor: { argb: COL.primary } } });
  // Reserve Dashboard as tab #2 (populated at the end once other sheets exist)
  const dash = wb.addWorksheet("Dashboard", { properties: { tabColor: { argb: COL.primary } } });
  cover.columns = [{ width: 3 }, { width: 30 }, { width: 30 }, { width: 30 }, { width: 20 }];
  cover.mergeCells("B2:E2");
  cover.getCell("B2").value = "📊  Personal CFO";
  cover.getCell("B2").font = { size: 26, bold: true, color: { argb: COL.primary } };
  cover.mergeCells("B3:E3");
  cover.getCell("B3").value = "Indian Family Financial Planner & Wealth Dashboard";
  cover.getCell("B3").font = { size: 13, color: { argb: COL.muted } };
  cover.mergeCells("B4:E4");
  cover.getCell("B4").value = `Generated ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`;
  cover.getCell("B4").font = { size: 10, italic: true, color: { argb: COL.faint } };

  const sheetsList = [
    ["Dashboard", "Net worth, cash, income/expense, savings rate, health score"],
    ["Income", "All earning sources with monthly totals"],
    ["Expenses", "Every transaction, categorised"],
    ["Budget", "Planned vs actual with overspend alerts"],
    ["Family Budget", "Spending per family member"],
    ["Savings Goals", "Goal progress with data bars"],
    ["Investments", "Portfolio, P&L and CAGR formulas"],
    ["Debt", "Loans, EMI and payoff timeline"],
    ["Net Worth", "Assets, liabilities and monthly trend"],
    ["Bills", "Due dates, status and reminders"],
    ["Annual Plan", "Yearly financial goals & milestones"],
    ["Tax Planner", "Old vs New regime auto-calculation"],
    ["Insurance", "Policies, premiums, renewal dates"],
    ["Emergency", "Contacts & document checklist"],
    ["Live Market", "Live stock price & MF NAV setup guide"],
  ];
  let r = 6;
  cover.getCell(`B${r}`).value = "WORKBOOK CONTENTS";
  cover.getCell(`B${r}`).font = { size: 11, bold: true, color: { argb: COL.ink } };
  r++;
  headerRow(cover, r, ["Sheet", "What's inside", "", ""]);
  cover.getCell(r, 2).alignment = { horizontal: "left" };
  r++;
  const coverStart = r;
  sheetsList.forEach(([name, desc]) => {
    cover.getCell(r, 1).value = "•";
    cover.getCell(r, 2).value = name;
    cover.getCell(r, 2).font = { bold: true, color: { argb: COL.primary } };
    cover.mergeCells(r, 3, r, 5);
    cover.getCell(r, 3).value = desc;
    cover.getCell(r, 3).font = { size: 10, color: { argb: COL.muted } };
    cover.getCell(r, 3).alignment = { horizontal: "left" };
    r++;
  });
  zebra(cover, coverStart, r - 1, 5);
  r += 1;
  cover.mergeCells(`B${r}:E${r + 3}`);
  const note = cover.getCell(`B${r}`);
  note.value =
    "💡 How to use: All figures are pre-filled from your dashboard and update automatically via formulas — just edit the coloured input cells. Green = income/positive, Red = expense/alert. See the 'Live Market' tab to pull real-time stock prices (Excel 365) and mutual fund NAVs (Power Query).";
  note.font = { size: 10, color: { argb: COL.ink } };
  note.alignment = { wrapText: true, vertical: "top" };
  note.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL.warningSoft } };

  // ===== INCOME =====
  const incomeTx = txns.filter((t) => t.type === "income");
  const wsInc = wb.addWorksheet("Income", { properties: { tabColor: { argb: COL.success } } });
  wsInc.columns = [{ width: 14 }, { width: 22 }, { width: 20 }, { width: 26 }, { width: 16 }];
  titleBlock(wsInc, "Income Tracker", "All household earning sources");
  headerRow(wsInc, 4, ["Date", "Source", "Member", "Note", "Amount"]);
  let ir = 5;
  const memberName = (id: number | null) => members.find((m) => m.id === id)?.name ?? "";
  incomeTx.forEach((t) => {
    wsInc.getCell(ir, 1).value = new Date(t.txnDate);
    wsInc.getCell(ir, 1).numFmt = "dd-mmm-yy";
    wsInc.getCell(ir, 2).value = t.category;
    wsInc.getCell(ir, 3).value = memberName(t.memberId);
    wsInc.getCell(ir, 4).value = t.note ?? "";
    const amt = wsInc.getCell(ir, 5);
    amt.value = num(t.amount);
    amt.numFmt = INR;
    amt.font = { color: { argb: COL.success } };
    ir++;
  });
  zebra(wsInc, 5, ir - 1, 5);
  wsInc.getCell(ir, 4).value = "TOTAL";
  wsInc.getCell(ir, 4).font = { bold: true };
  const incTotal = wsInc.getCell(ir, 5);
  incTotal.value = { formula: `SUM(E5:E${ir - 1})` };
  incTotal.numFmt = INR;
  incTotal.font = { bold: true, color: { argb: COL.success } };
  wsInc.views = [{ state: "frozen", ySplit: 4 }];
  const incTotalRef = `Income!E${ir}`;

  // ===== EXPENSES =====
  const expTx = txns.filter((t) => t.type === "expense");
  const wsExp = wb.addWorksheet("Expenses", { properties: { tabColor: { argb: COL.danger } } });
  wsExp.columns = [{ width: 14 }, { width: 20 }, { width: 20 }, { width: 24 }, { width: 16 }];
  titleBlock(wsExp, "Expense Tracker", "Every rupee, categorised");
  headerRow(wsExp, 4, ["Date", "Category", "Member", "Note", "Amount"]);
  let er = 5;
  expTx.forEach((t) => {
    wsExp.getCell(er, 1).value = new Date(t.txnDate);
    wsExp.getCell(er, 1).numFmt = "dd-mmm-yy";
    wsExp.getCell(er, 2).value = t.category;
    wsExp.getCell(er, 3).value = memberName(t.memberId);
    wsExp.getCell(er, 4).value = t.note ?? "";
    const amt = wsExp.getCell(er, 5);
    amt.value = num(t.amount);
    amt.numFmt = INR;
    amt.font = { color: { argb: COL.danger } };
    er++;
  });
  zebra(wsExp, 5, er - 1, 5);
  wsExp.getCell(er, 4).value = "TOTAL";
  wsExp.getCell(er, 4).font = { bold: true };
  const expTotal = wsExp.getCell(er, 5);
  expTotal.value = { formula: `SUM(E5:E${er - 1})` };
  expTotal.numFmt = INR;
  expTotal.font = { bold: true, color: { argb: COL.danger } };
  wsExp.views = [{ state: "frozen", ySplit: 4 }];
  const expDataEnd = er - 1;

  // ===== BUDGET =====
  const wsBud = wb.addWorksheet("Budget", { properties: { tabColor: { argb: COL.primary } } });
  wsBud.columns = [{ width: 22 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 }];
  titleBlock(wsBud, "Budget Planner", "Planned vs actual — data bars show usage");
  headerRow(wsBud, 4, ["Category", "Monthly Budget", "Actual Spent", "Difference", "% Used", "Status"]);
  let br = 5;
  budgets.forEach((b) => {
    const cat = b.category;
    wsBud.getCell(br, 1).value = cat;
    const bud = wsBud.getCell(br, 2);
    bud.value = num(b.monthlyLimit);
    bud.numFmt = INR;
    // Actual = SUMIF on Expenses sheet for current month
    const act = wsBud.getCell(br, 3);
    act.value = {
      formula: `SUMIFS(Expenses!$E$5:$E$${expDataEnd},Expenses!$B$5:$B$${expDataEnd},A${br},Expenses!$A$5:$A$${expDataEnd},">="&EOMONTH(TODAY(),-1)+1)`,
    };
    act.numFmt = INR;
    const diff = wsBud.getCell(br, 4);
    diff.value = { formula: `B${br}-C${br}` };
    diff.numFmt = INR;
    const pct = wsBud.getCell(br, 5);
    pct.value = { formula: `IF(B${br}=0,0,C${br}/B${br})` };
    pct.numFmt = PCT;
    const status = wsBud.getCell(br, 6);
    status.value = {
      formula: `IF(C${br}>B${br},"OVER",IF(C${br}>=0.8*B${br},"WATCH","OK"))`,
    };
    status.alignment = { horizontal: "center" };
    br++;
  });
  zebra(wsBud, 5, br - 1, 6);
  // totals
  wsBud.getCell(br, 1).value = "TOTAL";
  wsBud.getCell(br, 1).font = { bold: true };
  wsBud.getCell(br, 2).value = { formula: `SUM(B5:B${br - 1})` };
  wsBud.getCell(br, 3).value = { formula: `SUM(C5:C${br - 1})` };
  wsBud.getCell(br, 4).value = { formula: `SUM(D5:D${br - 1})` };
  [2, 3, 4].forEach((c) => {
    wsBud.getCell(br, c).numFmt = INR;
    wsBud.getCell(br, c).font = { bold: true };
  });
  // conditional formatting: data bars on % used, color on status
  wsBud.addConditionalFormatting({
    ref: `E5:E${br - 1}`,
    rules: [{ type: "dataBar", cfvo: [{ type: "num", value: 0 }, { type: "num", value: 1 }], color: { argb: COL.primary }, priority: 1 } as ExcelJS.ConditionalFormattingRule],
  });
  wsBud.addConditionalFormatting({
    ref: `F5:F${br - 1}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "OVER", priority: 2, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COL.dangerSoft } }, font: { color: { argb: COL.danger }, bold: true } } } as ExcelJS.ConditionalFormattingRule,
      { type: "containsText", operator: "containsText", text: "WATCH", priority: 3, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COL.warningSoft } }, font: { color: { argb: COL.warning }, bold: true } } } as ExcelJS.ConditionalFormattingRule,
      { type: "containsText", operator: "containsText", text: "OK", priority: 4, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: COL.successSoft } }, font: { color: { argb: COL.success }, bold: true } } } as ExcelJS.ConditionalFormattingRule,
    ],
  });
  wsBud.views = [{ state: "frozen", ySplit: 4 }];

  // ===== FAMILY BUDGET =====
  const wsFam = wb.addWorksheet("Family Budget", { properties: { tabColor: { argb: COL.primary } } });
  wsFam.columns = [{ width: 24 }, { width: 16 }, { width: 18 }, { width: 14 }];
  titleBlock(wsFam, "Family Budget Planner", "Spending per family member (this month)");
  headerRow(wsFam, 4, ["Member", "Role", "Monthly Spend", "% of Total"]);
  let fr = 5;
  members.forEach((m) => {
    wsFam.getCell(fr, 1).value = m.name;
    wsFam.getCell(fr, 2).value = m.role;
    const sp = wsFam.getCell(fr, 3);
    sp.value = {
      formula: `SUMIFS(Expenses!$E$5:$E$${expDataEnd},Expenses!$C$5:$C$${expDataEnd},A${fr},Expenses!$A$5:$A$${expDataEnd},">="&EOMONTH(TODAY(),-1)+1)`,
    };
    sp.numFmt = INR;
    const pc = wsFam.getCell(fr, 4);
    pc.value = { formula: `IF(SUM($C$5:$C$${5 + members.length - 1})=0,0,C${fr}/SUM($C$5:$C$${5 + members.length - 1}))` };
    pc.numFmt = PCT;
    fr++;
  });
  zebra(wsFam, 5, fr - 1, 4);
  wsFam.addConditionalFormatting({
    ref: `D5:D${fr - 1}`,
    rules: [{ type: "dataBar", cfvo: [{ type: "num", value: 0 }, { type: "num", value: 1 }], color: { argb: COL.primary }, priority: 1 } as ExcelJS.ConditionalFormattingRule],
  });
  wsFam.views = [{ state: "frozen", ySplit: 4 }];

  // ===== SAVINGS GOALS =====
  const wsGoal = wb.addWorksheet("Savings Goals", { properties: { tabColor: { argb: COL.success } } });
  wsGoal.columns = [{ width: 28 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 16 }, { width: 16 }];
  titleBlock(wsGoal, "Savings Dashboard", "Goal progress — edit 'Saved' to update");
  headerRow(wsGoal, 4, ["Goal", "Category", "Target", "Saved", "% Done", "Remaining", "Deadline"]);
  let gr = 5;
  goals.forEach((g) => {
    wsGoal.getCell(gr, 1).value = `${g.icon} ${g.name}`;
    wsGoal.getCell(gr, 2).value = g.category;
    const tgt = wsGoal.getCell(gr, 3);
    tgt.value = num(g.target);
    tgt.numFmt = INR;
    const sv = wsGoal.getCell(gr, 4);
    sv.value = num(g.saved);
    sv.numFmt = INR;
    sv.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL.successSoft } };
    const pct = wsGoal.getCell(gr, 5);
    pct.value = { formula: `IF(C${gr}=0,0,D${gr}/C${gr})` };
    pct.numFmt = PCT;
    const rem = wsGoal.getCell(gr, 6);
    rem.value = { formula: `MAX(0,C${gr}-D${gr})` };
    rem.numFmt = INR;
    if (g.deadline) {
      wsGoal.getCell(gr, 7).value = new Date(g.deadline);
      wsGoal.getCell(gr, 7).numFmt = "dd-mmm-yy";
    }
    gr++;
  });
  zebra(wsGoal, 5, gr - 1, 7);
  wsGoal.addConditionalFormatting({
    ref: `E5:E${gr - 1}`,
    rules: [{ type: "dataBar", cfvo: [{ type: "num", value: 0 }, { type: "num", value: 1 }], color: { argb: COL.success }, priority: 1 } as ExcelJS.ConditionalFormattingRule],
  });
  wsGoal.views = [{ state: "frozen", ySplit: 4 }];
  const goalSavedRef = `SUM('Savings Goals'!D5:D${gr - 1})`;

  // ===== INVESTMENTS =====
  const wsInv = wb.addWorksheet("Investments", { properties: { tabColor: { argb: COL.primary } } });
  wsInv.columns = [{ width: 30 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 14 }];
  titleBlock(wsInv, "Investment Dashboard", "Portfolio with auto P&L and CAGR");
  headerRow(wsInv, 4, ["Instrument", "Type", "Invested", "Current Value", "P&L", "P&L %", "CAGR", "Start Date"]);
  let vr = 5;
  investments.forEach((iv) => {
    wsInv.getCell(vr, 1).value = iv.name;
    wsInv.getCell(vr, 2).value = iv.type;
    const inv = wsInv.getCell(vr, 3);
    inv.value = num(iv.invested);
    inv.numFmt = INR;
    const cur = wsInv.getCell(vr, 4);
    cur.value = num(iv.currentValue);
    cur.numFmt = INR;
    cur.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL.primarySoft } };
    const pl = wsInv.getCell(vr, 5);
    pl.value = { formula: `D${vr}-C${vr}` };
    pl.numFmt = INR;
    const plp = wsInv.getCell(vr, 6);
    plp.value = { formula: `IF(C${vr}=0,0,(D${vr}-C${vr})/C${vr})` };
    plp.numFmt = PCT;
    const cagr = wsInv.getCell(vr, 7);
    if (iv.startDate) {
      wsInv.getCell(vr, 8).value = new Date(iv.startDate);
      wsInv.getCell(vr, 8).numFmt = "dd-mmm-yy";
      // CAGR = (Current/Invested)^(1/years)-1 ; years = (TODAY-start)/365.25
      cagr.value = {
        formula: `IF(OR(C${vr}=0,H${vr}=0),0,(D${vr}/C${vr})^(1/((TODAY()-H${vr})/365.25))-1)`,
      };
    } else {
      cagr.value = num(iv.annualReturn) / 100;
    }
    cagr.numFmt = PCT;
    vr++;
  });
  zebra(wsInv, 5, vr - 1, 8);
  wsInv.getCell(vr, 2).value = "TOTAL";
  wsInv.getCell(vr, 2).font = { bold: true };
  wsInv.getCell(vr, 3).value = { formula: `SUM(C5:C${vr - 1})` };
  wsInv.getCell(vr, 4).value = { formula: `SUM(D5:D${vr - 1})` };
  wsInv.getCell(vr, 5).value = { formula: `SUM(E5:E${vr - 1})` };
  [3, 4, 5].forEach((c) => {
    wsInv.getCell(vr, c).numFmt = INR;
    wsInv.getCell(vr, c).font = { bold: true };
  });
  wsInv.addConditionalFormatting({
    ref: `E5:E${vr - 1}`,
    rules: [
      { type: "cellIs", operator: "greaterThan", formulae: ["0"], priority: 1, style: { font: { color: { argb: COL.success } } } } as ExcelJS.ConditionalFormattingRule,
      { type: "cellIs", operator: "lessThan", formulae: ["0"], priority: 2, style: { font: { color: { argb: COL.danger } } } } as ExcelJS.ConditionalFormattingRule,
    ],
  });
  wsInv.views = [{ state: "frozen", ySplit: 4 }];
  const invCurrentRef = `Investments!D${vr}`;

  // ===== DEBT =====
  const wsDebt = wb.addWorksheet("Debt", { properties: { tabColor: { argb: COL.danger } } });
  wsDebt.columns = [{ width: 26 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 14 }, { width: 16 }];
  titleBlock(wsDebt, "Debt & Loan Dashboard", "Balances, EMI and payoff timeline");
  headerRow(wsDebt, 4, ["Loan", "Type", "Principal", "Outstanding", "Rate %", "EMI", "Months to Payoff"]);
  let dr = 5;
  debts.forEach((d) => {
    wsDebt.getCell(dr, 1).value = d.name;
    wsDebt.getCell(dr, 2).value = d.type;
    const pr = wsDebt.getCell(dr, 3);
    pr.value = num(d.principal);
    pr.numFmt = INR;
    const out = wsDebt.getCell(dr, 4);
    out.value = num(d.outstanding);
    out.numFmt = INR;
    const rate = wsDebt.getCell(dr, 5);
    rate.value = num(d.interestRate) / 100;
    rate.numFmt = PCT;
    const emi = wsDebt.getCell(dr, 6);
    emi.value = num(d.emi);
    emi.numFmt = INR;
    // NPER formula: months = -NPER(rate/12, emi, outstanding)
    const nper = wsDebt.getCell(dr, 7);
    nper.value = {
      formula: `IFERROR(ROUNDUP(NPER(E${dr}/12,-F${dr},D${dr}),0),"—")`,
    };
    dr++;
  });
  zebra(wsDebt, 5, dr - 1, 7);
  wsDebt.getCell(dr, 2).value = "TOTAL";
  wsDebt.getCell(dr, 2).font = { bold: true };
  wsDebt.getCell(dr, 4).value = { formula: `SUM(D5:D${dr - 1})` };
  wsDebt.getCell(dr, 6).value = { formula: `SUM(F5:F${dr - 1})` };
  [4, 6].forEach((c) => {
    wsDebt.getCell(dr, c).numFmt = INR;
    wsDebt.getCell(dr, c).font = { bold: true };
  });
  wsDebt.views = [{ state: "frozen", ySplit: 4 }];
  const debtOutRef = `Debt!D${dr}`;
  const emiTotalRef = `Debt!F${dr}`;

  // ===== NET WORTH =====
  const wsNW = wb.addWorksheet("Net Worth", { properties: { tabColor: { argb: COL.primary } } });
  wsNW.columns = [{ width: 16 }, { width: 18 }, { width: 18 }, { width: 18 } ];
  titleBlock(wsNW, "Net Worth Tracker", "Monthly assets, liabilities & net worth");
  headerRow(wsNW, 4, ["Month", "Assets", "Liabilities", "Net Worth"]);
  let nr = 5;
  snaps.forEach((s) => {
    wsNW.getCell(nr, 1).value = new Date(s.snapshotDate);
    wsNW.getCell(nr, 1).numFmt = "mmm-yy";
    wsNW.getCell(nr, 2).value = num(s.assets);
    wsNW.getCell(nr, 2).numFmt = INR;
    wsNW.getCell(nr, 3).value = num(s.liabilities);
    wsNW.getCell(nr, 3).numFmt = INR;
    const net = wsNW.getCell(nr, 4);
    net.value = { formula: `B${nr}-C${nr}` };
    net.numFmt = INR;
    net.font = { bold: true, color: { argb: COL.primary } };
    nr++;
  });
  zebra(wsNW, 5, nr - 1, 4);
  wsNW.addConditionalFormatting({
    ref: `D5:D${nr - 1}`,
    rules: [{ type: "dataBar", cfvo: [{ type: "min" }, { type: "max" }], color: { argb: COL.primary }, priority: 1 } as ExcelJS.ConditionalFormattingRule],
  });
  wsNW.getCell(nr + 1, 1).value = "Assets = cash + investments + property. Liabilities = loans outstanding.";
  wsNW.getCell(nr + 1, 1).font = { italic: true, size: 9, color: { argb: COL.faint } };
  wsNW.views = [{ state: "frozen", ySplit: 4 }];

  // ===== BILLS =====
  const wsBill = wb.addWorksheet("Bills", { properties: { tabColor: { argb: COL.warning } } });
  wsBill.columns = [{ width: 26 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 14 }];
  titleBlock(wsBill, "Bill Tracker", "Due dates, amounts and reminders");
  headerRow(wsBill, 4, ["Bill", "Category", "Frequency", "Amount", "Due Date", "Paid?", "Days Left"]);
  let blr = 5;
  bills.forEach((b) => {
    wsBill.getCell(blr, 1).value = b.name;
    wsBill.getCell(blr, 2).value = b.category;
    wsBill.getCell(blr, 3).value = b.frequency;
    wsBill.getCell(blr, 4).value = num(b.amount);
    wsBill.getCell(blr, 4).numFmt = INR;
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
  wsBill.addConditionalFormatting({
    ref: `F5:F${blr - 1}`,
    rules: [
      { type: "containsText", operator: "containsText", text: "Yes", priority: 1, style: { font: { color: { argb: COL.success }, bold: true } } } as ExcelJS.ConditionalFormattingRule,
      { type: "containsText", operator: "containsText", text: "No", priority: 2, style: { font: { color: { argb: COL.danger }, bold: true } } } as ExcelJS.ConditionalFormattingRule,
    ],
  });
  wsBill.views = [{ state: "frozen", ySplit: 4 }];
  const billsUnpaidRef = `SUMIFS(Bills!D5:D${blr - 1},Bills!F5:F${blr - 1},"No")`;

  // ===== ANNUAL PLAN =====
  const wsAnn = wb.addWorksheet("Annual Plan", { properties: { tabColor: { argb: COL.primary } } });
  wsAnn.columns = [{ width: 8 }, { width: 40 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 14 }];
  titleBlock(wsAnn, "Annual Financial Planner", "Yearly goals & milestones");
  headerRow(wsAnn, 4, ["Year", "Goal", "Category", "Target", "Progress %", "Status"]);
  let ar = 5;
  annual.forEach((p) => {
    wsAnn.getCell(ar, 1).value = p.year;
    wsAnn.getCell(ar, 2).value = p.title;
    wsAnn.getCell(ar, 2).alignment = { horizontal: "left" };
    wsAnn.getCell(ar, 3).value = p.category;
    wsAnn.getCell(ar, 4).value = num(p.targetAmount);
    wsAnn.getCell(ar, 4).numFmt = INR;
    const pr = wsAnn.getCell(ar, 5);
    pr.value = p.progress / 100;
    pr.numFmt = PCT;
    wsAnn.getCell(ar, 6).value = p.status;
    wsAnn.getCell(ar, 6).alignment = { horizontal: "center" };
    ar++;
  });
  zebra(wsAnn, 5, ar - 1, 6);
  wsAnn.addConditionalFormatting({
    ref: `E5:E${ar - 1}`,
    rules: [{ type: "dataBar", cfvo: [{ type: "num", value: 0 }, { type: "num", value: 1 }], color: { argb: COL.primary }, priority: 1 } as ExcelJS.ConditionalFormattingRule],
  });
  wsAnn.views = [{ state: "frozen", ySplit: 4 }];

  // ===== TAX PLANNER =====
  const wsTax = wb.addWorksheet("Tax Planner", { properties: { tabColor: { argb: COL.warning } } });
  wsTax.columns = [{ width: 34 }, { width: 18 }, { width: 6 }, { width: 30 }, { width: 18 }];
  titleBlock(wsTax, "Tax Planner (India)", "FY 2024-25 · Old vs New regime — edit blue cells");
  const taxRows: [string, number][] = [
    ["Gross Salary (annual)", tax ? num(tax.grossSalary) : 1980000],
    ["Business / Professional Income", tax ? num(tax.businessIncome) : 420000],
    ["Capital Gains (LTCG equity)", tax ? num(tax.capitalGains) : 180000],
    ["Section 80C (max 1.5L)", tax ? num(tax.section80c) : 150000],
    ["Section 80D (health)", tax ? num(tax.section80d) : 47000],
    ["HRA Exemption", tax ? num(tax.hraExemption) : 180000],
    ["Home Loan Interest (max 2L)", tax ? num(tax.homeLoanInterest) : 200000],
  ];
  let tr = 5;
  taxRows.forEach(([label, val]) => {
    wsTax.getCell(tr, 1).value = label;
    const c = wsTax.getCell(tr, 2);
    c.value = val;
    c.numFmt = INR;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL.primarySoft } };
    c.border = { top: { style: "thin", color: { argb: COL.border } }, bottom: { style: "thin", color: { argb: COL.border } }, left: { style: "thin", color: { argb: COL.border } }, right: { style: "thin", color: { argb: COL.border } } };
    tr++;
  });
  // named cells
  const GS = "B5", BI = "B6", CG = "B7", S80C = "B8", S80D = "B9", HRA = "B10", HLI = "B11";
  // Results block on the right
  wsTax.getCell("D4").value = "CALCULATION";
  wsTax.getCell("D4").font = { bold: true, color: { argb: COL.ink } };
  const resLines: [string, string, string][] = [
    ["Base income (salary+business)", `${GS}+${BI}`, INR],
    ["Std deduction", "50000", INR],
    ["— OLD regime —", "", ""],
    ["Total deductions (OLD)", `50000+MIN(${S80C},150000)+MIN(${S80D},100000)+${HRA}+MIN(${HLI},200000)`, INR],
    ["Taxable income (OLD)", `MAX(0,(${GS}+${BI})-(50000+MIN(${S80C},150000)+MIN(${S80D},100000)+${HRA}+MIN(${HLI},200000)))`, INR],
    ["— NEW regime —", "", ""],
    ["Taxable income (NEW)", `MAX(0,(${GS}+${BI})-50000)`, INR],
  ];
  let tres = 5;
  resLines.forEach(([label, formula, fmt]) => {
    wsTax.getCell(tres, 4).value = label;
    wsTax.getCell(tres, 4).alignment = { horizontal: "left" };
    if (formula) {
      const cell = wsTax.getCell(tres, 5);
      cell.value = { formula };
      cell.numFmt = fmt;
    } else {
      wsTax.getCell(tres, 4).font = { bold: true, color: { argb: COL.muted } };
    }
    tres++;
  });
  // Old taxable at E9, New taxable at E11 (based on layout above)
  const oldTaxable = "E9";
  const newTaxable = "E11";
  // Tax formulas (slab), with 87A rebate and 4% cess + LTCG
  const oldSlab = `(MAX(0,MIN(${oldTaxable},500000)-250000)*0.05+MAX(0,MIN(${oldTaxable},1000000)-500000)*0.2+MAX(0,${oldTaxable}-1000000)*0.3)`;
  const oldTax = `IF(${oldTaxable}<=500000,0,${oldSlab})*1.04+MAX(0,${CG}-125000)*0.125`;
  const newSlab = `(MAX(0,MIN(${newTaxable},700000)-300000)*0.05+MAX(0,MIN(${newTaxable},1000000)-700000)*0.1+MAX(0,MIN(${newTaxable},1200000)-1000000)*0.15+MAX(0,MIN(${newTaxable},1500000)-1200000)*0.2+MAX(0,${newTaxable}-1500000)*0.3)`;
  const newTax = `IF(${newTaxable}<=700000,0,${newSlab})*1.04+MAX(0,${CG}-125000)*0.125`;
  tres += 1;
  wsTax.getCell(tres, 4).value = "TAX PAYABLE (OLD)";
  wsTax.getCell(tres, 4).font = { bold: true };
  const oldTaxCell = wsTax.getCell(tres, 5);
  oldTaxCell.value = { formula: oldTax };
  oldTaxCell.numFmt = INR;
  oldTaxCell.font = { bold: true, color: { argb: COL.danger } };
  const oldTaxAddr = `E${tres}`;
  tres++;
  wsTax.getCell(tres, 4).value = "TAX PAYABLE (NEW)";
  wsTax.getCell(tres, 4).font = { bold: true };
  const newTaxCell = wsTax.getCell(tres, 5);
  newTaxCell.value = { formula: newTax };
  newTaxCell.numFmt = INR;
  newTaxCell.font = { bold: true, color: { argb: COL.danger } };
  const newTaxAddr = `E${tres}`;
  tres++;
  wsTax.getCell(tres, 4).value = "RECOMMENDED";
  wsTax.getCell(tres, 4).font = { bold: true };
  const rec = wsTax.getCell(tres, 5);
  rec.value = { formula: `IF(${oldTaxAddr}<=${newTaxAddr},"OLD regime","NEW regime")` };
  rec.font = { bold: true, color: { argb: COL.success } };
  tres++;
  wsTax.getCell(tres, 4).value = "You save";
  const save = wsTax.getCell(tres, 5);
  save.value = { formula: `ABS(${oldTaxAddr}-${newTaxAddr})` };
  save.numFmt = INR;
  save.font = { bold: true, color: { argb: COL.success } };

  // ===== INSURANCE =====
  const wsIns = wb.addWorksheet("Insurance", { properties: { tabColor: { argb: COL.success } } });
  wsIns.columns = [{ width: 26 }, { width: 12 }, { width: 18 }, { width: 14 }, { width: 16 }, { width: 14 }];
  titleBlock(wsIns, "Insurance Tracker", "Policies, premiums & renewals");
  headerRow(wsIns, 4, ["Policy", "Type", "Provider", "Premium", "Coverage", "Renewal"]);
  let isr = 5;
  insurance.forEach((p) => {
    wsIns.getCell(isr, 1).value = p.name;
    wsIns.getCell(isr, 2).value = p.type;
    wsIns.getCell(isr, 3).value = p.provider;
    wsIns.getCell(isr, 4).value = num(p.premium);
    wsIns.getCell(isr, 4).numFmt = INR;
    wsIns.getCell(isr, 5).value = num(p.coverage);
    wsIns.getCell(isr, 5).numFmt = INR;
    wsIns.getCell(isr, 6).value = new Date(p.renewalDate);
    wsIns.getCell(isr, 6).numFmt = "dd-mmm-yy";
    isr++;
  });
  zebra(wsIns, 5, isr - 1, 6);
  wsIns.getCell(isr, 3).value = "TOTAL";
  wsIns.getCell(isr, 3).font = { bold: true };
  wsIns.getCell(isr, 4).value = { formula: `SUM(D5:D${isr - 1})` };
  wsIns.getCell(isr, 5).value = { formula: `SUM(E5:E${isr - 1})` };
  [4, 5].forEach((c) => {
    wsIns.getCell(isr, c).numFmt = INR;
    wsIns.getCell(isr, c).font = { bold: true };
  });
  wsIns.views = [{ state: "frozen", ySplit: 4 }];

  // ===== EMERGENCY =====
  const wsEmg = wb.addWorksheet("Emergency", { properties: { tabColor: { argb: COL.danger } } });
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
  wsEmg.getCell(emr + 1, 1).value = "🔒 Never store passwords, PINs or OTPs here. Note only where to find them.";
  wsEmg.mergeCells(emr + 1, 1, emr + 1, 4);
  wsEmg.getCell(emr + 1, 1).font = { italic: true, color: { argb: COL.danger } };
  wsEmg.views = [{ state: "frozen", ySplit: 4 }];

  // ===== LIVE MARKET =====
  const wsMkt = wb.addWorksheet("Live Market", { properties: { tabColor: { argb: COL.primary } } });
  wsMkt.columns = [{ width: 34 }, { width: 18 }, { width: 16 }, { width: 40 }];
  titleBlock(wsMkt, "Live Market Data & CAGR", "Pull real-time stock prices & mutual fund NAV");
  headerRow(wsMkt, 4, ["Instrument", "Symbol / Code", "Live Price / NAV", "Setup"]);
  let mr = 5;
  watch.forEach((w) => {
    wsMkt.getCell(mr, 1).value = w.label;
    wsMkt.getCell(mr, 1).alignment = { horizontal: "left" };
    wsMkt.getCell(mr, 2).value = w.kind === "stock" ? w.symbol : w.schemeCode;
    wsMkt.getCell(mr, 3).value = w.kind === "stock" ? "use STOCKHISTORY" : "use Power Query";
    wsMkt.getCell(mr, 3).font = { color: { argb: COL.faint }, italic: true };
    wsMkt.getCell(mr, 4).value = w.kind === "stock" ? "Excel 365 Stocks data type" : `mfapi.in/mf/${w.schemeCode}`;
    wsMkt.getCell(mr, 4).alignment = { horizontal: "left" };
    wsMkt.getCell(mr, 4).font = { size: 9, color: { argb: COL.muted } };
    mr++;
  });
  zebra(wsMkt, 5, mr - 1, 4);
  mr += 2;
  const guide = [
    "📈 LIVE STOCK PRICES (Excel 365 / Microsoft 365):",
    "  1. Type the company name in a cell (e.g. 'Reliance Industries').",
    "  2. Select it → Data tab → 'Stocks' (Data Types). It converts to a linked entity.",
    "  3. In the next cell use =A1.Price , =A1.[52 Week High] etc. Right-click → Refresh for live data.",
    "  4. Or use =STOCKHISTORY(\"XNSE:RELIANCE\", TODAY()-30, TODAY()) for a price series.",
    "",
    "🏦 LIVE MUTUAL FUND NAV (all Excel versions with Power Query):",
    "  1. Data tab → Get Data → From Web.",
    "  2. Paste URL:  https://api.mfapi.in/mf/122639   (replace with your scheme code).",
    "  3. In the Navigator, expand 'data' → To Table → expand the 'nav' & 'date' columns → Close & Load.",
    "  4. The latest row is today's NAV. Right-click the query → Refresh to update.",
    "",
    "📐 CAGR FORMULA (works anywhere):",
    "  =(EndValue/StartValue)^(1/Years)-1     e.g. =(NAV_today/NAV_5yr_ago)^(1/5)-1",
    "  The 'Investments' sheet already computes CAGR automatically from your Start Date column.",
    "",
    "🔄 AUTO-REFRESH: Data tab → Queries & Connections → Refresh All (or set refresh every N minutes in query properties).",
  ];
  guide.forEach((line) => {
    wsMkt.getCell(mr, 1).value = line;
    wsMkt.mergeCells(mr, 1, mr, 4);
    wsMkt.getCell(mr, 1).alignment = { horizontal: "left" };
    wsMkt.getCell(mr, 1).font = line.match(/^[📈🏦📐🔄]/)
      ? { bold: true, color: { argb: COL.primary } }
      : { size: 10, color: { argb: COL.ink } };
    mr++;
  });

  // ===== DASHBOARD (built last, references others) =====
  dash.columns = [
    { width: 22 }, { width: 18 }, { width: 4 }, { width: 22 }, { width: 18 }, { width: 4 }, { width: 22 }, { width: 18 },
  ];
  titleBlock(dash, "Financial Dashboard", "Auto-summary — all figures pull from other sheets");

  // KPI grid — use latest Net Worth snapshot & sheet references
  const netWorthLatest = `'Net Worth'!D${nr - 1}`;
  const liquidCash = accounts.filter((a) => a.category === "liquid").reduce((s, a) => s + num(a.balance), 0);

  const kpiDefs: { cell: string; label: string; formula: string; fmt: string; color?: string }[] = [
    { cell: "A4", label: "NET WORTH", formula: netWorthLatest, fmt: INR, color: COL.primary },
    { cell: "D4", label: "CASH AVAILABLE", formula: `${liquidCash}`, fmt: INR, color: COL.success },
    { cell: "G4", label: "INVESTMENTS (CURRENT)", formula: invCurrentRef, fmt: INR, color: COL.primary },
    { cell: "A7", label: "MONTHLY INCOME", formula: incTotalRef, fmt: INR, color: COL.success },
    { cell: "D7", label: "MONTHLY EXPENSES", formula: expTotal.address, fmt: INR, color: COL.danger },
    { cell: "G7", label: "SAVINGS RATE", formula: `IF(${incTotalRef}=0,0,(${incTotalRef}-${expTotal.address})/${incTotalRef})`, fmt: PCT, color: COL.success },
    { cell: "A10", label: "TOTAL EMI", formula: emiTotalRef, fmt: INR, color: COL.warning },
    { cell: "D10", label: "OUTSTANDING DEBT", formula: debtOutRef, fmt: INR, color: COL.danger },
    { cell: "G10", label: "UNPAID BILLS", formula: billsUnpaidRef, fmt: INR, color: COL.warning },
    { cell: "A13", label: "TOTAL SAVED (GOALS)", formula: goalSavedRef, fmt: INR, color: COL.success },
    { cell: "D13", label: "EMERGENCY FUND (MONTHS)", formula: `IF(${expTotal.address}=0,0,${goalSavedRef}/${expTotal.address})`, fmt: "0.0", color: COL.primary },
    { cell: "G13", label: "TAX PAYABLE (BEST)", formula: `MIN('Tax Planner'!${oldTaxAddr},'Tax Planner'!${newTaxAddr})`, fmt: INR, color: COL.danger },
  ];
  kpiDefs.forEach((k) => {
    const { row, col } = parseAddr(k.cell);
    // label
    dash.mergeCells(row, col, row, col + 1);
    const lab = dash.getCell(row, col);
    lab.value = k.label;
    lab.font = { size: 9, bold: true, color: { argb: COL.muted } };
    lab.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL.primarySoft } };
    lab.border = { top: { style: "thin", color: { argb: COL.border } }, left: { style: "thin", color: { argb: COL.border } }, right: { style: "thin", color: { argb: COL.border } } };
    // value
    dash.mergeCells(row + 1, col, row + 1, col + 1);
    const val = dash.getCell(row + 1, col);
    val.value = { formula: k.formula };
    val.numFmt = k.fmt;
    val.font = { size: 16, bold: true, color: { argb: k.color ?? COL.ink } };
    val.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL.white } };
    val.border = { bottom: { style: "thin", color: { argb: COL.border } }, left: { style: "thin", color: { argb: COL.border } }, right: { style: "thin", color: { argb: COL.border } } };
    dash.getRow(row).height = 16;
    dash.getRow(row + 1).height = 26;
  });

  // Category spend mini-table
  let dcr = 17;
  dash.getCell(dcr, 1).value = "TOP EXPENSE CATEGORIES (this month)";
  dash.getCell(dcr, 1).font = { bold: true, color: { argb: COL.ink } };
  dcr++;
  headerRow(dash, dcr, ["Category", "Spent", "", ""]);
  dash.getCell(dcr, 1).alignment = { horizontal: "left" };
  dcr++;
  const topCats = budgets.slice(0, 8);
  const dcStart = dcr;
  topCats.forEach((b) => {
    dash.getCell(dcr, 1).value = b.category;
    const c = dash.getCell(dcr, 2);
    c.value = {
      formula: `SUMIFS(Expenses!$E$5:$E$${expDataEnd},Expenses!$B$5:$B$${expDataEnd},A${dcr},Expenses!$A$5:$A$${expDataEnd},">="&EOMONTH(TODAY(),-1)+1)`,
    };
    c.numFmt = INR;
    dcr++;
  });
  zebra(dash, dcStart, dcr - 1, 2);
  dash.addConditionalFormatting({
    ref: `B${dcStart}:B${dcr - 1}`,
    rules: [{ type: "dataBar", cfvo: [{ type: "min" }, { type: "max" }], color: { argb: COL.danger }, priority: 1 } as ExcelJS.ConditionalFormattingRule],
  });

  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}
