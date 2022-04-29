import { EarlTest, TestPart } from "../types";

export function getTestRequirement(
  test?: string | EarlTest | undefined
): string[] {
  if (typeof test === "object" && "isPartOf" in test) {
    if (Array.isArray(test.isPartOf)) {
      return test.isPartOf.map(getTestUrl);
    }
    if (typeof test.isPartOf === "object" && "@set" in test.isPartOf) {
      return test.isPartOf["@set"].map(getTestUrl);
    }
    if (typeof test.isPartOf !== "undefined") {
      return [getTestUrl(test.isPartOf)];
    }
  }
  return [];
}

function getTestUrl(testPart: TestPart): string {
  return applyWcagNamespace(
    typeof testPart === "object" ? testPart["@id"] : testPart
  );
}

function applyWcagNamespace(url: string): string {
  return url.replace(/https?:\/\/www\.w3\.org\/TR\/WCAG(2\d?)?\/#/g, "WCAG2:");
}
