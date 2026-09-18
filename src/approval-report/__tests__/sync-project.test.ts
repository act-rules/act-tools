import { BoardIssue } from "../act-board";
import { snapshotsEqual } from "../snapshot";
import {
  ActBoardProjectClient,
  DEFAULT_PROJECT_FIELD_NAMES,
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
      ],
    });

    const result = await syncActBoardProject(
      [current],
      {
        listBoardIssues: jest.fn().mockResolvedValue([boardIssue(current)]),
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
});

describe("snapshotsEqual", () => {
  it("ignores key order when deciding whether snapshot.json changed", () => {
    expect(
      snapshotsEqual(
        '{"ruleId":"674b10","name":"A"}\n',
        '{"name":"A","ruleId":"674b10"}',
      ),
    ).toBe(true);
    expect(snapshotsEqual('{"ruleId":"a"}', '{"ruleId":"b"}')).toBe(false);
  });
});
