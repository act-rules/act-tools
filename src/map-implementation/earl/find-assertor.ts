import assert from "assert";
import { frame as jsonldFrame, JsonLdDocument } from "jsonld";
import { EarlAssertor, AssertorGraph, ActImplementationMeta } from "./types";
import earlContext from "./earl-context.json";

const assertorFrame = {
  "@context": earlContext["@context"],
  "@type": "earl:Assertor",
};

export async function findAssertor(
  jsonReports: JsonLdDocument,
  metaData: ActImplementationMeta
): Promise<ActImplementationMeta> {
  assert(
    typeof jsonReports === "object",
    `JSON report must be an object or array, got '${jsonReports}'`
  );

  let assertor = (await jsonldFrame(jsonReports, assertorFrame)) as
    | AssertorGraph
    | EarlAssertor;

  if ("@graph" in assertor) {
    // If multiple, get the first
    assertor = assertor[`@graph`][0];
  }

  metaData = { ...metaData };
  metaData.name ??= assertor.name;
  metaData.version ??= assertor.release?.revision;
  return metaData;
}
