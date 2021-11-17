import { filenameEscape } from "../filename-escape";

describe("filenameEscape", () => {
  it("casts to lower case", () => {
    const out = filenameEscape("AcmeCorpTool");
    expect(out).toBe("acmecorptool");
  });

  it("strips non-alphanumeric values", () => {
    const out = filenameEscape("(foo:;//123\\baz)");
    expect(out).toBe("foo-123-baz");
  });

  it("replaces whitespace with dashes", () => {
    const out = filenameEscape("\tfoo  123\nbaz");
    expect(out).toBe("foo-123-baz");
  });
});
