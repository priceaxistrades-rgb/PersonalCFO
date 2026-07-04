import { db } from "@/db";
import {
  accounts,
  annualPlans,
  bills,
  budgets,
  debts,
  emergencyItems,
  goals,
  insurance,
  investments,
  members,
  netWorthSnapshots,
  taxProfile,
  transactions,
  users,
  watchlist,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const DEMO_EMAIL = "demo@personalcfo.app";
export const DEMO_PASSWORD = "Demo@12345";

function d(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function findOrCreateDemoUser() {
  const userSelect = {
    id: users.id,
    email: users.email,
    password: users.password,
    name: users.name,
  };

  const [existing] = await db
    .select(userSelect)
    .from(users)
    .where(eq(users.email, DEMO_EMAIL));

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      password: await bcrypt.hash(DEMO_PASSWORD, 12),
      name: "Demo Family",
    })
    .returning(userSelect);

  return created;
}

export async function ensureDemoUserWithData() {
  const user = await findOrCreateDemoUser();
  const [firstMember] = await db.select().from(members).where(eq(members.userId, user.id)).limit(1);
  if (firstMember) return user;

  const now = new Date();
  const yy = now.getFullYear();
  const mm = now.getMonth() + 1;

  const insertedMembers = await db
    .insert(members)
    .values([
      { userId: user.id, name: "Rajesh (Self)", role: "Self", color: "#6366f1" },
      { userId: user.id, name: "Priya (Spouse)", role: "Spouse", color: "#ec4899" },
      { userId: user.id, name: "Household", role: "Household", color: "#8b5cf6" },
    ])
    .returning();

  const self = insertedMembers[0].id;
  const spouse = insertedMembers[1].id;
  const household = insertedMembers[2].id;

  await db.insert(accounts).values([
    { userId: user.id, name: "HDFC Savings", type: "Bank", category: "liquid", balance: "485000", memberId: self },
    { userId: user.id, name: "ICICI Salary", type: "Bank", category: "liquid", balance: "162000", memberId: spouse },
    { userId: user.id, name: "Gold", type: "Gold", category: "asset", balance: "520000", memberId: self },
  ]);

  await db.insert(budgets).values([
    { userId: user.id, category: "Housing", monthlyLimit: "52000" },
    { userId: user.id, category: "Groceries", monthlyLimit: "18000" },
    { userId: user.id, category: "Investments", monthlyLimit: "50000" },
  ]);

  await db.insert(goals).values([
    { userId: user.id, name: "Emergency Fund", category: "Emergency", target: "600000", saved: "420000", deadline: d(yy, 12, 31), icon: "🛟" },
    { userId: user.id, name: "Family Vacation", category: "Vacation", target: "250000", saved: "90000", deadline: d(yy + 1, 5, 30), icon: "🏖️" },
  ]);

  await db.insert(investments).values([
    { userId: user.id, name: "Reliance Industries", type: "Stocks", invested: "180000", currentValue: "246000", annualReturn: "13.1", symbol: "RELIANCE.NS", units: "90", startDate: "2020-01-15", memberId: self },
    { userId: user.id, name: "TCS", type: "Stocks", invested: "200000", currentValue: "260000", annualReturn: "12.4", symbol: "TCS.NS", units: "65", startDate: "2019-11-10", memberId: spouse },
    { userId: user.id, name: "Parag Parikh Flexi Cap", type: "MutualFunds", invested: "450000", currentValue: "638000", annualReturn: "16.2", schemeCode: "122639", units: "8500", startDate: "2018-04-01", memberId: self },
  ]);

  await db.insert(watchlist).values([
    { userId: user.id, kind: "stock", symbol: "RELIANCE.NS", label: "Reliance Industries" },
    { userId: user.id, kind: "stock", symbol: "TCS.NS", label: "Tata Consultancy Services" },
    { userId: user.id, kind: "stock", symbol: "INFY.NS", label: "Infosys" },
    { userId: user.id, kind: "stock", symbol: "^NSEI", label: "Nifty 50" },
    { userId: user.id, kind: "mf", schemeCode: "122639", label: "Parag Parikh Flexi Cap Fund - Direct Growth" },
    { userId: user.id, kind: "mf", schemeCode: "120716", label: "UTI Nifty 50 Index Fund - Direct Growth" },
  ]);

  await db.insert(debts).values([
    { userId: user.id, name: "Home Loan", type: "HomeLoan", principal: "6500000", outstanding: "5180000", interestRate: "8.6", emi: "52000", tenureMonths: 240, memberId: self },
    { userId: user.id, name: "Credit Card", type: "CreditCard", principal: "80000", outstanding: "42000", interestRate: "42", emi: "8000", tenureMonths: 12, memberId: spouse },
  ]);

  await db.insert(bills).values([
    { userId: user.id, name: "Apartment EMI", category: "Housing", amount: "52000", dueDate: d(yy, mm, 5), frequency: "Monthly", paid: true },
    { userId: user.id, name: "Electricity", category: "Electricity", amount: "4200", dueDate: d(yy, mm, 12), frequency: "Monthly", paid: false },
  ]);

  await db.insert(insurance).values([
    { userId: user.id, name: "Family Health", type: "Health", provider: "Star Health", premium: "28000", coverage: "1000000", renewalDate: d(yy + 1, 2, 22) },
    { userId: user.id, name: "Term Life", type: "Life", provider: "HDFC Life", premium: "22000", coverage: "15000000", renewalDate: d(yy + 1, 6, 10) },
  ]);

  const categories = ["Salary", "Freelancing", "Housing", "Groceries", "Investments", "Food", "Fuel", "Shopping"];
  for (let back = 5; back >= 0; back--) {
    const dt = new Date(yy, mm - 1 - back, 1);
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    await db.insert(transactions).values([
      { userId: user.id, type: "income", category: categories[0], amount: "165000", txnDate: d(y, m, 1), memberId: self, note: "Demo salary" },
      { userId: user.id, type: "income", category: categories[1], amount: "28000", txnDate: d(y, m, 7), memberId: self, note: "Demo freelance" },
      { userId: user.id, type: "expense", category: categories[2], amount: "52000", txnDate: d(y, m, 5), memberId: household, note: "Demo EMI" },
      { userId: user.id, type: "expense", category: categories[3], amount: "16500", txnDate: d(y, m, 10), memberId: household, note: "Demo groceries" },
      { userId: user.id, type: "expense", category: categories[4], amount: "50000", txnDate: d(y, m, 15), memberId: self, note: "Demo SIP" },
      { userId: user.id, type: "expense", category: categories[5], amount: "12000", txnDate: d(y, m, 18), memberId: household, note: "Demo food" },
    ]);
  }

  await db.insert(netWorthSnapshots).values([
    { userId: user.id, snapshotDate: d(yy, Math.max(1, mm - 2), 1), assets: "8500000", liabilities: "5400000" },
    { userId: user.id, snapshotDate: d(yy, Math.max(1, mm - 1), 1), assets: "8750000", liabilities: "5320000" },
    { userId: user.id, snapshotDate: d(yy, mm, 1), assets: "9040000", liabilities: "5222000" },
  ]);

  await db.insert(annualPlans).values([
    { userId: user.id, year: yy, title: "Build 6-month emergency fund", category: "Savings", targetAmount: "600000", progress: 70, status: "InProgress" },
    { userId: user.id, year: yy, title: "Invest ₹50k/month via SIP", category: "Investment", targetAmount: "600000", progress: 75, status: "InProgress" },
  ]);

  await db.insert(taxProfile).values({
    userId: user.id,
    regime: "old",
    grossSalary: "1980000",
    businessIncome: "420000",
    capitalGains: "180000",
    section80c: "150000",
    section80d: "47000",
    hraExemption: "180000",
    homeLoanInterest: "200000",
  });

  await db.insert(emergencyItems).values([
    { userId: user.id, kind: "contact", label: "Family Doctor", detail: "+91 98XXXXXX01", done: false },
    { userId: user.id, kind: "document", label: "Aadhaar & PAN", detail: "Stored in DigiLocker", done: true },
  ]);

  return user;
}
