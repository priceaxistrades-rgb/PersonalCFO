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
  ]
};

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
    Other: "var(--text-muted)"
  };
}
