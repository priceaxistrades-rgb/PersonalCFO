export const INCOME_CATEGORIES = [
  "Salary",
  "Freelancing",
  "Business",
  "Rental Income",
  "Dividends",
  "Interest",
  "Capital Gains",
  "Gift",
  "Refund",
  "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Housing", "Food", "Groceries", "Electricity", "Water", "Gas", "Internet",
  "Mobile", "Transportation", "Fuel", "Insurance", "Medical", "Education",
  "Shopping", "Entertainment", "Subscriptions", "Travel", "Gifts",
  "Investments", "Miscellaneous",
] as const;

export const CATEGORY_GROUPS = {
  Essential: [
    "Rent", "Mortgage", "Utilities", "Groceries", "Health", "Insurance", "Education", "Transport", "EMI", "Taxes"
  ],
  Lifestyle: [
    "Dining Out", "Entertainment", "Shopping", "Travel", "Hobbies", "Subscription", "Gifts", "Luxury"
  ],
  Savings: [
    "Investment", "Savings Account", "PPF", "EPF", "Gold", "Fixed Deposit"
  ],
  Other: [
    "Miscellaneous", "Adjustment"
  ],
};

export const BILL_CATEGORIES = [
  "Rent",
  "Electricity",
  "Gas",
  "Water",
  "Internet",
  "Phone / Mobile",
  "DTH / Cable",
  "Insurance Premium",
  "EMI",
  "Subscription",
  "Gym / Fitness",
  "Education Fee",
  "Maintenance",
  "Society / HOA",
  "Taxes",
  "Medical",
  "Transport",
  "Other",
] as const;

export function getGroupForCategory(category: string): string {
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if (cats.includes(category)) return group;
  }
  return "Other";
}

export function getGroupColors(): Record<string, string> {
  return {
    Essential: "var(--danger)",
    Lifestyle: "var(--warning)",
    Savings: "var(--success)",
    Other: "var(--text-muted)",
  };
}
