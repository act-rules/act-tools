import { EarlTestSubject } from "../types";
import { sourceFromSubject } from "./get-source";

export function ruleIdFromSubject(
  subject: EarlTestSubject | string
): string | void {
  const source = sourceFromSubject(subject);
  if (source) {
    try {
      return ruleIdFromUri(source);
    } catch {
      /* void */
    }
  }
}

export function ruleIdFromUri(url: string): string {
  const match = url.match(/\/([a-z0-9]{6})\/([a-z0-9]{40})\.[a-z]{2,4}/);
  if (!match) {
    throw new Error(`Unable to find rule ID in ${url}`);
  }
  return match[1];
}

export function testCaseIdFromUri(url: string): string {
  const match = url.match(/\/([a-z0-9]{6})\/([a-z0-9]{40})\.[a-z]{2,4}/);
  if (!match) {
    throw new Error(`Unable to find rule ID in ${url}`);
  }
  return match[2];
}
