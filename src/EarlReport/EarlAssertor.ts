export interface AssertorSpec {
  name?: string;
  shortDesc?: string;
  // versionNumber?: string
  // versionDate?: string
}

export class EarlAssertor {
  name?: string;
  shortDesc?: string;
  // versionNumber?: string
  // versionDate?: string

  constructor(assertor: AssertorSpec) {
    this.name = assertor.name;
    this.shortDesc = assertor.shortDesc;
    // this.versionNumber = assertor.versionNumber;
    // this.versionDate = assertor.versionDate;
  }

  toJSON(): object {
    return {
      "@type": "Assertor",
      name: this.name,
      shortDesc: this.shortDesc,
    };
  }
}
