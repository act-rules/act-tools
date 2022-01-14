import { testDataFromTables } from "../__test-utils";
import { getImplementationMapping } from "../get-implementation-mapping";

describe('getImplementationMapping', () => {
  it('runs with some content', async () => {
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

    const mapping = await getImplementationMapping(earl, { testcases }, meta);
    expect(mapping).toMatchObject(meta);
  })
});