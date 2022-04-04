import { procedureNameFromTest, getFileName } from "../get-procedure-name";

describe("procedureNameFromTest", () => {
  it("returns the implementation ID if it is a string", () => {
    const implementationId = "foo";
    expect(procedureNameFromTest(implementationId)).toBe(implementationId);
  });

  it("returns the implementation ID from `title` over `@id`", () => {
    const title = "foo";
    const id = "bar";
    expect(
      procedureNameFromTest({
        "@type": "earl:TestCriterion",
        "@id": id,
        title,
      })
    ).toBe(title);
  });

  it("returns the rule ID from title", () => {
    const id = "foo/bar.html";
    expect(
      procedureNameFromTest({
        "@type": "earl:TestCriterion",
        "@id": id,
      })
    ).toBe("bar");
  });

  it("throws if its not passed a string or object", () => {
    // @ts-expect-error
    expect(() => procedureNameFromTest(123)).toThrow();
    // @ts-expect-error
    expect(() => procedureNameFromTest(true)).toThrow();
  });

  it("throws if there is no implementation ID", () => {
    expect(() =>
      procedureNameFromTest({
        "@type": "earl:TestCriterion",
      })
    ).toThrow();
  });
});

describe("getFileName", () => {
  it("returns the part after the last `/`", () => {
    expect(getFileName("foo/bar/baz")).toBe("baz");
  });

  it("does not return the part after the last `.`", () => {
    expect(getFileName("foo/bar/baz.test.html")).toBe("baz.test");
  });
});
