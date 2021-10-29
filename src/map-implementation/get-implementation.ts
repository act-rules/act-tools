import { EarlAssertion } from "./earl/types";
import { sourceFromSubject } from "./utils/get-source";
import debug from "debug";
import {
  TestCase,
  ExpectedOutcome,
  ActualOutcome,
  Consistency,
  TestFindings,
  SemiImplementation,
} from "./types";

type OutcomeMapping = {
  [propName in ExpectedOutcome]: ActualOutcome[];
};

const outcomeMapping: OutcomeMapping = {
  passed: ["passed", "inapplicable", "cantTell"],
  inapplicable: ["passed", "inapplicable", "cantTell"],
  failed: ["failed", "cantTell"],
};

export function getImplementation(
  testcases: TestCase[],
  assertions: EarlAssertion[]
): SemiImplementation {
  let complete = true;
  const untested = {
    passed: true,
    inapplicable: true,
    failed: true,
  };
  let noTestResults = true;
  let noFailMatches = true;
  let consistency: Consistency = "consistent";

  const findings = testcases.map(
    ({ url, expected, testcaseTitle }): TestFindings => {
      const testcase = testcaseTitle;
      const assertion = assertions.find((a) => sameSource(a, url));
      if (!assertion) {
        debug("getImplementation:assertion")(
          `Could not find assertion for ${url}`
        );
      }

      const outcome = getOutcome(assertion);
      if (assertion && outcome === undefined) {
        debug("getImplementation:outcome")(
          `Could not find outcome, assuming 'untested' for assertion ${JSON.stringify(
            assertion
          )}`
        );
      }

      const actual = outcome || "untested";
      let correct = true;

      if (actual === "untested") {
        // Something is incomplete
        complete = false;
        return { url, testcase, expected, actual, correct: false };
      } else {
        // Each type of test case must have at least one outcome that's not untested
        untested[expected] = false;
      }

      // At least one thing must be passed, failed or inapplicable
      if (["passed", "failed", "inapplicable"].includes(actual)) {
        noTestResults = false;
      }

      if (!outcomeMapping[expected].includes(actual)) {
        correct = false;
        if (expected === "failed" && consistency !== "inconsistent") {
          consistency = "partially-consistent";
        } else if (expected !== "failed") {
          consistency = "inconsistent";
        }
      } else if (expected === "failed") {
        noFailMatches = false;
      }
      return { url, testcase, expected, actual, correct };
    }
  );

  if (noTestResults || noFailMatches || untested.passed || untested.failed) {
    consistency = "inconsistent";
  }

  return { complete, consistency, findings };
}

export function sameSource({ subject }: EarlAssertion, url: string): boolean {
  const source = sourceFromSubject(subject);
  if (!source || !/\/([a-z0-9]{6})\/([a-z0-9]{40})\.[a-z]{2,4}/.test(source)) {
    throw new Error(`Assertion on '${source}' is not a test case`);
  }
  // The ending of URL is the same as source
  return url.substr(-source.length) === source;
}

export function getOutcome(
  assertion: EarlAssertion | undefined
): ActualOutcome | undefined {
  if (assertion === undefined) {
    return;
  }

  if (
    typeof assertion.result !== "object" ||
    typeof assertion.result.outcome !== "string"
  ) {
    throw new TypeError(`Unknown result '${JSON.stringify(assertion.result)}`);
  }
  return assertion.result.outcome.replace("earl:", "") as ActualOutcome;
}
