import { BoardIssue } from "../act-board";
import {
  ActBoardProjectClient,
  DEFAULT_PROJECT_FIELD_NAMES,
  OctokitActBoardProjectClient,
  parseProjectNumber,
  ProjectField,
  ProjectItem,
  ProjectSnapshot,
  RULE_STATUSES,
  syncActBoardProject,
} from "../sync-project";
import { RuleApprovalRow } from "../types";

function row(
  ruleId: string,
  overrides: Partial<RuleApprovalRow> = {},
): RuleApprovalRow {
  return {
    ruleId,
    name: `Rule ${ruleId}`,
    filename: `rule-${ruleId}.md`,
    ruleTypeSummary: "atomic",
    waiApproved: true,
    status: "Approved, current",
    reviewPrUrl: null,
    reportBucket: "approvedUpToDate",
    implementations: ["axe-core"],
    issues: [],
    blockers: [],
    changes: [],
    approvalIsoDate: "2024-01-01",
    lastUpdatedIsoDate: "2024-01-01",
    ruleCommitCount: 0,
    definitionCommitCount: 0,
    lastApprovedSummary: "2024-01-01",
    lastUpdatedSummary: "2024-01-01",
    commitsBehindSummary: "0",
    blockersCount: 0,
    ...overrides,
  };
}

function statusField(): ProjectField {
  return {
    id: "FIELD_STATUS",
    name: DEFAULT_PROJECT_FIELD_NAMES.status,
    dataType: "SINGLE_SELECT",
    options: RULE_STATUSES.map((name, index) => ({
      id: `OPT_${index}`,
      name,
    })),
  };
}

function typeField(): ProjectField {
  return {
    id: "FIELD_TYPE",
    name: DEFAULT_PROJECT_FIELD_NAMES.type,
    dataType: "SINGLE_SELECT",
    options: ["atomic", "composed", "composite"].map((name) => ({
      id: `TYPE_${name}`,
      name,
    })),
  };
}

function numberField(id: string, name: string): ProjectField {
  return { id, name, dataType: "NUMBER" };
}

function dateField(id: string, name: string): ProjectField {
  return { id, name, dataType: "DATE" };
}

function textField(id: string, name: string): ProjectField {
  return { id, name, dataType: "TEXT" };
}

function allFields(): ProjectField[] {
  return [
    statusField(),
    typeField(),
    numberField("FIELD_IMPL", DEFAULT_PROJECT_FIELD_NAMES.implCount),
    numberField("FIELD_BLOCKERS", DEFAULT_PROJECT_FIELD_NAMES.blockerCount),
    numberField("FIELD_ISSUES", DEFAULT_PROJECT_FIELD_NAMES.openIssueCount),
    numberField("FIELD_RULE", DEFAULT_PROJECT_FIELD_NAMES.ruleCommits),
    numberField("FIELD_DEFS", DEFAULT_PROJECT_FIELD_NAMES.definitionCommits),
    dateField("FIELD_APPROVED", DEFAULT_PROJECT_FIELD_NAMES.lastApproved),
    dateField("FIELD_UPDATED", DEFAULT_PROJECT_FIELD_NAMES.lastUpdated),
    textField("FIELD_PR", DEFAULT_PROJECT_FIELD_NAMES.reviewPrUrl),
  ];
}

function boardIssue(rule: RuleApprovalRow): BoardIssue {
  return {
    number: 1,
    title: `[${rule.ruleId}] ${rule.name}`,
    body: "body",
    state: "open",
    nodeId: `ISSUE_${rule.ruleId}`,
  };
}

function matchingItem(rule: RuleApprovalRow): ProjectItem {
  const approvedOption = statusField().options?.find(
    (option) => option.name === rule.status,
  );
  return {
    id: `ITEM_${rule.ruleId}`,
    issueNodeId: `ISSUE_${rule.ruleId}`,
    issueNumber: 1,
    issueTitle: `[${rule.ruleId}] ${rule.name}`,
    fieldValues: [
      {
        fieldId: "FIELD_STATUS",
        fieldName: "Status",
        optionId: approvedOption?.id,
        optionName: rule.status,
      },
      {
        fieldId: "FIELD_TYPE",
        fieldName: "type",
        optionId: "TYPE_atomic",
        optionName: "atomic",
      },
      {
        fieldId: "FIELD_IMPL",
        fieldName: DEFAULT_PROJECT_FIELD_NAMES.implCount,
        number: 1,
      },
      {
        fieldId: "FIELD_BLOCKERS",
        fieldName: DEFAULT_PROJECT_FIELD_NAMES.blockerCount,
        number: 0,
      },
      {
        fieldId: "FIELD_ISSUES",
        fieldName: DEFAULT_PROJECT_FIELD_NAMES.openIssueCount,
        number: 0,
      },
      {
        fieldId: "FIELD_RULE",
        fieldName: DEFAULT_PROJECT_FIELD_NAMES.ruleCommits,
        number: 0,
      },
      {
        fieldId: "FIELD_DEFS",
        fieldName: DEFAULT_PROJECT_FIELD_NAMES.definitionCommits,
        number: 0,
      },
      {
        fieldId: "FIELD_APPROVED",
        fieldName: DEFAULT_PROJECT_FIELD_NAMES.lastApproved,
        date: "2024-01-01",
      },
      {
        fieldId: "FIELD_UPDATED",
        fieldName: DEFAULT_PROJECT_FIELD_NAMES.lastUpdated,
        date: "2024-01-01",
      },
    ],
  };
}

function fakeProject(snapshot: ProjectSnapshot): ActBoardProjectClient & {
  addItem: jest.Mock;
  updateFieldValue: jest.Mock;
  clearFieldValue: jest.Mock;
} {
  return {
    getProject: jest.fn().mockResolvedValue(snapshot),
    addItem: jest.fn().mockResolvedValue("ITEM_NEW"),
    updateFieldValue: jest.fn().mockResolvedValue(undefined),
    clearFieldValue: jest.fn().mockResolvedValue(undefined),
  };
}

describe("syncActBoardProject", () => {
  const current = row("674b10");

  it("skips writes when Status and fields already match", async () => {
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: allFields(),
      items: [matchingItem(current)],
    });
    const result = await syncActBoardProject(
      [current],
      {
        listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
        project,
      },
      { projectNumber: 1 },
    );

    expect(result.skipped).toBe(1);
    expect(result.fieldsUpdated).toBe(0);
    expect(project.updateFieldValue).not.toHaveBeenCalled();
    expect(project.clearFieldValue).not.toHaveBeenCalled();
    expect(project.addItem).not.toHaveBeenCalled();
  });

  it("updates Status when it changed", async () => {
    const stale = matchingItem(current);
    stale.fieldValues = stale.fieldValues.map((value) =>
      value.fieldId === "FIELD_STATUS"
        ? {
            ...value,
            optionId: "OPT_OTHER",
            optionName: "Proposed, reviewable",
          }
        : value,
    );
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: allFields(),
      items: [stale],
    });

    const result = await syncActBoardProject(
      [current],
      {
        listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
        project,
      },
      { projectNumber: 1 },
    );

    expect(result.fieldsUpdated).toBeGreaterThan(0);
    expect(project.updateFieldValue).toHaveBeenCalledWith(
      "PROJECT",
      stale.id,
      "FIELD_STATUS",
      {
        singleSelectOptionId: statusField().options?.find(
          (option) => option.name === "Approved, current",
        )?.id,
      },
    );
  });

  it("skips missing optional fields and still syncs Status", async () => {
    const warnings: string[] = [];
    const second = row("2ee8b8");
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: [statusField()],
      items: [
        {
          id: "ITEM_674b10",
          issueNodeId: "ISSUE_674b10",
          fieldValues: [
            {
              fieldId: "FIELD_STATUS",
              fieldName: "Status",
              optionId: statusField().options?.find(
                (option) => option.name === "Approved, current",
              )?.id,
              optionName: "Approved, current",
            },
          ],
        },
        {
          id: "ITEM_2ee8b8",
          issueNodeId: "ISSUE_2ee8b8",
          fieldValues: [
            {
              fieldId: "FIELD_STATUS",
              fieldName: "Status",
              optionId: statusField().options?.find(
                (option) => option.name === "Approved, current",
              )?.id,
              optionName: "Approved, current",
            },
          ],
        },
      ],
    });

    const result = await syncActBoardProject(
      [current, second],
      {
        listBoardIssues: jest
          .fn()
          .mockResolvedValue([boardIssue(current), boardIssue(second)]),
        project,
      },
      {
        projectNumber: 1,
        warn: (message) => warnings.push(message),
      },
    );

    expect(result.optionalFieldsSkipped).toBe(9);
    expect(project.updateFieldValue).not.toHaveBeenCalled();
    expect(warnings.some((message) => message.includes("impl count"))).toBe(
      true,
    );
    expect(warnings).toHaveLength(9);
  });

  it("skips an optional field with the wrong data type once", async () => {
    const wrongType = textField(
      "FIELD_IMPL",
      DEFAULT_PROJECT_FIELD_NAMES.implCount,
    );
    const warnings: string[] = [];
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: [statusField(), wrongType],
      items: [matchingItem(current)],
    });

    const result = await syncActBoardProject(
      [current],
      {
        listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
        project,
      },
      { projectNumber: 1, warn: (message) => warnings.push(message) },
    );

    expect(result.optionalFieldsSkipped).toBe(9);
    expect(warnings).toContain(
      'Skipping optional Project field "impl count": expected data type NUMBER, got TEXT',
    );
    expect(project.updateFieldValue).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "FIELD_IMPL",
      expect.anything(),
    );
  });

  it("fails when the Status field is missing", async () => {
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: [typeField()],
      items: [],
    });

    await expect(
      syncActBoardProject(
        [current],
        {
          listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
          project,
        },
        { projectNumber: 1, warn: () => undefined },
      ),
    ).rejects.toThrow(/missing required field "Status"/i);
  });

  it("adds a Project item when the issue is not on the board", async () => {
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: [statusField()],
      items: [],
    });

    const result = await syncActBoardProject(
      [current],
      {
        listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
        project,
      },
      { projectNumber: 1, warn: () => undefined },
    );

    expect(result.itemsAdded).toBe(1);
    expect(project.addItem).toHaveBeenCalledWith("PROJECT", "ISSUE_674b10");
    expect(project.updateFieldValue).toHaveBeenCalledWith(
      "PROJECT",
      "ITEM_NEW",
      "FIELD_STATUS",
      expect.objectContaining({ singleSelectOptionId: expect.any(String) }),
    );
  });

  it("clears an empty review PR URL field", async () => {
    const item = matchingItem(current);
    item.fieldValues.push({
      fieldId: "FIELD_PR",
      fieldName: DEFAULT_PROJECT_FIELD_NAMES.reviewPrUrl,
      text: "https://example.com/old",
    });
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: allFields(),
      items: [item],
    });

    await syncActBoardProject(
      [current],
      {
        listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
        project,
      },
      { projectNumber: 1 },
    );

    expect(project.clearFieldValue).toHaveBeenCalledWith(
      "PROJECT",
      item.id,
      "FIELD_PR",
    );
  });

  it("prefers an open higher-numbered issue over a closed duplicate", async () => {
    const closed = {
      ...boardIssue(current),
      number: 10,
      state: "closed" as const,
      nodeId: "ISSUE_CLOSED",
    };
    const open = {
      ...boardIssue(current),
      number: 20,
      state: "open" as const,
      nodeId: "ISSUE_OPEN",
    };
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: [statusField()],
      items: [],
    });

    await syncActBoardProject(
      [current],
      {
        listBoardIssues: jest.fn().mockResolvedValue([closed, open]),
        project,
      },
      { projectNumber: 1, warn: () => undefined },
    );

    expect(project.addItem).toHaveBeenCalledWith("PROJECT", "ISSUE_OPEN");
  });

  it("continues after a row failure and reports rows without issues", async () => {
    const failed = row("2ee8b8");
    const missing = row("abcdef");
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: [statusField()],
      items: [],
    });
    project.addItem
      .mockRejectedValueOnce(new Error("mutation failed"))
      .mockResolvedValueOnce("ITEM_OK");

    const result = await syncActBoardProject(
      [failed, current, missing],
      {
        listBoardIssues: jest
          .fn()
          .mockResolvedValue([boardIssue(failed), boardIssue(current)]),
        project,
      },
      { projectNumber: 1, warn: () => undefined },
    );

    expect(result.failures).toEqual([
      { ruleId: failed.ruleId, message: "mutation failed" },
    ]);
    expect(result.rowsWithoutIssue).toBe(1);
    expect(result.itemsAdded).toBe(1);
    expect(project.addItem).toHaveBeenCalledTimes(2);
  });

  it("does not count a field update when its mutation fails", async () => {
    const stale = matchingItem(current);
    const staleStatus = stale.fieldValues.find(
      (value) => value.fieldId === "FIELD_STATUS",
    );
    if (!staleStatus) throw new Error("Missing status fixture");
    staleStatus.optionId = "STALE";
    staleStatus.optionName = "In review";
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: allFields(),
      items: [stale],
    });
    project.updateFieldValue.mockRejectedValueOnce(new Error("write failed"));

    const result = await syncActBoardProject(
      [current],
      {
        listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
        project,
      },
      { projectNumber: 1, warn: () => undefined },
    );

    expect(result.fieldsUpdated).toBe(0);
    expect(result.failures).toHaveLength(1);
  });

  it("normalizes both date values before comparing", async () => {
    const item = matchingItem(current);
    const approved = item.fieldValues.find(
      (value) => value.fieldId === "FIELD_APPROVED",
    );
    if (approved) approved.date = "2024-01-01T23:59:59Z";
    const project = fakeProject({
      id: "PROJECT",
      title: "ACT board",
      fields: allFields(),
      items: [item],
    });

    await syncActBoardProject(
      [row(current.ruleId, { approvalIsoDate: "2024-01-01T00:00:00Z" })],
      {
        listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
        project,
      },
      { projectNumber: 1 },
    );

    expect(project.updateFieldValue).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "FIELD_APPROVED",
      expect.anything(),
    );
  });
});

describe("parseProjectNumber", () => {
  it("accepts only positive integer strings", () => {
    expect(parseProjectNumber("12")).toBe(12);
    expect(parseProjectNumber("12abc")).toBeNull();
    expect(parseProjectNumber("1.5")).toBeNull();
    expect(parseProjectNumber("0")).toBeNull();
  });
});

describe("OctokitActBoardProjectClient", () => {
  function mockOctokit(
    graphql: jest.Mock,
  ): ConstructorParameters<typeof OctokitActBoardProjectClient>[0] {
    return { graphql } as unknown as ConstructorParameters<
      typeof OctokitActBoardProjectClient
    >[0];
  }

  it("paginates project fields, items, and each item's field values", async () => {
    const graphql = jest
      .fn()
      .mockImplementation(
        async (query: string, variables: Record<string, unknown>) => {
          if (query.includes("query ActBoardProject(")) {
            return {
              organization: {
                projectV2: {
                  id: "PROJECT",
                  title: "ACT board",
                  fields: {
                    nodes: [
                      {
                        id: "STATUS",
                        name: "Status",
                        dataType: "SINGLE_SELECT",
                      },
                    ],
                    pageInfo: { hasNextPage: true, endCursor: "FIELDS_2" },
                  },
                },
              },
            };
          }
          if (query.includes("ActBoardProjectFields")) {
            expect(variables.cursor).toBe("FIELDS_2");
            return {
              node: {
                fields: {
                  nodes: [
                    { id: "COUNT", name: "impl count", dataType: "NUMBER" },
                  ],
                  pageInfo: { hasNextPage: false, endCursor: null },
                },
              },
            };
          }
          if (query.includes("ActBoardProjectItems")) {
            return {
              node: {
                items: {
                  nodes:
                    variables.cursor === null
                      ? [
                          {
                            id: "ITEM",
                            content: {
                              id: "ISSUE",
                              number: 1,
                              title: "[674b10] Rule",
                            },
                          },
                        ]
                      : [],
                  pageInfo:
                    variables.cursor === null
                      ? { hasNextPage: true, endCursor: "ITEMS_2" }
                      : { hasNextPage: false, endCursor: null },
                },
              },
            };
          }
          if (query.includes("ActBoardProjectItemFieldValues")) {
            return {
              node: {
                fieldValues: {
                  nodes:
                    variables.cursor === null
                      ? [
                          {
                            number: 1,
                            field: { id: "COUNT", name: "impl count" },
                          },
                        ]
                      : [
                          {
                            text: "https://example.com/pr",
                            field: { id: "PR", name: "review PR URL" },
                          },
                        ],
                  pageInfo:
                    variables.cursor === null
                      ? { hasNextPage: true, endCursor: "VALUES_2" }
                      : { hasNextPage: false, endCursor: null },
                },
              },
            };
          }
          throw new Error(`Unexpected query: ${query}`);
        },
      );
    const client = new OctokitActBoardProjectClient(mockOctokit(graphql));

    const snapshot = await client.getProject("act-rules", 1);

    expect(snapshot.fields.map((field) => field.id)).toEqual([
      "STATUS",
      "COUNT",
    ]);
    expect(snapshot.items[0].fieldValues).toHaveLength(2);
    expect(
      graphql.mock.calls.filter(([query]) =>
        String(query).includes("ActBoardProjectItemFieldValues"),
      ),
    ).toHaveLength(2);
    expect(
      graphql.mock.calls.every(
        ([query]) => !String(query).includes("first: 20"),
      ),
    ).toBe(true);
  });

  it("sends add, update, and clear mutations with their variables", async () => {
    const graphql = jest
      .fn()
      .mockResolvedValueOnce({ addProjectV2ItemById: { item: { id: "ITEM" } } })
      .mockResolvedValue({});
    const client = new OctokitActBoardProjectClient(mockOctokit(graphql));

    await expect(client.addItem("PROJECT", "ISSUE")).resolves.toBe("ITEM");
    await client.updateFieldValue("PROJECT", "ITEM", "FIELD", { number: 3 });
    await client.clearFieldValue("PROJECT", "ITEM", "FIELD");

    expect(graphql.mock.calls[0][0]).toContain("addProjectV2ItemById");
    expect(graphql.mock.calls[0][1]).toEqual({
      projectId: "PROJECT",
      contentId: "ISSUE",
    });
    expect(graphql.mock.calls[1][0]).toContain("updateProjectV2ItemFieldValue");
    expect(graphql.mock.calls[1][1]).toEqual({
      projectId: "PROJECT",
      itemId: "ITEM",
      fieldId: "FIELD",
      value: { number: 3 },
    });
    expect(graphql.mock.calls[2][0]).toContain("clearProjectV2ItemFieldValue");
  });
});
