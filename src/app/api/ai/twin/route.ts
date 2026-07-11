import { db } from "@/db";
import { aiQueries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { isSession, requireApiSession } from "@/lib/server-auth";
import { apiHandler, apiSuccess, apiError } from "@/lib/api-utils";
import { buildTwinProfile, answerTwinQuery, simulateScenario } from "@/lib/financial-twin";
import { sanitize, isSafeInput } from "@/lib/sanitize";
import {
  getAllTransactions,
  getAccounts,
  getInvestments,
  getDebts,
  getBills,
  getGoals,
  getInsurance,
} from "@/lib/data";

export const GET = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    // Fetch all financial data for the twin profile
    const [txns, accounts, investments, debts, bills, goals, insurance] = await Promise.all([
      getAllTransactions(),
      getAccounts(),
      getInvestments(),
      getDebts(),
      getBills(),
      getGoals(),
      getInsurance(),
    ]);

    const profile = buildTwinProfile({ txns, accounts, investments, debts, bills, goals, insurance });

    // Get recent query history — non-critical, don't crash if table missing
    let recentQueries: any[] = [];
    try {
      recentQueries = await db
        .select()
        .from(aiQueries)
        .where(eq(aiQueries.userId, session.userId))
        .orderBy(desc(aiQueries.createdAt))
        .limit(20);
    } catch (queryErr) {
      log.warn("Could not fetch AI query history (table may not exist)", { error: String(queryErr) });
    }

    log.info("Twin profile generated", { userId: session.userId });
    return apiSuccess({ profile, recentQueries });
  } catch (err) {
    return apiError("Failed to generate twin profile", 500, undefined, err);
  }
});

export const POST = apiHandler(async (req, { log }) => {
  const session = requireApiSession(req);
  if (!isSession(session)) return session;

  try {
    const raw = await req.json();
    const question = typeof raw.question === "string" ? raw.question.trim() : "";
    const amount = typeof raw.amount === "number" ? raw.amount : undefined;
    const scenarioType = typeof raw.scenario === "string" ? raw.scenario : undefined;
    const scenarioParams = typeof raw.params === "object" && raw.params !== null ? raw.params : {};

    if (!question && !scenarioType) {
      return apiError("Question or scenario is required", 400);
    }

    // Sanitize question
    if (question && !isSafeInput(question)) {
      return apiError("Question contains disallowed content", 400);
    }

    // Fetch all financial data
    const [txns, accounts, investments, debts, bills, goals, insurance] = await Promise.all([
      getAllTransactions(),
      getAccounts(),
      getInvestments(),
      getDebts(),
      getBills(),
      getGoals(),
      getInsurance(),
    ]);

    const profile = buildTwinProfile({ txns, accounts, investments, debts, bills, goals, insurance });

    let response;

    if (scenarioType) {
      // Handle scenario simulation
      const validScenarios = ["salaryIncrease", "salaryDecrease", "housePurchase", "carPurchase", "jobLoss", "inflation", "childEducation", "medicalEmergency"] as const;
      if (!validScenarios.includes(scenarioType as any)) {
        return apiError("Invalid scenario type", 400);
      }
      const scenario = simulateScenario(profile, scenarioType as typeof validScenarios[number], scenarioParams);
      scenario.category = "Life Simulator";
      scenario.answer = `${scenario.name}: ${scenario.description}\n\nRisk: ${scenario.risk}\n\n${scenario.recommendation}`;
      scenario.confidence = "medium";
      scenario.icon = "🔬";
      response = scenario;
    } else {
      // Handle question
      response = answerTwinQuery(profile, { question, amount });
    }

    // Save query to history — non-critical, don't crash if table missing
    try {
      await db.insert(aiQueries).values({
        userId: session.userId,
        question: question || `Scenario: ${scenarioType}`,
        category: response.category || "General",
        answer: response.answer || ("recommendation" in response ? response.recommendation : "") || "",
        confidence: response.confidence || "medium",
      });
    } catch (insertErr) {
      log.warn("Could not save AI query to history (table may not exist)", { error: String(insertErr) });
    }

    log.info("Twin query answered", {
      userId: session.userId,
      category: response.category || "General",
      confidence: response.confidence || "medium",
    });

    return apiSuccess({ response, profile });
  } catch (err) {
    return apiError("Failed to process twin query", 500, undefined, err);
  }
});
