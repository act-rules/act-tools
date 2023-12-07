import { earlToActAssertions } from "../earl-to-act-assertions";
// For some reason that is beyond me, remote contexts error out when running
// in ts-jest. Something to do with how @digitalbazaar/http-client (used by jsonld)
// exports its methods I think. Since hitting network during tests is a bad idea
// we're going to ignore that problem. Shouldn't impact production.
import earlContext from "../earl-context.json";

describe("earlToActAssertions", () => {
  const ruleId = "a1b64e";
  const testCaseId = "6c3ac31577c3cb2d968fc26c4075dd533b5513fc";
  const testCaseUrl = `https://act-rules.github.io/testcases/${ruleId}/${testCaseId}.html`;
  const automatic = true;
  const accessibilityRequirements: string[] = [];
  const sharedProps = {
    ruleId,
    testCaseId,
    testCaseUrl,
    automatic,
    accessibilityRequirements,
  };

  it("extracts normalized assertions", async () => {
    const actAssertions = await earlToActAssertions({
      "@context": earlContext["@context"],
      "@graph": [
        {
          "@type": "Assertion",
          test: { title: "procedure-a" },
          subject: { source: testCaseUrl },
          result: { outcome: "earl:failed" },
        },
        {
          "@type": "Assertion",
          test: { title: "procedure-b" },
          subject: { source: testCaseUrl },
          result: { outcome: "earl:passed" },
        },
      ],
    });

    expect(actAssertions).toEqual([
      {
        ...sharedProps,
        procedureName: "procedure-a",
        outcome: "failed",
      },
      {
        ...sharedProps,
        procedureName: "procedure-b",
        outcome: "passed",
      },
    ]);
  });

  it("can process framed properties", async () => {
    const actAssertions = await earlToActAssertions({
      "@context": [
        earlContext["@context"],
        {
          assertions: { "@reverse": "earl:subject" },
        },
      ],
      "@type": "TestSubject",
      source: testCaseUrl,
      assertions: [
        {
          "@type": "Assertion",
          test: { title: "procedure-a" },
          result: { outcome: "earl:failed" },
        },
        {
          "@type": "Assertion",
          test: { title: "procedure-b" },
          result: { outcome: "earl:passed" },
        },
      ],
    });

    expect(actAssertions).toEqual([
      {
        ...sharedProps,
        procedureName: "procedure-a",
        outcome: "failed",
      },
      {
        ...sharedProps,
        procedureName: "procedure-b",
        outcome: "passed",
      },
    ]);
  });

  it("returns accessibility requirements", async () => {
    const actAssertions = await earlToActAssertions({
      "@context": earlContext["@context"],
      "@graph": [
        {
          "@type": "Assertion",
          test: {
            title: "procedure-a",
            "dct:isPartOf": "https://www.w3.org/TR/WCAG22/#name-role-value",
          },
          subject: { source: testCaseUrl },
          result: { outcome: "earl:failed" },
        },
      ],
    });

    expect(actAssertions).toEqual([
      {
        ...sharedProps,
        procedureName: "procedure-a",
        outcome: "failed",
        accessibilityRequirements: ["WCAG2:name-role-value"],
      },
    ]);
  });

  it("ignores assertions with missing properties", async () => {
    const actAssertions = await earlToActAssertions({
      "@context": earlContext["@context"],
      "@graph": [
        {
          "@type": "Assertion",
          // "test": { "title": "procedure-a" },
          subject: { source: testCaseUrl },
          result: { outcome: "earl:failed" },
        },
        {
          "@type": "Assertion",
          test: { title: "procedure-a" },
          // "subject": { "source": testCaseUrl },
          result: { outcome: "earl:failed" },
        },
        {
          "@type": "Assertion",
          test: { title: "procedure-b" },
          subject: { source: testCaseUrl },
          // "result": { "outcome": "earl:passed" }
        },
      ],
    });
    expect(actAssertions).toHaveLength(0);
  });
});
