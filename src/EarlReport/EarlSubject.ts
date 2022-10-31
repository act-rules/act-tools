import { EarlAssertion, AssertionSpec } from "./EarlAssertion";

export class EarlSubject {
  source: string;
  assertions: EarlAssertion[] = [];
  constructor(source: string) {
    this.source = source;
  }

  addAssertion(assertionSpec: AssertionSpec): EarlSubject {
    const assertion = new EarlAssertion(assertionSpec);
    this.assertions.push(assertion);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  toJSON() {
    return {
      "@type": ["TestSubject", "WebPage"],
      source: this.source,
      assertions: this.assertions.map((assertion) => assertion.toJSON()),
    };
  }
}
