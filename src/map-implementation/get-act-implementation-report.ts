import assert from "assert";
import {
  ActAssertion,
  ActImplementationReport,
  ActProcedureSet,
  TestCase,
  ActImplementationMeta,
} from "./types";
import { getRuleProcedureMapping } from "./procedures/get-rule-procedure-mapping";
import { findProcedureSet } from "./procedure-sets/find-procedure-set";
import { earlToActAssertions } from "./earl/earl-to-act-assertions";

export async function getActImplementationReport(
  earlReport: Object,
  testCases: TestCase[],
  metaData: ActImplementationMeta = {}
): Promise<ActImplementationReport> {
  const actAssertions = await earlToActAssertions(earlReport);
  console.log(`Found ${actAssertions.length} assertions`);

  const procedureSets: ActProcedureSet[] = [];
  for (const ruleGroup of groupByRule(testCases, actAssertions)) {
    const { ruleId, ruleName, ruleTestCases, ruleAssertions } = ruleGroup;
    const procedureMappings = getRuleProcedureMapping(
      ruleTestCases,
      ruleAssertions
    );
    const procedureSet = findProcedureSet(procedureMappings);
    procedureSets.push({ ruleId, ruleName, ...procedureSet });
  }

  const consistency = getSummary(procedureSets);
  return { ...metaData, consistency, procedureSets };
}

function getSummary(
  procedureSets: ActProcedureSet[]
): ActImplementationReport["consistency"] {
  const consistency = {
    complete: 0,
    partial: 0,
    minimal: 0,
    inconsistent: 0,
    untested: 0,
  };

  procedureSets.forEach((procedureSet) => {
    if (procedureSet.consistency === "complete") {
      consistency.complete++;
    } else if (procedureSet.consistency === "partial") {
      consistency.partial++;
    } else if (procedureSet.consistency === "minimal") {
      consistency.minimal++;
    } else if (procedureSet.procedures.length > 0) {
      consistency.inconsistent++;
    } else {
      consistency.untested++;
    }
  });
  return consistency;
}

type RuleGroup = {
  ruleId: string;
  ruleName: string;
  ruleTestCases: TestCase[];
  ruleAssertions: ActAssertion[];
};

function groupByRule(
  testCases: TestCase[],
  actAssertions: ActAssertion[]
): RuleGroup[] {
  const ruleIds = Array.from(getUniqueRuleIds(testCases));
  const ruleGroups = ruleIds.map((ruleId): RuleGroup => {
    const ruleName = findRuleName(testCases, ruleId);
    const ruleTestCases = testCases.filter(
      (testCase) => testCase.ruleId === ruleId
    );
    const ruleAssertions = actAssertions.filter((actAssertions) =>
      ruleTestCases.some(
        (testCase) => testCase.testcaseId === actAssertions.testCaseId
      )
    );
    return { ruleId, ruleName, ruleTestCases, ruleAssertions };
  });

  // Sort by group name
  ruleGroups.sort((groupA, groupB) =>
    Number(groupA.ruleName > groupB.ruleName)
  );
  return ruleGroups;
}

function getUniqueRuleIds(testCases: TestCase[]): Set<string> {
  const ruleIds = new Set<string>();
  testCases.forEach((testCase) => ruleIds.add(testCase.ruleId));
  return ruleIds;
}

function findRuleName(testCases: TestCase[], ruleId: string): string {
  const ruleTestCase = testCases.find((testCase) => testCase.ruleId === ruleId);
  assert(ruleTestCase, `Unable to find test case with ruleId ${ruleId}`);
  return ruleTestCase.ruleName;
}
