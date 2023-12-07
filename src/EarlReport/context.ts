export const context = {
  "@vocab": "http://www.w3.org/ns/earl#",
  earl: "http://www.w3.org/ns/earl#",
  WCAG2: "http://www.w3.org/TR/WCAG22/#",
  dct: "http://purl.org/dc/terms/",
  sch: "https://schema.org/",
  testRuns: "@graph",
  name: "dct:name",
  shortDesc: "dct:shortdesc",
  source: "dct:source",
  title: "dct:title",
  WebPage: "sch:WebPage",
  assertedBy: { "@type": "@id" },
  outcome: { "@type": "@id" },
  mode: { "@type": "@id" },
  isPartOf: {
    "@id": "dct:isPartOf",
    "@type": "@id",
  },
  assertions: {
    "@reverse": "subject",
  },
};
