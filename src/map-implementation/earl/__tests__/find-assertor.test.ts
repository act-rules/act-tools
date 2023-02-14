import { findAssertor } from "../find-assertor";
import { ActImplementationMeta } from "../types";

describe("findAssertor", () => {
  const earl = `http://www.w3.org/ns/earl#`;
  const doap = "http://usefulinc.com/ns/doap#";
  const dummyAssertion = { "@type": `${earl}Assertion` };
  const dummyAssertor = {
    "@type": `${earl}Assertor`,
    [`${doap}name`]: "my-better-tool",
    [`${doap}release`]: {
      [`${doap}revision`]: "2.0",
    },
  };

  let metaData: ActImplementationMeta;
  beforeEach(() => {
    metaData = {
      name: "cool-tool",
      vendor: "cool-corp",
      version: "99",
    };
  });

  it("does not override existing props", async () => {
    const result = await findAssertor(dummyAssertor, metaData);
    expect(result).toEqual(metaData);
  });

  it("returns metadata when there is no assertor", async () => {
    const result = await findAssertor(dummyAssertion, metaData);
    expect(result).toEqual(metaData);
  });

  it("sets name when not in metaData", async () => {
    delete metaData.name;
    const report = {
      "@type": `${earl}Assertor`,
      [`${doap}name`]: "my-better-tool",
    };
    const result = await findAssertor(report, metaData);
    expect(result).toEqual({
      name: "my-better-tool",
      ...metaData,
    });
  });

  it("sets version when not in metaData", async () => {
    delete metaData.version;
    const report = {
      "@type": `${earl}Assertor`,
      [`${doap}release`]: {
        [`${doap}revision`]: "2.0",
      },
    };

    const result = await findAssertor(report, metaData);
    expect(result).toEqual({
      version: "2.0",
      ...metaData,
    });
  });

  it("works when the assertor is not the first object", async () => {
    const report = { "@graph": [dummyAssertion, dummyAssertor] };
    const result = await findAssertor(report, {});
    expect(result).toEqual({
      name: "my-better-tool",
      version: "2.0",
    });
  });

  it("returns the first assertor when there are multiple", async () => {
    const report = [
      dummyAssertion,
      dummyAssertor,
      dummyAssertion,
      { ...dummyAssertor, [`${doap}name`]: "my-worst-tool" },
    ];
    const result = await findAssertor(report, {});
    expect(result).toEqual({
      name: "my-better-tool",
      version: "2.0",
    });
  });
});
