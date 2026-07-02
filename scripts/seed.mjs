import pg from "pg";
import fs from "fs";

// Load DATABASE_URL from .env if not in environment
let url = process.env.DATABASE_URL;
if (!url && fs.existsSync(".env")) {
  const env = fs.readFileSync(".env", "utf8");
  const m = env.match(/DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
  if (m) url = m[1].trim();
}
url = url || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const pool = new pg.Pool({ connectionString: url });
const q = (text, params) => pool.query(text, params);

function d(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function rand(min, max) {
  return Math.round(min + Math.random() * (max - min));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seeding to", url);

  await q(`TRUNCATE members, accounts, transactions, budgets, goals, investments,
    debts, bills, insurance, net_worth_snapshots, annual_plans, tax_profile, emergency_items, watchlist
    RESTART IDENTITY CASCADE;`);

  // ---- Members ----
  const members = [
    ["Rajesh (Self)", "Self", "#6366f1"],
    ["Priya (Spouse)", "Spouse", "#ec4899"],
    ["Aarav (Son)", "Child", "#0ea5e9"],
    ["Anaya (Daughter)", "Child", "#f59e0b"],
    ["Mother", "Parent", "#10b981"],
    ["Household (Shared)", "Household", "#8b5cf6"],
  ];
  for (const [name, role, color] of members)
    await q(`INSERT INTO members (name, role, color) VALUES ($1,$2,$3)`, [name, role, color]);

  // ---- Accounts (liquid assets + other assets) ----
  // [name, type, category, balance, memberId]
  const accounts = [
    ["HDFC Savings", "Bank", "liquid", 485000, 1],      // Rajesh (Self)
    ["ICICI Salary Account", "Bank", "liquid", 162000, 2], // Priya (Spouse)
    ["Cash in Hand", "Cash", "liquid", 28000, 1],       // Rajesh
    ["Paytm / UPI Wallet", "Wallet", "liquid", 12500, 6], // Household
    ["Gold (Physical + Digital)", "Gold", "asset", 520000, 1], // Rajesh
    ["Gold (Spouse)", "Gold", "asset", 400000, 2],      // Priya
    ["Apartment - Pune", "RealEstate", "asset", 8500000, 1], // Joint - assigned to Rajesh
  ];
  for (const [name, type, cat, bal, memberId] of accounts)
    await q(`INSERT INTO accounts (name, type, category, balance, member_id) VALUES ($1,$2,$3,$4,$5)`, [
      name, type, cat, bal, memberId,
    ]);

  // ---- Budgets (monthly limits) ----
  const budgets = [
    ["Housing", 28000], ["Food", 14000], ["Groceries", 16000], ["Electricity", 4500],
    ["Water", 1200], ["Gas", 1300], ["Internet", 1100], ["Mobile", 1500],
    ["Transportation", 4000], ["Fuel", 7000], ["Insurance", 9000], ["Medical", 5000],
    ["Education", 18000], ["Shopping", 10000], ["Entertainment", 5000],
    ["Subscriptions", 2500], ["Travel", 8000], ["Gifts", 3000], ["Miscellaneous", 4000],
  ];
  for (const [cat, lim] of budgets)
    await q(`INSERT INTO budgets (category, monthly_limit) VALUES ($1,$2)`, [cat, lim]);

  // ---- Goals ----
  const goals = [
    ["Emergency Fund", "Emergency", 600000, 540000, "2026-12-31", "🛟"],
    ["Goa Family Vacation", "Vacation", 250000, 140000, "2026-05-30", "🏖️"],
    ["Dream Home Down Payment", "House", 2500000, 980000, "2028-04-01", "🏡"],
    ["New Car (SUV)", "Car", 1500000, 420000, "2027-03-31", "🚗"],
    ["Aarav's Higher Education", "Education", 4000000, 1250000, "2034-06-01", "🎓"],
    ["Anaya's Wedding Fund", "Wedding", 3000000, 600000, "2038-01-01", "💍"],
    ["Retirement Corpus", "Retirement", 50000000, 8200000, "2048-01-01", "🌅"],
  ];
  for (const [name, cat, target, saved, deadline, icon] of goals)
    await q(
      `INSERT INTO goals (name, category, target, saved, deadline, icon) VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, cat, target, saved, deadline, icon]
    );

  // ---- Investments ----
  // [name, type, invested, current, annualReturn, symbol, schemeCode, units, startDate, memberId]
  const investments = [
    ["UTI Nifty 50 Index Fund", "MutualFunds", 300000, 406000, 14.5, null, "120716", 1600, "2019-06-01", 1], // Rajesh
    ["UTI Nifty 50 (Spouse)", "MutualFunds", 300000, 406000, 14.5, null, "120716", 1600, "2019-06-01", 2], // Priya
    ["Parag Parikh Flexi Cap", "MutualFunds", 450000, 638000, 16.2, null, "122639", 8500, "2018-04-01", 1],
    ["Reliance Industries", "Stocks", 180000, 246000, 13.1, "RELIANCE.NS", null, 90, "2020-01-15", 1],
    ["TCS", "Stocks", 200000, 260000, 12.4, "TCS.NS", null, 65, "2019-11-10", 2],
    ["PPF Account", "PPF", 850000, 985000, 7.1, null, null, null, "2016-04-01", 1],
    ["EPF (Provident Fund)", "EPF", 1250000, 1420000, 8.15, null, null, null, "2015-01-01", 1],
    ["NPS Tier-1", "NPS", 320000, 398000, 10.4, null, null, null, "2019-03-01", 2],
    ["SBI Fixed Deposit", "FD", 500000, 535000, 6.8, null, null, null, "2023-01-01", 1],
    ["Recurring Deposit", "RD", 120000, 127000, 6.5, null, null, null, "2023-06-01", 2],
    ["Sovereign Gold Bond", "Gold", 300000, 421000, 11.8, null, null, null, "2020-08-01", 1],
    ["Govt Bonds", "Bonds", 200000, 214000, 7.2, null, null, null, "2022-04-01", 1],
  ];
  for (const [name, type, inv, cur, ret, symbol, scheme, units, start, memberId] of investments)
    await q(
      `INSERT INTO investments (name, type, invested, current_value, annual_return, symbol, scheme_code, units, start_date, member_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [name, type, inv, cur, ret, symbol, scheme, units, start, memberId]
    );

  // ---- Watchlist (live market tracking) ----
  const watch = [
    ["stock", "RELIANCE.NS", null, "Reliance Industries"],
    ["stock", "TCS.NS", null, "Tata Consultancy Services"],
    ["stock", "INFY.NS", null, "Infosys"],
    ["stock", "HDFCBANK.NS", null, "HDFC Bank"],
    ["stock", "^NSEI", null, "Nifty 50 Index"],
    ["mf", null, "122639", "Parag Parikh Flexi Cap Fund - Direct Growth"],
    ["mf", null, "120716", "UTI Nifty 50 Index Fund - Direct Growth"],
    ["mf", null, "119598", "SBI Bluechip Fund - Direct Growth"],
  ];
  for (const [kind, symbol, scheme, label] of watch)
    await q(
      `INSERT INTO watchlist (kind, symbol, scheme_code, label) VALUES ($1,$2,$3,$4)`,
      [kind, symbol, scheme, label]
    );

  // ---- Debts ----
  const debts = [
    ["HDFC Home Loan", "HomeLoan", 6500000, 5180000, 8.6, 52000, 240, 1], // Rajesh
    ["Car Loan - Maruti", "CarLoan", 900000, 410000, 9.2, 18500, 60, 1],
    ["HDFC Credit Card", "CreditCard", 80000, 42000, 42.0, 8000, 12, 2], // Priya
    ["Personal Loan", "PersonalLoan", 400000, 175000, 13.5, 12200, 36, 1],
  ];
  for (const [name, type, prin, out, rate, emi, ten, memberId] of debts)
    await q(
      `INSERT INTO debts (name, type, principal, outstanding, interest_rate, emi, tenure_months, member_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [name, type, prin, out, rate, emi, ten, memberId]
    );

  // ---- Bills ----
  const now = new Date();
  const yy = now.getFullYear();
  const mm = now.getMonth() + 1;
  const bills = [
    ["Apartment Rent / EMI", "Housing", 52000, d(yy, mm, 5), "Monthly", true],
    ["Electricity Bill", "Electricity", 4200, d(yy, mm, 12), "Monthly", false],
    ["Water Bill", "Water", 1100, d(yy, mm, 15), "Monthly", false],
    ["Piped Gas", "Gas", 1250, d(yy, mm, 14), "Monthly", true],
    ["Airtel Broadband", "Internet", 1099, d(yy, mm, 18), "Monthly", false],
    ["Jio Mobile (Family)", "Mobile", 1499, d(yy, mm, 20), "Monthly", false],
    ["School Fees - Aarav", "Education", 35000, d(yy, mm, 10), "Quarterly", false],
    ["Society Maintenance", "Housing", 4500, d(yy, mm, 7), "Monthly", true],
    ["Health Insurance Premium", "Insurance", 28000, d(yy, mm + 1 > 12 ? 1 : mm + 1, 22), "Yearly", false],
    ["Netflix + Prime + Spotify", "Subscriptions", 1497, d(yy, mm, 25), "Monthly", false],
  ];
  for (const [name, cat, amt, due, freq, paid] of bills)
    await q(
      `INSERT INTO bills (name, category, amount, due_date, frequency, paid) VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, cat, amt, due, freq, paid]
    );

  // ---- Insurance ----
  const insurance = [
    ["Family Floater Health", "Health", "Star Health", 28000, 1000000, d(yy + 1, 2, 22)],
    ["Term Life Insurance", "Life", "HDFC Life", 22000, 15000000, d(yy + 1, 6, 10)],
    ["Car Insurance", "Vehicle", "ICICI Lombard", 14500, 900000, d(yy, mm + 2 > 12 ? mm + 2 - 12 : mm + 2, 5)],
    ["Home Insurance", "Property", "Bajaj Allianz", 6500, 8500000, d(yy + 1, 4, 1)],
    ["Mother's Senior Health", "Health", "Niva Bupa", 38000, 500000, d(yy, mm + 1 > 12 ? 1 : mm + 1, 18)],
  ];
  for (const [name, type, prov, prem, cov, ren] of insurance)
    await q(
      `INSERT INTO insurance (name, type, provider, premium, coverage, renewal_date) VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, type, prov, prem, cov, ren]
    );

  // ---- Transactions (last 8 months) ----
  // Recurring monthly income
  const incomeStreams = [
    ["Salary", 165000, 1, 1],
    ["Salary", 95000, 1, 2], // spouse
    ["Freelancing", 28000, 2, 1],
    ["Rental Income", 22000, 5, 6],
    ["Business", 35000, 0, 1],
    ["Dividends", 6500, 8, 1],
    ["Interest", 4200, 11, 1],
  ];
  // category -> [min,max] monthly typical
  const expenseCats = {
    Housing: [56000, 57000],
    Food: [11000, 16000],
    Groceries: [14000, 19000],
    Electricity: [3500, 5200],
    Water: [1000, 1300],
    Gas: [1100, 1400],
    Internet: [1099, 1099],
    Mobile: [1499, 1499],
    Transportation: [3000, 5000],
    Fuel: [5500, 8500],
    Insurance: [8000, 11000],
    Medical: [2000, 9000],
    Education: [16000, 20000],
    Shopping: [6000, 14000],
    Entertainment: [3000, 7000],
    Subscriptions: [1497, 1497],
    Travel: [0, 18000],
    Gifts: [1000, 6000],
    Investments: [40000, 55000],
    Miscellaneous: [2000, 6000],
  };
  const memberByCat = {
    Education: [3, 4], Medical: [5, 1, 2], Shopping: [2, 1], Fuel: [1, 2],
    Entertainment: [3, 4, 1], Gifts: [6], Housing: [6], Groceries: [6],
  };

  for (let back = 7; back >= 0; back--) {
    const dt = new Date(yy, mm - 1 - back, 1);
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();

    for (const [cat, amt, member, day] of incomeStreams) {
      await q(
        `INSERT INTO transactions (type, category, amount, txn_date, member_id, note) VALUES ('income',$1,$2,$3,$4,$5)`,
        [cat, amt + rand(-2000, 3000), d(y, m, day), member || null, `${cat} for ${m}/${y}`]
      );
    }
    for (const [cat, [lo, hi]] of Object.entries(expenseCats)) {
      const total = rand(lo, hi);
      if (total <= 0) continue;
      // split into 1-3 transactions for realism
      const parts = cat === "Groceries" || cat === "Food" || cat === "Shopping" ? 3 : 1;
      let remaining = total;
      for (let p = 0; p < parts; p++) {
        const part = p === parts - 1 ? remaining : Math.round(total / parts) + rand(-500, 500);
        remaining -= part;
        if (part <= 0) continue;
        const mem = memberByCat[cat] ? pick(memberByCat[cat]) : 6;
        await q(
          `INSERT INTO transactions (type, category, amount, txn_date, member_id, note) VALUES ('expense',$1,$2,$3,$4,$5)`,
          [cat, part, d(y, m, rand(1, lastDay)), mem, cat]
        );
      }
    }
  }

  // ---- Net worth snapshots (last 12 months, trending up) ----
  let assets = 10800000;
  let liab = 6200000;
  for (let back = 11; back >= 0; back--) {
    const dt = new Date(yy, mm - 1 - back, 1);
    assets += rand(120000, 320000);
    liab -= rand(40000, 80000);
    await q(
      `INSERT INTO net_worth_snapshots (snapshot_date, assets, liabilities) VALUES ($1,$2,$3)`,
      [d(dt.getFullYear(), dt.getMonth() + 1, 1), assets, Math.max(liab, 0)]
    );
  }

  // ---- Annual plans ----
  const plans = [
    [yy, "Build 6-month emergency fund", "Savings", 600000, 90, "InProgress"],
    [yy, "Max out 80C (₹1.5L)", "Tax", 150000, 100, "Done"],
    [yy, "Invest ₹50k/month via SIP", "Investment", 600000, 75, "InProgress"],
    [yy, "Prepay ₹2L on home loan", "Financial", 200000, 40, "InProgress"],
    [yy, "Family Goa vacation", "Purchase", 250000, 56, "InProgress"],
    [yy, "Increase term cover to ₹2 Cr", "Financial", 0, 0, "Planned"],
    [yy + 1, "Down payment for dream home", "Purchase", 2500000, 39, "Planned"],
    [yy + 1, "Start NPS for extra 80CCD(1B)", "Tax", 50000, 0, "Planned"],
  ];
  for (const [year, title, cat, amt, prog, status] of plans)
    await q(
      `INSERT INTO annual_plans (year, title, category, target_amount, progress, status) VALUES ($1,$2,$3,$4,$5,$6)`,
      [year, title, cat, amt, prog, status]
    );

  // ---- Tax profile ----
  await q(
    `INSERT INTO tax_profile (regime, gross_salary, business_income, capital_gains, section_80c, section_80d, hra_exemption, home_loan_interest)
     VALUES ('old', 1980000, 420000, 180000, 150000, 47000, 180000, 200000)`
  );

  // ---- Emergency items ----
  const emergency = [
    ["contact", "Family Doctor - Dr. Sharma", "+91 98XXXXXX01", false],
    ["contact", "Insurance Advisor", "+91 98XXXXXX02", false],
    ["contact", "Bank Relationship Manager", "+91 98XXXXXX03", false],
    ["contact", "Lawyer / CA", "+91 98XXXXXX04", false],
    ["contact", "Ambulance / Hospital", "108 / Apollo Pune", true],
    ["document", "Aadhaar & PAN (all members)", "Stored in locker + digilocker", true],
    ["document", "Insurance policy documents", "Health, Life, Vehicle, Home", true],
    ["document", "Property papers & registry", "Bank locker", true],
    ["document", "Will / Nominee details", "Update nominees annually", false],
    ["document", "List of bank accounts & FDs", "Keep updated", false],
    ["document", "Investment account access plan", "Do NOT store passwords here", false],
  ];
  for (const [kind, label, detail, done] of emergency)
    await q(`INSERT INTO emergency_items (kind, label, detail, done) VALUES ($1,$2,$3,$4)`, [
      kind, label, detail, done,
    ]);

  console.log("✅ Seed complete");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
