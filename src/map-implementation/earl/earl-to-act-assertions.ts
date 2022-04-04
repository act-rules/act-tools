import debug from "debug";
import { ActAssertion } from "../types";
import { findAssertions } from "./find-assertions";
import { EarlAssertion } from "./types";
import {
  sourceFromSubject,
  ruleIdFromUri,
  testCaseIdFromUri,
  getOutcome,
  procedureNameFromTest,
} from "./props";

export async function earlToActAssertions(
  earlReport: object,
  automatic = true
): Promise<ActAssertion[]> {
  const earlAssertions = await findAssertions(earlReport);
  const actAssertions: ActAssertion[] = [];
  earlAssertions.forEach((earlAssertion) => {
    const actAssertion = convertAssertion(earlAssertion, automatic);
    if (actAssertion) {
      actAssertions.push(actAssertion);
    } else {
      debug("earl")(`Failed to parse assertion`, earlAssertion);
    }
  });
  return actAssertions;
}

export function convertAssertion(
  earlAssertion: EarlAssertion,
  automatic: boolean
): ActAssertion | void {
  try {
    const outcome = getOutcome(earlAssertion);
    const testCaseUrl = sourceFromSubject(earlAssertion.subject);
    if (!testCaseUrl || !outcome) {
      return;
    }
    const ruleId = ruleIdFromUri(testCaseUrl);
    const testCaseId = testCaseIdFromUri(testCaseUrl);
    const procedureName = procedureNameFromTest(earlAssertion.test);

    // TODO: Pull test mode if one is set
    return {
      ruleId,
      testCaseId,
      testCaseUrl,
      outcome,
      automatic,
      procedureName,
    };
  } catch {
    return;
  }
}
