import debug from "debug";
import { findAssertions as findEarlAssertions } from "./earl/find-assertions";
import { implementationIdFromTest } from "./utils/get-implementation-id";
import { getOutcome } from "./get-implementation";
import { ActualOutcome } from "../types";
import { EarlAssertion } from "./earl/types";
import { sourceFromSubject } from "./utils/get-source";

export interface ProcedureResult {
  procedureName: string;
  ruleId: string;
  testcaseId: string;
  outcome: ActualOutcome;
}[]

export async function getProcedureResults(jsonld: object | object[]): Promise<ProcedureResult[]> {
  const procedureResults: ProcedureResult[] = []
  for (const earlAssertion of await findEarlAssertions(jsonld)) {
    const procedureName = getProcedureName(earlAssertion);
    if (!procedureName) {
      debug("getImplementationSet")(
        `Skipped! Could not find 'test' in assertion ${JSON.stringify(
          earlAssertion
        )}`
      );
      continue;
    }

    const outcome = getOutcome(earlAssertion);
    if (!outcome) {
      debug("getImplementation:outcome")(
        `Could not find outcome, assuming 'untested' for assertion ${JSON.stringify(
          earlAssertion
        )}`
      );
      continue;
    }

    const { ruleId, testcaseId } = getTestCaseData(earlAssertion)
    if (!ruleId || !testcaseId) {
      continue;
    }

    procedureResults.push({
      procedureName,
      ruleId,
      testcaseId,
      outcome
    });
  }

  return procedureResults;
}

function getProcedureName(earlAssertion: EarlAssertion): string | undefined {
  const test = earlAssertion.test || earlAssertion["wcagem-test"];
  const procedureName = test ? implementationIdFromTest(test) : undefined
  if (!procedureName) {
    debug("getProcedureName")(
      `Skipped! Could not find procedure name in assertion ${JSON.stringify(
        earlAssertion
      )}`
    );
  }
  return procedureName;
}

function getTestCaseData(earlAssertion: EarlAssertion): { ruleId?: string, testcaseId?: string } {
  if (!earlAssertion.subject) {
    return {};
  }
  const source = sourceFromSubject(earlAssertion.subject);
  if (!source) {
    return {}
  }
  const match = source.match(/\/([a-z0-9]{6})\/([a-z0-9]{40})\.[a-z]{2,4}/);
  if (!match) {
    return {}
  }
  const [, ruleId, testcaseId] = match;
  return { ruleId, testcaseId }
}
