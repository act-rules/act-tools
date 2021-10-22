import moment from "moment";
import { getFooter } from "../get-footer";

describe("getFooter", () => {
  it("has a paragraph on each line", () => {
    const footer = getFooter({
      authors: ["Billy Jean"],
    });
    const lines = footer.split("\n");
    for (const line of lines) {
      expect(line).toMatch(/^<p>/);
      expect(line).toMatch(/<\/p>$/);
    }
  });

  it("returns the date", () => {
    const footer = getFooter({});
    expect(footer).toContain("Date:");
    expect(footer).toContain(moment().format("D MMMM YYYY"));
  });

  it("returns no authors if none is specified", () => {
    const footer = getFooter({});
    expect(footer).not.toContain("Authors:");
  });

  it("returns authors", () => {
    const footer = getFooter({
      authors: ["Billy Jean"],
    });
    expect(footer).toContain("Authors:");
    expect(footer).toContain("Billy Jean");
  });

  it("returns previous authors", () => {
    const footer = getFooter({
      authors: ["Billy Jean"],
      previous_authors: ["Fannybaws"],
    });
    expect(footer).toContain("Previous Authors:");
    expect(footer).toContain("Fannybaws");
  });

  it("returns a link the ACT-Rules CG", () => {
    const footer = getFooter({});
    expect(footer).toContain("https://w3.org/community/act-r/");
  });

  it("optionally returns WAI-Tools funding", () => {
    const footer1 = getFooter({});
    expect(footer1).not.toContain(
      "https://www.w3.org/WAI/about/projects/wai-tools/"
    );

    const footer2 = getFooter({ funding: ["WAI-tools"] });
    expect(footer2).toContain(
      "https://www.w3.org/WAI/about/projects/wai-tools/"
    );
  });

  it("optionally includes assets", () => {
    const footer1 = getFooter({});
    expect(footer1).not.toContain("Assets:");

    const footer2 = getFooter({ assets: ["Hello", "World"] });
    expect(footer2).toContain("Assets:");
    expect(footer2).toContain("Hello");
    expect(footer2).toContain("World");
  });
});
