/**
 * ═══════════════════════════════════════════════════════════════
 * OWNERSHIP VERIFICATION UTILITIES
 * ═══════════════════════════════════════════════════════════════
 * 
 * Centralized helpers to prevent IDOR (Insecure Direct Object Reference) attacks.
 * Every mutation on user-owned resources MUST verify ownership before proceeding.
 */

import { db } from "@/db";
import { 
  accounts, investments, debts, bills, goals, 
  members, insurance, transactions 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function verifyAccountOwnership(accountId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);
  return !!row;
}

export async function verifyInvestmentOwnership(investmentId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: investments.id })
    .from(investments)
    .where(and(eq(investments.id, investmentId), eq(investments.userId, userId)))
    .limit(1);
  return !!row;
}

export async function verifyDebtOwnership(debtId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: debts.id })
    .from(debts)
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .limit(1);
  return !!row;
}

export async function verifyBillOwnership(billId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: bills.id })
    .from(bills)
    .where(and(eq(bills.id, billId), eq(bills.userId, userId)))
    .limit(1);
  return !!row;
}

export async function verifyGoalOwnership(goalId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  return !!row;
}

export async function verifyMemberOwnership(memberId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.userId, userId)))
    .limit(1);
  return !!row;
}

export async function verifyInsuranceOwnership(insuranceId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: insurance.id })
    .from(insurance)
    .where(and(eq(insurance.id, insuranceId), eq(insurance.userId, userId)))
    .limit(1);
  return !!row;
}

export async function verifyTransactionOwnership(transactionId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .limit(1);
  return !!row;
}