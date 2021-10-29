import debug from "debug";
import { findAssertions } from "./earl/find-assertions";
import { getImplementationSet } from "./get-implementation-set";
import { ruleIdFromSubject } from "./utils/get-rule-id";
import { EarlAssertion } from "./earl/types";
import {
  ImplementationSet,
  ImplementationBase,
  AssertionGroup,
  Consistency,
  TestCase,
  MappingSummary,
  ActImplementationMapping,
} from "./types";
import assert from "assert";

export { loadJson } from "../utils/load-json";

export async function actMapGenerator(
  jsonld: object | object[],
  { testcases }: { testcases: TestCase[] },
  meta: ImplementationBase = {}
): Promise<ActImplementationMapping> {
  const assertions = await findAssertions(jsonld);
  const assertsByRule = groupAssertionsByRule(assertions);
  const getActMapping = getImplementationSets.bind(null, testcases);

  // Get an implementationSet for each rule
  const actMapping = Object.entries(assertsByRule)
    .map(getActMapping)
    .sort(implementationSetSort);

  const summary = getImplementationSummary(actMapping);
  return { ...meta, summary, actMapping };
}

function groupAssertionsByRule(assertions: EarlAssertion[]): AssertionGroup {
  const assertsByRule: AssertionGroup = {};

  assertions.forEach((assertion) => {
    const ruleId = assertion.subject && ruleIdFromSubject(assertion.subject);
    if (!ruleId) {
      debug("actMapper")(
        `Skipped! Could not find 'ruleId' in subject of assertion ${JSON.stringify(
          assertion
        )}`
      );
      return;
    }
    if (!assertsByRule[ruleId]) {
      assertsByRule[ruleId] = [];
    }
    assertsByRule[ruleId].push(assertion);
  });
  return assertsByRule;
}

function getImplementationSets(
  testcases: TestCase[],
  [ruleId, ruleAssertions]: [string, EarlAssertion[]]
): ImplementationSet {
  const ruleTestCases = testcases.filter(
    (testcase) => testcase.ruleId === ruleId
  );
  assert(
    ruleTestCases.length > 0,
    `Unable to find testcases for rule ${ruleId}`
  );
  const { ruleName } = ruleTestCases[0];
  const implementationSet = getImplementationSet(ruleAssertions, ruleTestCases);

  return { ruleId, ruleName, ...implementationSet };
}

const consistencyWeight: Consistency[] = [
  "inconsistent",
  "partially-consistent",
  "consistent",
];
function implementationSetSort(
  setA: ImplementationSet,
  setB: ImplementationSet
): number {
  const weightA = consistencyWeight.indexOf(setA.consistency);
  const weightB = consistencyWeight.indexOf(setB.consistency);
  if (weightA !== weightB) {
    return weightB - weightA;
  }
  if (setA.complete !== setB.complete) {
    return Number(setA.complete) - Number(setB.complete);
  }
  return 0;
}

function getImplementationSummary(
  actMapping: ImplementationSet[]
): MappingSummary {
  return {
    consistent: countPropMatch(actMapping, "consistency", "consistent"),
    partiallyConsistent: countPropMatch(
      actMapping,
      "consistency",
      "partially-consistent"
    ),
    inconsistent: countPropMatch(actMapping, "consistency", "inconsistent"),
    incomplete: countPropMatch(actMapping, "complete", false),
  };
}

function countPropMatch(
  actMapping: ImplementationSet[],
  prop: "consistency" | "complete",
  value: any
): number {
  return actMapping.reduce((count: number, set: ImplementationSet) => {
    return count + Number(set[prop] === value);
  }, 0);
}
