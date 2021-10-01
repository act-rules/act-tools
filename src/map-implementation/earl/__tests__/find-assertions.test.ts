import { findAssertions } from "../find-assertions";

describe("findAssertions", () => {
  const earl = `http://www.w3.org/ns/earl#`;
  it("throws when passed an invalid argument", () => {
    const err = (data: any) =>
      new TypeError(`JSON report must be an object or array, got '${data}'`);
    // @ts-expect-error
    expect(findAssertions("hello world")).rejects.toEqual(err("hello world"));
    // @ts-expect-error
    expect(findAssertions(123)).rejects.toEqual(err(123));
    // @ts-expect-error
    expect(findAssertions(true)).rejects.toEqual(err(true));
  });

  it("returns an array of assertions from an array of objects", async () => {
    const id1 = "https://myAssertions.org/foo";
    const id2 = "https://myAssertions.org/bar";

    const assertions = await findAssertions([
      { "@type": `${earl}Assertion`, "@id": id1 },
      { "@type": `${earl}Assertion`, "@id": id2 },
    ]);
    expect(assertions.length).toBe(2);
    assertions.forEach((assertion) =>
      expect(assertion["@type"]).toBe("earl:Assertion")
    );
    const ids = assertions.map((a) => a["@id"]);
    expect(ids).toContain(id1);
    expect(ids).toContain(id2);
  });

  it("returns an array of assertions from an object", async () => {
    const id1 = "https://myAssertions.org/foo";
    const id2 = "https://myAssertions.org/bar";

    const assertions = await findAssertions({
      "@type": `${earl}TestSubject`,
      "@reverse": {
        [`${earl}subject`]: [
          { "@type": `${earl}Assertion`, "@id": id1 },
          { "@type": `${earl}Assertion`, "@id": id2 },
        ],
      },
    });

    expect(assertions.length).toBe(2);
    assertions.forEach((assertion) =>
      expect(assertion["@type"]).toBe("earl:Assertion")
    );
    const ids = assertions.map((a) => a["@id"]);
    expect(ids).toContain(id1);
    expect(ids).toContain(id2);
  });

  it("returns an empty array if there are no assertions", async () => {
    const assertions = await findAssertions({
      "@type": `${earl}TestSubject`,
      "@id": "https://myAssertions.org/foo",
    });
    expect(assertions.length).toBe(0);
  });
});
