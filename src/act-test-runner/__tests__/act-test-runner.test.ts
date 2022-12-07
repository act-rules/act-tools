import { ActTestRunner } from "../act-test-runner";
import { TestCase, TestCaseJson } from "../../types";

function getTestCase(partial: Partial<TestCase> = {}, ext = "html"): TestCase {
  const ruleId = partial.ruleId || "abc123";
  const testcaseId = (partial.testcaseId || "abcdef123456").padEnd(40, "x");
  const expected = partial.expected || "passed";
  const relativePath =
    partial.relativePath || `/${ruleId}/${testcaseId}.${ext}`;
  return {
    ...partial,
    ruleId,
    testcaseId,
    expected,
    relativePath,
    ruleName: "ABC test",
    testcaseTitle: `${expected} example`,
    url: `http://localhost/testcases${relativePath}`,
    rulePage: `http://localhost/rule/${ruleId}}`,
    ruleAccessibilityRequirements: null,
  };
}

describe("ActTestRunner", () => {
  const log = false;
  let testCase: TestCase;
  let testCaseJson: TestCaseJson;

  beforeEach(() => {
    testCase = getTestCase();
    testCaseJson = {
      name: "",
      website: "",
      license: "",
      description: "",
      count: 1,
      testcases: [testCase],
    };
  });

  describe(".run()", () => {
    it("invokes the testRunner with each test case", async () => {
      let count = 0;
      testCaseJson.testcases = [getTestCase(), getTestCase()];
      const runner = new ActTestRunner({ testCaseJson, log });
      await runner.run(async () => {
        count++;
        return [];
      });
      expect(count).toBe(2);
    });

    it("accepts assertion specs as return values", async () => {
      const runner = new ActTestRunner({ testCaseJson, log });
      const report = await runner.run(async () => {
        return [
          {
            procedureId: "rule-a",
            outcome: "inapplicable",
            wcag2: ["SC 2.2.1"],
          },
        ];
      });
      const testRun = report.getEarlReport().testRuns[0];
      expect(testRun.assertions).toHaveLength(1);
      expect(testRun.assertions[0].test.title).toBe("rule-a");
      expect(testRun.assertions[0].result.outcome).toBe("earl:inapplicable");
      expect(testRun.assertions[0].test.isPartOf).toEqual([
        {
          "@type": "TestRequirement",
          title: "WCAG2: SC 2.2.1",
        },
      ]);
    });

    it("takes returned strings as failed", async () => {
      const runner = new ActTestRunner({ testCaseJson, log });
      const report = await runner.run(async () => {
        return ["rule-a", "rule-b"];
      });
      const { assertions } = report.getEarlReport().testRuns[0];
      expect(assertions).toHaveLength(2);
      expect(assertions[0].test.title).toBe("rule-a");
      expect(assertions[0].result.outcome).toBe("earl:failed");
      expect(assertions[1].test.title).toBe("rule-b");
      expect(assertions[1].result.outcome).toBe("earl:failed");
    });

    it("adds passed results when a rule has no other result", async () => {
      testCaseJson.testcases = [
        getTestCase({ testcaseId: "foo" }),
        getTestCase({ testcaseId: "bar" }),
      ];
      const runner = new ActTestRunner({ testCaseJson, log });
      const report = await runner.run(async ({ testcaseId }) => {
        return testcaseId.includes("foo") ? ["rule-a"] : [];
      });
      const { testRuns } = report.getEarlReport();
      expect(testRuns).toHaveLength(2);
      expect(testRuns[0].assertions[0].test.title).toBe("rule-a");
      expect(testRuns[0].assertions[0].result.outcome).toBe("earl:failed");
      expect(testRuns[1].assertions[0].test.title).toBe("rule-a");
      expect(testRuns[1].assertions[0].result.outcome).toBe("earl:passed");
    });

    it("adds cantTell when a testRunner throws", async () => {
      testCaseJson.testcases = [
        getTestCase({ testcaseId: "foo" }),
        getTestCase({ testcaseId: "bar" }),
      ];
      const runner = new ActTestRunner({ testCaseJson, log });
      const report = await runner.run(async ({ testcaseId }) => {
        if (testcaseId.includes("bar")) {
          throw new Error("Boom!");
        }
        return ["rule-a"];
      });
      const { testRuns } = report.getEarlReport();
      expect(testRuns).toHaveLength(2);
      expect(testRuns[0].assertions[0].test.title).toBe("rule-a");
      expect(testRuns[0].assertions[0].result.outcome).toBe("earl:failed");
      expect(testRuns[1].assertions[0].test.title).toBe("rule-a");
      expect(testRuns[1].assertions[0].result.outcome).toBe("earl:cantTell");
    });

    describe(".run({ rules })", () => {
      it("skips rules not in the rules list", async () => {
        const rules = ["abc123"];
        testCaseJson.testcases = [
          getTestCase({ ruleId: "abc123" }),
          getTestCase({ ruleId: "xyz789" }),
        ];
        const runner = new ActTestRunner({ rules, testCaseJson, log });
        await runner.run(async (testCase) => {
          expect(testCase.ruleId).toBe("abc123");
          return [];
        });
      });
    });

    describe(".run({ fileTypes })", () => {
      it("does only tests those file types", async () => {
        testCaseJson.testcases = [
          getTestCase({ testcaseId: "foo" }, "html"),
          getTestCase({ testcaseId: "bar" }, "svg"),
          getTestCase({ testcaseId: "baz" }, "xml"),
        ];
        const runner = new ActTestRunner({
          fileTypes: ["html", "xml"],
          testCaseJson,
          log,
        });
        const expected = [".html", ".xml"];
        await runner.run(async ({ relativePath }) => {
          expect(relativePath).toContain(expected.shift());
          return [];
        });
        expect(expected).toHaveLength(0);
      });

      it("reports cantTell for all others", async () => {
        testCaseJson.testcases = [
          getTestCase({}, "html"),
          getTestCase({}, "svg"),
        ];
        const runner = new ActTestRunner({
          fileTypes: ["html"],
          testCaseJson,
          log,
        });
        const report = await runner.run(async () => {
          return ["rule-a"];
        });

        const { testRuns } = report.getEarlReport();
        expect(testRuns).toHaveLength(2);
        expect(testRuns[0].assertions[0].test.title).toBe("rule-a");
        expect(testRuns[0].assertions[0].result.outcome).toBe("earl:failed");
        expect(testRuns[1].assertions[0].test.title).toBe("rule-a");
        expect(testRuns[1].assertions[0].result.outcome).toBe("earl:cantTell");
      });
    });
  });

  describe(".ignoreProcedures", () => {
    it("sets procedures to be ignored for every rule", () => {
      const runner = new ActTestRunner();
      const ignored = ["foo", "bar"];
      runner.ignoreProcedures(ignored);
      expect(runner.getIgnoredProcedures("abc123")).toEqual(ignored);
      expect(runner.getIgnoredProcedures("xyz789")).toEqual(ignored);
    });

    it("overrides previous calls to .ignoreProcedures", () => {
      const runner = new ActTestRunner();
      const ignored = ["baz"];
      runner.ignoreProcedures(["foo", "bar"]);
      runner.ignoreProcedures(["baz"]);
      expect(runner.getIgnoredProcedures("abc123")).toEqual(ignored);
    });
  });

  describe(".ignoreProceduresForRule", () => {
    it("sets procedures to be ignored for a specific rule", () => {
      const runner = new ActTestRunner();
      const ignored = ["foo", "bar"];
      runner.ignoreProceduresForRule({ abc123: ignored });
      expect(runner.getIgnoredProcedures("abc123")).toEqual(ignored);
      expect(runner.getIgnoredProcedures("xyz789")).toHaveLength(0);
    });

    it("adds to .ignoreProcedures", () => {
      const runner = new ActTestRunner();
      const ignored1 = ["foo", "bar"];
      const ignored2 = ["baz", "buzz"];
      runner.ignoreProcedures(ignored1);
      runner.ignoreProceduresForRule({ abc123: ignored2 });
      expect(runner.getIgnoredProcedures("abc123")).toEqual([
        ...ignored1,
        ...ignored2,
      ]);
    });

    it("overrides previous calls to .ignoreProceduresForRule", () => {
      const runner = new ActTestRunner();
      const ignored = ["baz"];
      runner.ignoreProceduresForRule({ abc123: ["foo", "bar"] });
      runner.ignoreProceduresForRule({ abc123: ignored });
      expect(runner.getIgnoredProcedures("abc123")).toEqual(ignored);
    });
  });

  describe("scrapeRequirementsFromDocs", () => {
    it("returns WCAG success criteria", async () => {
      const runner = new ActTestRunner();
      const url = "https://www.w3.org/WAI/WCAG21/Techniques/html/H2.html";
      const requirements = await runner.scrapeRequirementsFromDocs(url);

      expect(requirements).toEqual([
        "WCAG2:non-text-content",
        "WCAG2:link-purpose-in-context",
        "WCAG2:link-purpose-link-only",
      ]);
    });
  });
});
