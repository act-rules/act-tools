import { sourceFromSubject } from "../get-source";

describe("sourceFromSubject", () => {
  it("returns the id if it is a string", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    expect(sourceFromSubject(uri)).toBe(uri);
  });

  it("returns the rule ID from source over id and title", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    const incorrect = "/abc123/5555555555555555555555555555555555555555.html";
    expect(
      sourceFromSubject({
        "@type": "earl:TestSubject",
        "@id": incorrect,
        source: uri,
        title: incorrect,
      })
    ).toBe(uri);
  });

  it("returns the rule ID from id over title", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    const incorrect = "/abc123/5555555555555555555555555555555555555555.html";
    expect(
      sourceFromSubject({
        "@type": "earl:TestSubject",
        "@id": uri,
        title: incorrect,
      })
    ).toBe(uri);
  });

  it("returns the rule ID from title", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    expect(
      sourceFromSubject({
        "@type": "earl:TestSubject",
        title: uri,
      })
    ).toBe(uri);
  });

  it("throws if its not passed a string or object", () => {
    // @ts-expect-error
    expect(() => ruleIdFromSubject(123)).toThrow();
    // @ts-expect-error
    expect(() => ruleIdFromSubject(true)).toThrow();
    // @ts-expect-error
    expect(() => ruleIdFromSubject(null)).toThrow();
  });

  it("returns null if there is no URI", () => {
    expect(
      sourceFromSubject({
        "@type": "earl:TestSubject",
      })
    ).toBeNull();
  });
});
