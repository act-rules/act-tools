import { testDataFromTables, TestDataTable } from "../__test-utils";
import { actMapGenerator } from "../act-map-generator";
import { getImplementationSet } from "../get-implementation-set";

describe("actMapGenerator", () => {
  it("includes all the `meta` props", async () => {
    const meta = {
      vendor: "bar",
      name: "baz",
      version: "1.2.3",
    };
    const { testcases, earl } = testDataFromTables({
      testcaseIds: ["foo", "bar", "baz"],
      expected: ["passed", "inapplicable", "failed"],
      impl0: ["failed", "passed", "failed"], // inconsistent
      impl1: ["failed", "passed", "inapplicable"], // inconsistent
    });

    const mapping = await actMapGenerator(earl, { testcases }, meta);
    expect(mapping).toMatchObject(meta);
  });

  it("has an implementationSet of each rule on actMapping", async () => {
    const impl1Data: TestDataTable = {
      ruleId: "foobar",
      testcaseIds: ["foo", "bar", "baz"],
      expected: ["passed", "inapplicable", "failed"],
      impl0: ["passed", "passed", "failed"], // consistent
      impl1: ["passed", "cantTell", "inapplicable"], // partially-consistent
    };
    const rule2Data: TestDataTable = {
      ruleId: "fizbuz",
      testcaseIds: ["fiz", "buz", "fuz"],
      expected: ["passed", "inapplicable", "failed"],
      impl0: ["failed", "passed", "failed"], // inconsistent
      impl1: ["passed", "passed", "failed"], // consistent
    };
    const { testcases, earl } = testDataFromTables(impl1Data, rule2Data);
    const { actMapping } = await actMapGenerator(earl, { testcases });

    const impl1Args = testDataFromTables(impl1Data);
    const implSet1 = getImplementationSet(
      impl1Args.assertions,
      impl1Args.testcases
    );
    expect(actMapping[0]).toMatchObject(implSet1);

    const ruledArgs = testDataFromTables(rule2Data);
    const implSet2 = getImplementationSet(
      ruledArgs.assertions,
      ruledArgs.testcases
    );
    expect(actMapping[1]).toMatchObject(implSet2);
  });

  it("adds `ruleId` to actMapping", async () => {
    const { testcases, earl } = testDataFromTables(
      {
        ruleId: "foobar",
        testcaseIds: ["foo", "bar", "baz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["passed", "passed", "failed"], // consistent
        impl1: ["passed", "cantTell", "inapplicable"], // partially-consistent
      },
      {
        ruleId: "fizbuz",
        testcaseIds: ["fiz", "buz", "fuz"],
        expected: ["passed", "inapplicable", "failed"],
        impl0: ["failed", "passed", "failed"], // inconsistent
        impl1: ["passed", "passed", "failed"], // consistent
      }
    );
    const { actMapping } = await actMapGenerator(earl, { testcases });

    expect(actMapping[0]).toHaveProperty("ruleId", "foobar");
    expect(actMapping[1]).toHaveProperty("ruleId", "fizbuz");
  });

  it("adds ruleName from testcases to actMapping", async () => {
    const { testcases, earl } = testDataFromTables({
      testcaseIds: ["foo", "bar", "baz"],
      expected: ["passed", "inapplicable", "failed"],
      impl0: ["failed", "passed", "failed"], // inconsistent
      impl1: ["failed", "passed", "inapplicable"], // inconsistent
    });
    testcases.forEach((testcase) => {
      testcase.ruleName = "my-act-rule";
    });

    const { actMapping } = await actMapGenerator(earl, { testcases });
    expect(actMapping).toHaveLength(1);
    expect(actMapping[0]).toHaveProperty("ruleName", "my-act-rule");
  });
});
