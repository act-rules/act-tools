import { getImplementationSet } from "../get-implementation-set";
import { testDataFromTables } from "../__test-utils";

describe("getImplementationSet", () => {
  describe("{ implementations }", () => {
    it("includes all props from the implementations", () => {
      const { assertions, testcases, implementationMaps } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["failed", "passed", "failed"], // inconsistent
        impl1: ["failed", "passed", "inapplicable"], // inconsistent
      });
      const { impl0, impl1 } = implementationMaps[0];

      const { implementations } = getImplementationSet(assertions, testcases);
      expect(implementations).toMatchObject([impl0, impl1]);
    });

    it("adds `implementationId` to the implementation", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["failed", "passed", "failed"], // inconsistent
        impl1: ["failed", "passed", "inapplicable"], // inconsistent
      });

      const { implementations } = getImplementationSet(assertions, testcases);
      expect(implementations[0]).toHaveProperty("implementationId", "impl0");
      expect(implementations[1]).toHaveProperty("implementationId", "impl1");
    });

    it("only has consistent implementations, if any are", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "inapplicable", "failed"], // consitent
        impl1: ["passed", "inapplicable", "passed"], // partially consistent
        impl2: ["failed", "inapplicable", "failed"], // inconsistent
        impl3: ["passed", "inapplicable", "failed"], // consistent
      });
      const { implementations } = getImplementationSet(assertions, testcases);
      expect(implementations).toHaveLength(2);
      expect(implementations[0]).toHaveProperty("implementationId", "impl0");
      expect(implementations[1]).toHaveProperty("implementationId", "impl3");
    });

    it("has only partially-consistent implementations, if there are no consistent ones", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz", "fiz"],
        expected: ["passed", "inapplicable", "failed", "failed"],
        impl0: ["passed", "inapplicable", "failed", "passed"], // partially consistent
        impl1: ["failed", "inapplicable", "failed", "failed"], // inconsistent
        impl2: ["passed", "inapplicable", "failed", "passed"], // partially consistent
        impl3: ["failed", "inapplicable", "failed", "failed"], // inconsistent
      });
      const { implementations } = getImplementationSet(assertions, testcases);
      expect(implementations).toHaveLength(2);
      expect(implementations[0]).toHaveProperty("implementationId", "impl0");
      expect(implementations[1]).toHaveProperty("implementationId", "impl2");
    });

    it("sorts implementations", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["failed", "failed", "failed"], // inconsistent
        impl1: ["failed", "passed", "inapplicable"], // inconsistent
        impl2: ["untested", "passed", "inapplicable"], // inconsistent
        impl3: ["untested", "untested", "inapplicable"], // inconsistent
        impl4: ["cantTell", "cantTell", "cantTell"], // inconsistent
        impl5: ["cantTell", "untested", "inapplicable"], // inconsistent
      });

      const { implementations } = getImplementationSet(assertions, testcases);
      const implementationIds = implementations.map(
        ({ implementationId }) => implementationId
      );
      expect(implementationIds).toEqual([
        "impl2",
        "impl5",
        "impl3",
        "impl1",
        "impl0",
        "impl4",
      ]);
    });
  });

  describe("{ complete }", () => {
    it("is `true` when the implementations are complete", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz", "buz"],
        expected: ["passed", "inapplicable", "failed", "failed"],
        impl0: ["passed", "inapplicable", "failed", "failed"], // consitent
        impl1: ["passed", "inapplicable", "passed", "untested"], // partially consistent
        impl2: ["untested", "inapplicable", "failed", "failed"], // inconsistent
        impl3: ["passed", "inapplicable", "failed", "failed"], // consistent
      });
      const { complete } = getImplementationSet(assertions, testcases);
      expect(complete).toBe(true);
    });

    it("is `false` when the implementations are not complete", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz", "buz"],
        expected: ["passed", "inapplicable", "failed", "failed"],
        impl0: ["passed", "inapplicable", "failed", "untested"], // consitent
        impl1: ["passed", "inapplicable", "passed", "untested"], // partially consistent
        impl2: ["untested", "inapplicable", "failed", "failed"], // inconsistent
        impl3: ["passed", "inapplicable", "untested", "failed"], // consistent
      });
      const { complete } = getImplementationSet(assertions, testcases);
      expect(complete).toBe(false);
    });
  });

  describe("{ consistency }", () => {
    it("is `inconsistent` when all implementstions are inconsistent", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["failed", "passed", "inapplicable"], // inconsistent
        impl1: ["failed", "passed", "failed"], // inconsistent
      });
      const { consistency } = getImplementationSet(assertions, testcases);
      expect(consistency).toBe("inconsistent");
    });

    it("is `partially-consistent` when all implementstions are partially-consistent", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz", "fiz"],
        expected: ["passed", "inapplicable", "failed", "failed"],
        impl0: ["passed", "inapplicable", "failed", "passed"], // partially consistent
        impl1: ["failed", "inapplicable", "failed", "failed"], // inconsistent
        impl2: ["passed", "inapplicable", "failed", "passed"], // partially consistent
        impl3: ["failed", "inapplicable", "failed", "failed"], // inconsistent
      });
      const { consistency } = getImplementationSet(assertions, testcases);
      expect(consistency).toBe("partially-consistent");
    });

    it("is `consistent` when all implementstions are consistent", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "inapplicable", "failed"], // consitent
        impl1: ["passed", "inapplicable", "passed"], // partially consistent
        impl2: ["failed", "inapplicable", "failed"], // inconsistent
        impl3: ["passed", "inapplicable", "failed"], // consistent
      });
      const { consistency } = getImplementationSet(assertions, testcases);
      expect(consistency).toBe("consistent");
    });

    it("is `consistent` when partial implementations fail all expected fails", () => {
      const { assertions, testcases } = testDataFromTables({
        testcaseIds: ["foo", "bar", "baz", "buz"],
        expected: ["passed", "inapplicable", "failed", "failed"],
        impl0: ["passed", "inapplicable", "failed", "passed"], // partially consistent
        impl1: ["passed", "inapplicable", "failed", "inapplicable"], // partially consistent
        impl2: ["failed", "inapplicable", "passed", "passed"], // inconsistent
        impl3: ["passed", "inapplicable", "passed", "failed"], // partially consistent
      });
      const { consistency } = getImplementationSet(assertions, testcases);
      expect(consistency).toBe("consistent");
    });
  });
});
