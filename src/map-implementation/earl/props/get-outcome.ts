import { EarlAssertion } from "../types";
import { ActualOutcome } from "../../types";

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
