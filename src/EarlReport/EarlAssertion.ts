export type Outcome =
  | "passed"
  | "failed"
  | "inapplicable"
  | "cantTell"
  | "untested";

export interface AssertionSpec {
  outcome: Outcome;
  procedureId: string;
  wcag2?: string[];
  requirements?: string[];
}

export class EarlAssertion {
  outcome: Outcome;
  procedureId: string;
  wcag2: string[];
  requirements: string[];

  constructor({
    outcome,
    procedureId,
    wcag2 = [],
    requirements = [],
  }: AssertionSpec) {
    this.outcome = outcome;
    this.procedureId = procedureId;
    this.wcag2 = wcag2;
    this.requirements = requirements;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  get isPartOf() {
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  toJSON() {
    return {
      "@type": "Assertion",
      result: {
        "@type": "TestResult",
        outcome: `earl:${this.outcome}`,
      },
      test: {
        "@type": "TestCase",
        title: this.procedureId,
        isPartOf: this.isPartOf,
      },
      assertedBy: "_:assertor",
    };
  }
}
