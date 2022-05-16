import { ExpectedOutcome } from "../types";

export type ComplexSource = { "@id"?: string };

export type EarlTestSubject = {
  "@type"?: "earl:TestSubject";
  "@id"?: string;
  source?: string | ComplexSource;
  "earl:source"?: string;
  title?: string;
};

export type TestPart = { "@id": string } | { title: string } | string;
export type TestPartSet = { "@set": TestPart[] };

export type EarlTestCriterion = {
  "@type"?: "earl:TestCriterion";
  "@id"?: string;
  title?: string;
  isPartOf?: TestPartSet | TestPart[] | TestPart;
};

export type EarlTestRequirement = {
  "@type"?: "earl:TestRequirement";
  "@id"?: string;
  title?: string;
};

export type EarlTest = EarlTestCriterion | EarlTestRequirement;

export type EarlOutcome =
  | "earl:passed"
  | "earl:failed"
  | "earl:inapplicable"
  | "earl:cantTell"
  | "earl:untested";

export type EarlTestResult = {
  "@type"?: "earl:TestResult";
  outcome?: EarlOutcome | ExpectedOutcome;
};

export type EarlAssertion = {
  "@type"?: "earl:Assertion" | "Assertion";
  "@id"?: string;
  subject?: EarlTestSubject | string;
  test?: EarlTest | string;
  "wcagem-test"?: EarlTest | string;
  result?: EarlTestResult;
};

export type AssertionGraph = {
  "@graph": EarlAssertion[];
};
