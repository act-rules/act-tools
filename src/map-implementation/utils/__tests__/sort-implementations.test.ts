import { sortImplementations } from "../sort-implementations";
import { testDataFromTables } from "../../__test-utils";

describe("sortImplementations", () => {
  it("prioritises no meaningful results after number of inconsistencies", () => {
    const { implementationMaps } = testDataFromTables({
      expected: [
        "passed",
        "passed",
        "failed",
        "failed",
        "failed",
        "inapplicable",
      ],
      // Nothing tested, should come last
      impl0: [
        "untested",
        "cantTell",
        "untested",
        "cantTell",
        "untested",
        "cantTell",
      ],
      // 1 insonsitencies, between impl2 and impl4
      impl1: ["failed", "passed", "failed", "failed", "failed", "inapplicable"],
    });

    const sorted = Object.values(implementationMaps[0])
      .sort(sortImplementations)
      .map(({ implementationId }) => implementationId);

    expect(sorted).toEqual(["impl1", "impl0"]);
  });

  it("sorts least number of insonsitencies after partially consistent", () => {
    const { implementationMaps } = testDataFromTables({
      expected: [
        "passed",
        "passed",
        "failed",
        "failed",
        "failed",
        "inapplicable",
      ],
      // 1 insonsitencies, between impl2 and impl4
      impl0: ["failed", "passed", "failed", "failed", "failed", "inapplicable"],
      // 2 insonsitencies, between impl0 and impl3
      impl1: ["failed", "failed", "failed", "failed", "failed", "inapplicable"],
      // 1 partially consistent
      impl2: ["passed", "passed", "failed", "passed", "passed", "inapplicable"],
    });

    const sorted = Object.values(implementationMaps[0])
      .sort(sortImplementations)
      .map(({ implementationId }) => implementationId);

    expect(sorted).toEqual(["impl2", "impl0", "impl1"]);
  });

  it("sorts least number of partially consistent after consistent with untested", () => {
    const { implementationMaps } = testDataFromTables({
      expected: [
        "passed",
        "passed",
        "failed",
        "failed",
        "failed",
        "inapplicable",
      ],
      // 1 missing on failed  - 2
      impl0: [
        "passed",
        "passed",
        "failed",
        "cantTell",
        "passed",
        "inapplicable",
      ],
      // 2 missing on failed  - 1
      impl1: [
        "passed",
        "passed",
        "failed",
        "passed",
        "inapplicable",
        "inapplicable",
      ],
      // 1 untested un failed  - 3
      impl2: [
        "passed",
        "passed",
        "failed",
        "untested",
        "failed",
        "inapplicable",
      ],
    });

    const sorted = Object.values(implementationMaps[0])
      .sort(sortImplementations)
      .map(({ implementationId }) => implementationId);

    expect(sorted).toEqual(["impl2", "impl0", "impl1"]);
  });

  it("sorts least number of untested after cantTells", () => {
    const { implementationMaps } = testDataFromTables({
      expected: [
        "passed",
        "passed",
        "failed",
        "failed",
        "failed",
        "inapplicable",
      ],
      // 1 untested
      impl0: [
        "untested",
        "passed",
        "failed",
        "failed",
        "failed",
        "inapplicable",
      ],
      // 2 untested
      impl1: [
        "untested",
        "passed",
        "untested",
        "failed",
        "failed",
        "inapplicable",
      ],
      // no untested, 3 cantTells
      impl2: [
        "cantTell",
        "passed",
        "cantTell",
        "cantTell",
        "failed",
        "inapplicable",
      ],
    });

    const sorted = Object.values(implementationMaps[0])
      .sort(sortImplementations)
      .map(({ implementationId }) => implementationId);

    expect(sorted).toEqual(["impl2", "impl0", "impl1"]);
  });

  it("sorts least number of cantTells", () => {
    const { implementationMaps } = testDataFromTables({
      expected: [
        "passed",
        "passed",
        "failed",
        "failed",
        "failed",
        "inapplicable",
      ],
      // 1 cantTell
      impl0: [
        "cantTell",
        "passed",
        "failed",
        "failed",
        "failed",
        "inapplicable",
      ],
      // 2 cantTell
      impl1: [
        "passed",
        "cantTell",
        "cantTell",
        "failed",
        "failed",
        "inapplicable",
      ],
      // 0 cantTells
      impl2: ["passed", "passed", "failed", "failed", "failed", "inapplicable"],
    });

    const sorted = Object.values(implementationMaps[0])
      .sort(sortImplementations)
      .map(({ implementationId }) => implementationId);

    expect(sorted).toEqual(["impl2", "impl0", "impl1"]);
  });
});
