import assert from "assert";
import {
  ActAssertion,
  ActImplementationReport,
  ActProcedureSet,
  TestCase,
  ActImplementationMeta,
  RuleStats,
  PartialActProcedureSet,
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
  return actAssertionsToReport(actAssertions, testCases, metaData);
}

export function actAssertionsToReport(
  actAssertions: ActAssertion[],
  testCases: TestCase[],
  metaData: ActImplementationMeta = {}
): ActImplementationReport {
  const approvedRules = emptyRuleStats();
  const proposedRules = emptyRuleStats();

  const actRuleMapping: ActProcedureSet[] = [];
  for (const ruleGroup of groupByRule(testCases, actAssertions)) {
    // Work out how each procedure maps to a rule
    const procedureMappings = getRuleProcedureMapping(
      ruleGroup.ruleTestCases,
      ruleGroup.ruleAssertions
    );

    // Work out what set of procedures gets the highest consistency to the rule
    const procedureSet = findProcedureSet(
      procedureMappings,
      ruleGroup.ruleAccessibilityRequirements
    );
    const { ruleId, ruleName, ruleApproved } = ruleGroup;
    actRuleMapping.push({ ruleId, ruleName, ruleApproved, ...procedureSet });
    updateRuleStats(procedureSet, ruleApproved ? approvedRules : proposedRules);
  }

  return { ...metaData, approvedRules, proposedRules, actRuleMapping };
}

type RuleGroup = {
  ruleId: string;
  ruleName: string;
  ruleApproved: boolean;
  ruleTestCases: TestCase[];
  ruleAssertions: ActAssertion[];
  ruleAccessibilityRequirements:
    | TestCase["ruleAccessibilityRequirements"]
    | null;
};

function groupByRule(
  testCases: TestCase[],
  actAssertions: ActAssertion[]
): RuleGroup[] {
  const ruleIds = Array.from(getUniqueRuleIds(testCases));
  const ruleGroups = ruleIds.map((ruleId): RuleGroup => {
    const ruleName = findRuleName(testCases, ruleId);
    const ruleAccessibilityRequirements = findRuleRequirements(
      testCases,
      ruleId
    );
    const ruleTestCases = testCases.filter(
      (testCase) => testCase.ruleId === ruleId
    );

    const ruleApproved = ruleTestCases.some(({ approved }) => approved);
    const ruleAssertions = actAssertions.filter((actAssertion) =>
      ruleTestCases.some(
        (testCase) =>
          testCase.ruleId === actAssertion.ruleId &&
          testCase.testcaseId === actAssertion.testCaseId
      )
    );
    return {
      ruleId,
      ruleApproved,
      ruleName,
      ruleTestCases,
      ruleAssertions,
      ruleAccessibilityRequirements,
    };
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

function findRuleRequirements(
  testCases: TestCase[],
  ruleId: string
): TestCase["ruleAccessibilityRequirements"] {
  const ruleTestCase = testCases.find((testCase) => testCase.ruleId === ruleId);
  assert(ruleTestCase, `Unable to find test case with ruleId ${ruleId}`);
  return ruleTestCase.ruleAccessibilityRequirements;
}

function updateRuleStats(
  procedureSet: PartialActProcedureSet,
  ruleStats: RuleStats
) {
  if (procedureSet.consistency) {
    ruleStats[procedureSet.consistency]++;
  } else if (procedureSet.procedureNames.length) {
    ruleStats.inconsistent++;
  } else {
    ruleStats.untested++;
  }
}

function emptyRuleStats(): RuleStats {
  return {
    complete: 0,
    partial: 0,
    minimal: 0,
    inconsistent: 0,
    untested: 0,
  };
}
