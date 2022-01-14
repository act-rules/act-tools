import debug from "debug";
import { findAssertions } from "./earl/find-assertions";
import { getImplementationSet } from "./get-implementation-set";
import { ruleIdFromSubject } from "./utils/get-rule-id";
import { EarlAssertion } from "./earl/types";
import {
  ImplementationBase,
  TestCase
} from "./types";

export { loadJson } from "../utils/load-json";

export async function getImplementationMapping(
  jsonld: object | object[],
  { testcases }: { testcases: TestCase[] },
  meta: ImplementationBase = {}
): Promise<void> {
  const assertions = await findAssertions(jsonld);
  const ruleIds = getRuleIds(testcases);
  console.log(Array.from(ruleIds));

  for (const ruleId in ruleIds) {
    const ruleTestCases = testcases.filter(testcase => testcase.ruleId === ruleId);
    const ruleAssertions = assertions.filter(assertion => {

    })
  }
}

function getRuleIds(testcases: TestCase[]): Set<string> {
  const ruleIds = new Set<string>();
  testcases.forEach(testcase => ruleIds.add(testcase.ruleId));
  return ruleIds;
}
