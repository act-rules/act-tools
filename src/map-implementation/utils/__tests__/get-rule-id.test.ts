import { ruleIdFromUri, ruleIdFromSubject } from "../get-rule-id";

describe("ruleIdFromUri", () => {
  it("returns the rule ID", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    expect(ruleIdFromUri(uri)).toBe("5f99a7");
  });

  it("throws if the rule ID is too short", () => {
    const uri = "/59a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    expect(() => ruleIdFromUri(uri)).toThrow();
  });

  it("throws if the rule ID is too long", () => {
    const uri = "/5f99a73sd/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    expect(() => ruleIdFromUri(uri)).toThrow();
  });

  it("throws if the testcase ID is too short", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c.html";
    expect(() => ruleIdFromUri(uri)).toThrow();
  });

  it("throws if the testcase ID is too long", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c77.html";
    expect(() => ruleIdFromUri(uri)).toThrow();
  });

  it("throws if there is no extension", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.";
    expect(() => ruleIdFromUri(uri)).toThrow();
  });
});

describe("ruleIdFromSubject", () => {
  it("returns the id if it is a string", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    expect(ruleIdFromSubject(uri)).toBe("5f99a7");
  });

  it("returns the rule ID from source", () => {
    const uri = "/5f99a7/55f3ed0ec0f324514a0d223b737bc1e4c81593c7.html";
    const incorrect = "/abc123/5555555555555555555555555555555555555555.html";
    expect(
      ruleIdFromSubject({
        "@type": "earl:TestSubject",
        "@id": incorrect,
        source: uri,
        title: incorrect,
      })
    ).toBe("5f99a7");
  });

  it("throws if the URI has no rule ID", () => {
    expect(() =>
      ruleIdFromSubject({
        "@type": "earl:TestSubject",
        source: "foobar",
      })
    ).toThrow();
  });
});
