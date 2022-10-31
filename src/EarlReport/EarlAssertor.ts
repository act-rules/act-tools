export interface AssertorSpec {
  name?: string;
  shortDesc?: string;
  versionNumber?: string;
  vendorName?: string;
  // versionDate?: string
}

export class EarlAssertor {
  name?: string;
  shortDesc?: string;
  versionNumber?: string;
  versionDate?: string;
  vendorName?: string;

  constructor(assertor: AssertorSpec = {}) {
    this.name = assertor.name;
    this.shortDesc = assertor.shortDesc;
    this.versionNumber = assertor.versionNumber;
    this.vendorName = assertor.vendorName;
  }

  toJSON(): Record<string, unknown> {
    const json: Record<string, unknown> = {
      "@type": "Assertor",
      name: this.name,
      shortDesc: this.shortDesc,
    };

    if (this.versionNumber) {
      json.release = {
        "@type": "Version",
        revision: this.versionNumber,
      };
    }

    if (this.vendorName) {
      json.vendor = {
        "@type": "Organization",
        name: this.vendorName,
      };
    }
    return json;
  }
}
