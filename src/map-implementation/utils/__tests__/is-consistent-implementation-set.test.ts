import { testDataFromTables } from "../../__test-utils";
import { isConsistentImplementationSet } from "../is-consistent-implementation-set";

describe("isConsistentImplementationSet", () => {
  it("returns false if not all failed cases are mapped to", () => {
    const { implementationMaps } = testDataFromTables({
      testcaseIds: ["foo", "bar", "baz", "buz"],
      expected: ["failed", "failed", "failed", "passed"],
      rule0: ["failed", "passed", "passed", "failed"],
      rule1: ["passed", "failed", "passed", "failed"],
      rule2: ["failed", "failed", "passed", "failed"],
      rule3: ["passed", "passed", "passed", "failed"],
    });
    const implementations = Object.values(implementationMaps[0]);
    expect(isConsistentImplementationSet(implementations)).toBe(false);
  });

  it("returns all implementations with failed / cantTell for an expected fail", () => {
    const { implementationMaps } = testDataFromTables({
      testcaseIds: ["foo", "bar", "baz", "buz"],
      expected: ["failed", "failed", "failed", "passed"],
      rule0: ["failed", "passed", "failed", "failed"],
      rule1: ["passed", "cantTell", "passed", "cantTell"],
      rule2: ["failed", "cantTell", "passed", "failed"],
      rule3: ["passed", "passed", "passed", "failed"],
    });
    const implementations = Object.values(implementationMaps[0]);
    expect(isConsistentImplementationSet(implementations)).toBe(true);
  });
});
