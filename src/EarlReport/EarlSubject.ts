import { EarlAssertion, AssertionSpec } from "./EarlAssertion";

export class EarlSubject {
  source: string;
  assertions: EarlAssertion[] = [];
  constructor(source: string) {
    this.source = source;
  }

  addAssertion(assertionSpec: AssertionSpec): void {
    const assertion = new EarlAssertion(assertionSpec);
    this.assertions.push(assertion);
  }

  toJSON(): object {
    return {
      "@type": ["TestSubject", "WebPage"],
      source: this.source,
      assertions: this.assertions.map((assertion) => assertion.toJSON()),
    };
  }
}
