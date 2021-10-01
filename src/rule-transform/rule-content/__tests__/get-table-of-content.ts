import { getTableOfContent } from "../get-table-of-content";

describe("getTableOfContent", () => {
  it("returns a string including toc.html", () => {
    expect(getTableOfContent()).toContain("toc.html");
  });
});
