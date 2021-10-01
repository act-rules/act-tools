import { getImplementation } from "../get-implementation";
import {
  toTestcaseUrl,
  toTestcases,
  toAssertions,
  testDataFromTables,
} from "../__test-utils";

describe("getImplementation()", () => {
  describe("{ findings }", () => {
    it("returns static `url`, `expected`, `testcase`, `actual`", () => {
      const ruleId = "abc123";
      const { testcases, assertions } = testDataFromTables({
        ruleId,
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "inapplicable", "failed"],
      });
      testcases[0].testcaseTitle = "fizz";
      testcases[1].testcaseTitle = "buzz";
      testcases[2].testcaseTitle = "fizzbuzz";

      const { findings } = getImplementation(testcases, assertions);
      expect(findings).toMatchObject([
        {
          url: toTestcaseUrl("foo", ruleId),
          expected: "passed",
          testcase: "fizz",
          actual: "passed",
        },
        {
          url: toTestcaseUrl("bar", ruleId),
          expected: "inapplicable",
          testcase: "buzz",
          actual: "inapplicable",
        },
        {
          url: toTestcaseUrl("baz", ruleId),
          expected: "failed",
          testcase: "fizzbuzz",
          actual: "failed",
        },
      ]);
    });

    it("sets the `correct` property to `true` or `false`", () => {
      const allActuals = [
        "passed",
        "inapplicable",
        "failed",
        "cantTell",
        "untested",
      ];
      const { testcases, assertions } = testDataFromTables({
        expected: new Array(15)
          .fill("passed", 0, 5)
          .fill("inapplicable", 5, 10)
          .fill("failed", 10, 15),
        impl0: allActuals.concat(allActuals).concat(allActuals),
      });

      const { findings } = getImplementation(testcases, assertions);
      const correct = findings.map(({ correct }) => correct);
      expect(correct).toEqual([
        // pass, n/a, fail, cantT, untstd
        ...[true, true, false, true, false], // passed
        ...[true, true, false, true, false], // inapplicable
        ...[false, false, true, true, false], // failed
      ]);
    });
  });

  describe("{ complete }", () => {
    it("is `true` if all testcases have an assertion", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "inapplicable", "failed"],
      });
      const { complete } = getImplementation(testcases, assertions);
      expect(complete).toBe(true);
    });

    it("is `false` if some testcases have outcome: untested", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["untested", "inapplicable", "failed"],
      });
      const { complete } = getImplementation(testcases, assertions);
      expect(complete).toBe(false);
    });

    it("is `false` if some testcases have no assertion", () => {
      const { complete } = getImplementation(
        toTestcases(
          ["foo", "passed"],
          ["bar", "inapplicable"],
          ["baz", "failed"]
        ),
        toAssertions(["bar", "inapplicable"], ["baz", "failed"])
      );
      expect(complete).toBe(false);
    });
  });

  describe("{ consitency }", () => {
    it("is `consistent` if expected matches actual outcome", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "inapplicable", "failed"],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("consistent");
    });

    it("is `consistent` if passed and inapplicable are switched", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["inapplicable", "passed", "failed"],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("consistent");
    });

    it("is `consistent` with some cantTells (but not all)", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["cantTell", "passed", "cantTell"],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("consistent");
    });

    it("is `consistent` with not all passed | inapplicable | failed as untested", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz", "biz", "buz", "bop"],
        expected: [
          "passed",
          "passed",
          "inapplicable",
          "inapplicable",
          "failed",
          "failed",
        ],
        impl0: [
          "passed",
          "untested",
          "inapplicable",
          "untested",
          "failed",
          "untested",
        ],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("consistent");
    });

    it("is `consistent` if all inapplicable cases are untested, but the rest matches", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "untested", "failed"],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("consistent");
    });

    it("is `partially-consitent` if expected failed has passed", () => {
      const { consistency } = getImplementation(
        toTestcases(
          ["foo", "passed"],
          ["bar", "inapplicable"],
          ["baz", "failed"],
          ["fiz", "failed"]
        ),
        toAssertions(
          ["foo", "passed"],
          ["bar", "inapplicable"],
          ["baz", "passed"],
          ["fiz", "failed"]
        )
      );
      expect(consistency).toBe("partially-consistent");
    });

    it("is `partially-consitent` if expected failed has inapplicable", () => {
      const { consistency } = getImplementation(
        toTestcases(
          ["foo", "passed"],
          ["bar", "inapplicable"],
          ["baz", "failed"],
          ["fiz", "failed"]
        ),
        toAssertions(
          ["foo", "passed"],
          ["bar", "inapplicable"],
          ["baz", "inapplicable"],
          ["fiz", "failed"]
        )
      );
      expect(consistency).toBe("partially-consistent");
    });

    it("is `inconsistent` if no failed case is failed or cantTell", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "inapplicable", "passed"],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("inconsistent");
    });

    it("is `inconsistent` if expected passed has failed", () => {
      const { consistency } = getImplementation(
        toTestcases(
          ["foo", "passed"],
          ["bar", "inapplicable"],
          ["baz", "failed"]
        ),
        toAssertions(
          ["foo", "failed"],
          ["bar", "inapplicable"],
          ["baz", "failed"]
        )
      );
      expect(consistency).toBe("inconsistent");
    });

    it("is `inconsistent` if expected inapplicable has failed", () => {
      const { consistency } = getImplementation(
        toTestcases(
          ["foo", "passed"],
          ["bar", "inapplicable"],
          ["baz", "failed"]
        ),
        toAssertions(["foo", "passed"], ["bar", "failed"], ["baz", "failed"])
      );
      expect(consistency).toBe("inconsistent");
    });

    it("is `inconsistent` if all passed cases are untested", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["untested", "inapplicable", "failed"],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("inconsistent");
    });

    it("is `inconsistent` if all failed cases are untested", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "inapplicable", "untested"],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("inconsistent");
    });

    it("is `inconsistent` if all outcomes are untested or cantTell", () => {
      const { testcases, assertions } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz", "biz", "buz", "bop"],
        expected: [
          "passed",
          "passed",
          "inapplicable",
          "inapplicable",
          "failed",
          "failed",
        ],
        impl0: [
          "cantTell",
          "untested",
          "cantTell",
          "untested",
          "cantTell",
          "untested",
        ],
      });
      const { consistency } = getImplementation(testcases, assertions);
      expect(consistency).toBe("inconsistent");
    });
  });
});
