import type { RulePage } from "../../types";
import {
  buildAtomicIdsReferencedByComposites,
  getRuleTypeSummary,
} from "../rule-type-summary";

function atomicRule(
  id: string,
  overrides: Partial<RulePage["frontmatter"]> = {},
): RulePage {
  return {
    body: "",
    markdownAST: { type: "root", children: [] } as RulePage["markdownAST"],
    filename: `${id}.md`,
    assets: {},
    frontmatter: {
      id,
      name: id,
      rule_type: "atomic",
      description: "",
      input_aspects: [],
      ...overrides,
    } as RulePage["frontmatter"],
  };
}

function compositeRule(
  id: string,
  input_rules: string[],
  overrides: Partial<RulePage["frontmatter"]> = {},
): RulePage {
  return {
    body: "",
    markdownAST: { type: "root", children: [] } as RulePage["markdownAST"],
    filename: `${id}.md`,
    assets: {},
    frontmatter: {
      id,
      name: id,
      rule_type: "composite",
      description: "",
      input_rules,
      ...overrides,
    } as RulePage["frontmatter"],
  };
}

describe("buildAtomicIdsReferencedByComposites", () => {
  it("collects input_rules from all composite rules", () => {
    const rules: RulePage[] = [
      compositeRule("c1", ["a1", "a2"]),
      compositeRule("c2", ["a2", "a3"]),
    ];
    const set = buildAtomicIdsReferencedByComposites(rules);
    expect([...set].sort()).toEqual(["a1", "a2", "a3"]);
  });

  it("dedupes ids referenced by multiple composites", () => {
    const rules: RulePage[] = [
      compositeRule("c1", ["x"]),
      compositeRule("c2", ["x"]),
    ];
    expect(buildAtomicIdsReferencedByComposites(rules)).toEqual(new Set(["x"]));
  });

  it("ignores atomic rules", () => {
    const rules: RulePage[] = [atomicRule("a1"), compositeRule("c1", ["a1"])];
    expect(buildAtomicIdsReferencedByComposites(rules)).toEqual(
      new Set(["a1"]),
    );
  });
});

describe("getRuleTypeSummary", () => {
  const referenced = new Set(["used-in-composite"]);

  it('returns "composite" for composite rules', () => {
    expect(getRuleTypeSummary(compositeRule("c1", ["a"]), referenced)).toBe(
      "composite",
    );
  });

  it('returns "composed" when atomic id is referenced by a composite', () => {
    expect(
      getRuleTypeSummary(atomicRule("used-in-composite"), referenced),
    ).toBe("composed");
  });

  it('returns "atomic" for standalone atomics', () => {
    expect(getRuleTypeSummary(atomicRule("standalone"), referenced)).toBe(
      "atomic",
    );
  });
});
