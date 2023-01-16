import { TestCase } from "./test-case";
import EarlReport from "../EarlReport/EarlReport";
import { actAssertionsToReport } from "../map-implementation/get-act-implementation-report";
import { ActAssertion } from "../map-implementation/types";
import {
  ruleIdFromUri,
  testCaseIdFromUri,
  getTestUrl,
} from "../map-implementation/earl/props";

export class ActReport {
  #earlReport: EarlReport;
  #testCases: TestCase[];

  constructor(earlReport: EarlReport, testCases: TestCase[]) {
    this.#testCases = testCases;
    this.#earlReport = earlReport;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getEarlReport() {
    return this.#earlReport.toJSON();
  }

  getImplementationMapping(): ReturnType<typeof actAssertionsToReport> {
    const metadata = {
      name: this.#earlReport.assertor.name,
      version: this.#earlReport.assertor.versionNumber,
      vendor: this.#earlReport.assertor.vendorName,
    };

    return actAssertionsToReport(
      this.#getActAssertions(),
      this.#testCases,
      metadata
    );
  }

  #getActAssertions(): ActAssertion[] {
    const actAssertions: ActAssertion[] = [];
    for (const testSubjects of this.#earlReport.subjects) {
      for (const earlAssertion of testSubjects.assertions) {
        const ruleId = ruleIdFromUri(testSubjects.source);
        const testCaseId = testCaseIdFromUri(testSubjects.source);
        const requirements = earlAssertion.isPartOf?.map(getTestUrl);

        actAssertions.push({
          ruleId,
          testCaseId,
          testCaseUrl: testSubjects.source,
          outcome: earlAssertion.outcome,
          procedureName: earlAssertion.procedureId,
          accessibilityRequirements: requirements,
          automatic: true,
        });
      }
    }
    return actAssertions;
  }
}
