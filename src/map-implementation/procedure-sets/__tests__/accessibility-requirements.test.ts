import {
  mapsAllRequirements,
  getRequirementUris,
} from "../accessibility-requirements";
import { AccessibilityRequirement } from "../../types";

describe("accessibility-requirements", () => {
  const requirement: AccessibilityRequirement = {
    failed: "not satisfied",
    passed: "further testing needed",
    inapplicable: "further testing needed",
  };

  describe("getRequirementUris", () => {
    it("returns wcag URIs", () => {
      const uris = getRequirementUris({
        "wcag21:1.1.1": requirement,
        "wcag20:4.1.2": requirement,
      });
      expect(uris).toHaveLength(2);
      expect(uris).toContain("WCAG2:non-text-content");
      expect(uris).toContain("WCAG2:name-role-value");
    });

    it("ignores non-wcag mappings", () => {
      const uris = getRequirementUris({
        "wcag20:4.1.2": requirement,
        "aria:1.1.1": requirement,
      });
      expect(uris).toHaveLength(1);
      expect(uris).toContain("WCAG2:name-role-value");
    });

    it("ignores unknown WCAG criteria", () => {
      const uris = getRequirementUris({
        "wcag20:4.1.2": requirement,
        "wcag20:9.9.9": requirement,
      });
      expect(uris).toHaveLength(1);
      expect(uris).toContain("WCAG2:name-role-value");
    });
  });

  describe("mapsAllRequirements", () => {
    it("returns true if both are empty", () => {
      expect(mapsAllRequirements([], {})).toBe(true);
    });

    it("returns true if the requirement matches", () => {
      const maps = mapsAllRequirements(
        ["WCAG2:non-text-content", "WCAG2:name-role-value"],
        {
          "wcag20:4.1.2": requirement,
          "wcag21:1.1.1": requirement,
        }
      );
      expect(maps).toBe(true);
    });

    it("returns false if a requirement is missing", () => {
      const maps = mapsAllRequirements(["WCAG2:non-text-content"], {
        "wcag20:4.1.2": requirement,
        "wcag21:1.1.1": requirement,
      });
      expect(maps).toBe(false);
    });

    it("returns false if there are too many failed requirements", () => {
      const maps = mapsAllRequirements(
        ["WCAG2:non-text-content", "WCAG2:name-role-value", "WCAG2:reflow"],
        {
          "wcag20:4.1.2": requirement,
          "wcag21:1.1.1": requirement,
        }
      );
      expect(maps).toBe(false);
    });

    it("returns false if the requirements do not match", () => {
      const maps = mapsAllRequirements(
        ["WCAG2:name-role-value", "WCAG2:reflow"],
        {
          "wcag20:4.1.2": requirement,
          "wcag21:1.1.1": requirement,
        }
      );
      expect(maps).toBe(false);
    });

    it("ignores non-normative requirements", () => {
      const maps = mapsAllRequirements(["WCAG2:non-text-content"], {
        "wcag21:1.1.1": requirement,
        "https://www.w3.org/WAI/WCAG21/Techniques/failures/F3.html":
          requirement,
      });
      expect(maps).toBe(true);
    });
  });
});
