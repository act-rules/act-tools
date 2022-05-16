import { EarlTest, TestPart } from "../types";
import { criteria } from "../../../data/index";

export function getTestRequirement(
  test?: string | EarlTest | undefined
): string[] {
  if (typeof test === "object" && "isPartOf" in test) {
    if (Array.isArray(test.isPartOf)) {
      return test.isPartOf.map(getTestUrl).filter(isTruthy);
    }
    if (typeof test.isPartOf === "object" && "@set" in test.isPartOf) {
      return test.isPartOf["@set"].map(getTestUrl).filter(isTruthy);
    }
    if (typeof test.isPartOf !== "undefined") {
      return [getTestUrl(test.isPartOf)].filter(isTruthy);
    }
  }
  return [];
}

function getTestUrl(testPart: TestPart): string {
  if (typeof testPart === "string") {
    return applyWcagNamespace(testPart);
  }
  if ("@id" in testPart) {
    return applyWcagNamespace(testPart["@id"]);
  }

  const scNumber = testPart.title.match(/\d\.\d.\d{1,2}/)?.[0];
  if (scNumber && testPart.title.match(/WCAG\s?2/)) {
    const criterion = Object.values(criteria).find(
      (sc) => sc?.num === scNumber
    );
    if (criterion) {
      return criterion.scId;
    }
  }
  return "";
}

function applyWcagNamespace(url: string): string {
  return url.replace(/https?:\/\/www\.w3\.org\/TR\/WCAG(2\d?)?\/#/g, "WCAG2:");
}

const isTruthy = (s: unknown): boolean => !!s;
