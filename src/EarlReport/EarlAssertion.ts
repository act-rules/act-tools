export type Outcome =
  | "passed"
  | "failed"
  | "inapplicable"
  | "cantTell"
  | "untested";

export interface AssertionSpec {
  outcome: Outcome;
  ruleId: string;
  wcag2?: string[];
  requirements?: string[];
}

export class EarlAssertion {
  outcome: Outcome;
  ruleId: string;
  wcag2: string[];
  requirements: string[];

  constructor({
    outcome,
    ruleId,
    wcag2 = [],
    requirements = [],
  }: AssertionSpec) {
    this.outcome = outcome;
    this.ruleId = ruleId;
    this.wcag2 = wcag2;
    this.requirements = requirements;
  }

  get isPartOf(): void | object {
    if (!this.requirements.length && !this.wcag2.length) {
      return;
    }
    return [
      ...this.requirements,
      ...this.wcag2.map((scNumber) => ({
        "@type": "TestRequirement",
        title: `WCAG2: ${scNumber}`,
      })),
    ];
  }

  toJSON(): object {
    return {
      "@type": "Assertion",
      result: {
        "@type": "TestResult",
        outcome: `earl:${this.outcome}`,
      },
      test: {
        "@type": "TestCase",
        title: this.ruleId,
        isPartOf: this.isPartOf,
      },
      assertedBy: "_:assertor",
    };
  }
}
