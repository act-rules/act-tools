import { AssertorSpec, EarlAssertor } from "./EarlAssertor";
import { EarlSubject } from "./EarlSubject";
import { context } from "./context";

export default class EarlReport {
  assertor: EarlAssertor;
  subjects: EarlSubject[] = [];

  constructor(assertor: AssertorSpec) {
    this.assertor = new EarlAssertor(assertor);
  }

  addTestRun(source: string): EarlSubject {
    const subject = new EarlSubject(source);
    this.subjects.push(subject);
    return subject;
  }

  toJSON(): object {
    const report = {
      ...this.assertor.toJSON(),
      testRuns: this.subjects.map((subject) => subject.toJSON()),
      "@id": "_:assertor",
      "@context": context,
    };
    return report;
  }
}
