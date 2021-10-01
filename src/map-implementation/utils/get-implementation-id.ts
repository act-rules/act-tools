import path from "path";
import { EarlTest } from "../earl/types";

export function implementationIdFromTest(
  testCriterion?: EarlTest | string
): string {
  if (typeof testCriterion === "string") {
    return testCriterion;
  }
  if (typeof testCriterion !== "object") {
    throw new TypeError(
      `Assertion.test must be a TestCriterion or string, got '${JSON.stringify(
        testCriterion
      )}'`
    );
  }
  if (typeof testCriterion.title === "string") {
    return testCriterion.title;
  }
  if (typeof testCriterion["@id"] === "string") {
    return getFileName(testCriterion["@id"]);
  }
  throw new Error(
    `Unable to find implementation ID in '${JSON.stringify(testCriterion)}'`
  );
}

export function getFileName(url: string): string {
  const filename = path.basename(url) || "";
  if (filename.lastIndexOf(".") === -1) {
    return filename;
  }
  return filename.substr(0, filename.lastIndexOf("."));
}
