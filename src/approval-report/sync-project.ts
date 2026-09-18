import { Octokit } from "@octokit/rest";

import {
  BoardIssue,
  DEFAULT_BOARD_REPOSITORY,
  RepositoryRef,
  ruleIdFromActBoardTitle,
} from "./act-board";
import { RuleApprovalRow, RuleStatus } from "./types";

export const DEFAULT_PROJECT_OWNER = "act-rules";

export const DEFAULT_PROJECT_FIELD_NAMES = {
  status: "Status",
  type: "type",
  implCount: "impl count",
  blockerCount: "blocker count",
  openIssueCount: "open issue count",
  ruleCommits: "rule-commits",
  definitionCommits: "definition-commits",
  lastApproved: "last approved",
  lastUpdated: "last updated",
  reviewPrUrl: "review PR URL",
} as const;

export type ProjectFieldNames = typeof DEFAULT_PROJECT_FIELD_NAMES;

export type ProjectField = {
  id: string;
  name: string;
  dataType: string;
  options?: Array<{ id: string; name: string }>;
};

export type ProjectItemFieldValue = {
  fieldId: string;
  fieldName: string;
  optionId?: string | null;
  optionName?: string | null;
  number?: number | null;
  date?: string | null;
  text?: string | null;
};

export type ProjectItem = {
  id: string;
  issueNodeId?: string;
  issueNumber?: number;
  issueTitle?: string;
  fieldValues: ProjectItemFieldValue[];
};

export type ProjectSnapshot = {
  id: string;
  title: string;
  fields: ProjectField[];
  items: ProjectItem[];
};

export type ActBoardProjectClient = {
  getProject(owner: string, projectNumber: number): Promise<ProjectSnapshot>;
  addItem(projectId: string, contentNodeId: string): Promise<string>;
  updateFieldValue(
    projectId: string,
    itemId: string,
    fieldId: string,
    value:
      | { singleSelectOptionId: string }
      | { number: number }
      | { date: string }
      | { text: string },
  ): Promise<void>;
  clearFieldValue(
    projectId: string,
    itemId: string,
    fieldId: string,
  ): Promise<void>;
};

export type SyncActBoardProjectOptions = {
  boardRepository?: RepositoryRef;
  projectOwner?: string;
  projectNumber: number;
  fieldNames?: Partial<ProjectFieldNames>;
  warn?: (message: string) => void;
};

export type SyncActBoardProjectResult = {
  itemsAdded: number;
  fieldsUpdated: number;
  skipped: number;
  optionalFieldsSkipped: number;
};

type ListBoardIssues = (repository: RepositoryRef) => Promise<BoardIssue[]>;

export async function syncActBoardProject(
  rows: RuleApprovalRow[],
  deps: {
    listBoardIssues: ListBoardIssues;
    project: ActBoardProjectClient;
  },
  options: SyncActBoardProjectOptions,
): Promise<SyncActBoardProjectResult> {
  const warn = options.warn ?? console.warn;
  const boardRepository = options.boardRepository ?? DEFAULT_BOARD_REPOSITORY;
  const projectOwner = options.projectOwner ?? DEFAULT_PROJECT_OWNER;
  const fieldNames = {
    ...DEFAULT_PROJECT_FIELD_NAMES,
    ...options.fieldNames,
  };
  const result: SyncActBoardProjectResult = {
    itemsAdded: 0,
    fieldsUpdated: 0,
    skipped: 0,
    optionalFieldsSkipped: 0,
  };

  const project = await deps.project.getProject(
    projectOwner,
    options.projectNumber,
  );
  const statusField = findField(project.fields, fieldNames.status);
  if (!statusField) {
    throw new Error(
      `Project "${project.title}" is missing required field "${fieldNames.status}"`,
    );
  }

  const issues = (await deps.listBoardIssues(boardRepository)).filter(
    (issue) => !issue.isPullRequest,
  );
  const issueByRuleId = new Map<string, BoardIssue>();
  for (const issue of [...issues].sort((a, b) => a.number - b.number)) {
    const ruleId = ruleIdFromActBoardTitle(issue.title);
    if (!ruleId || issueByRuleId.has(ruleId)) continue;
    issueByRuleId.set(ruleId, issue);
  }

  const itemByIssueNodeId = new Map<string, ProjectItem>();
  for (const item of project.items) {
    if (item.issueNodeId) itemByIssueNodeId.set(item.issueNodeId, item);
  }

  for (const row of [...rows].sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId),
  )) {
    const issue = issueByRuleId.get(row.ruleId.toLowerCase());
    if (!issue) {
      warn(`No act-board issue found for [${row.ruleId}]; skip Project sync`);
      continue;
    }

    let item = itemByIssueNodeId.get(issue.nodeId);
    if (!item) {
      const itemId = await deps.project.addItem(project.id, issue.nodeId);
      item = {
        id: itemId,
        issueNodeId: issue.nodeId,
        issueNumber: issue.number,
        issueTitle: issue.title,
        fieldValues: [],
      };
      itemByIssueNodeId.set(issue.nodeId, item);
      result.itemsAdded += 1;
    }

    const updates = desiredFieldUpdates(row, project.fields, fieldNames, warn);
    result.optionalFieldsSkipped += updates.optionalSkipped;

    let changed = false;
    for (const update of updates.values) {
      const current = item.fieldValues.find(
        (value) => value.fieldId === update.field.id,
      );
      if (fieldValueMatches(current, update)) continue;
      changed = true;
      if (update.clear) {
        await deps.project.clearFieldValue(
          project.id,
          item.id,
          update.field.id,
        );
      } else if (update.payload) {
        await deps.project.updateFieldValue(
          project.id,
          item.id,
          update.field.id,
          update.payload,
        );
      }
      result.fieldsUpdated += 1;
    }

    if (!changed) result.skipped += 1;
  }

  return result;
}

type PreparedUpdate = {
  field: ProjectField;
  clear: boolean;
  payload?:
    | { singleSelectOptionId: string }
    | { number: number }
    | { date: string }
    | { text: string };
  optionName?: string;
  number?: number | null;
  date?: string | null;
  text?: string | null;
};

function desiredFieldUpdates(
  row: RuleApprovalRow,
  fields: ProjectField[],
  names: ProjectFieldNames,
  warn: (message: string) => void,
): { values: PreparedUpdate[]; optionalSkipped: number } {
  const values: PreparedUpdate[] = [];
  let optionalSkipped = 0;

  const status = requiredSingleSelect(fields, names.status, row.status);
  values.push(status);

  const optional: Array<() => PreparedUpdate | "skipped"> = [
    () => optionalSingleSelect(fields, names.type, row.ruleTypeSummary, warn),
    () =>
      optionalNumber(fields, names.implCount, row.implementations.length, warn),
    () => optionalNumber(fields, names.blockerCount, row.blockersCount, warn),
    () => optionalNumber(fields, names.openIssueCount, row.issues.length, warn),
    () => optionalNumber(fields, names.ruleCommits, row.ruleCommitCount, warn),
    () =>
      optionalNumber(
        fields,
        names.definitionCommits,
        row.definitionCommitCount,
        warn,
      ),
    () => optionalDate(fields, names.lastApproved, row.approvalIsoDate, warn),
    () => optionalDate(fields, names.lastUpdated, row.lastUpdatedIsoDate, warn),
    () => optionalText(fields, names.reviewPrUrl, row.reviewPrUrl, warn),
  ];

  for (const build of optional) {
    const update = build();
    if (update === "skipped") {
      optionalSkipped += 1;
      continue;
    }
    values.push(update);
  }

  return { values, optionalSkipped };
}

function requiredSingleSelect(
  fields: ProjectField[],
  fieldName: string,
  optionName: string,
): PreparedUpdate {
  const field = findField(fields, fieldName);
  if (!field) {
    throw new Error(`Missing required Project field "${fieldName}"`);
  }
  const option = findOption(field, optionName);
  if (!option) {
    throw new Error(
      `Project field "${fieldName}" has no option "${optionName}"`,
    );
  }
  return {
    field,
    clear: false,
    payload: { singleSelectOptionId: option.id },
    optionName,
  };
}

function optionalSingleSelect(
  fields: ProjectField[],
  fieldName: string,
  optionName: string,
  warn: (message: string) => void,
): PreparedUpdate | "skipped" {
  const field = findField(fields, fieldName);
  if (!field) {
    warn(`Skipping missing optional Project field "${fieldName}"`);
    return "skipped";
  }
  const option = findOption(field, optionName);
  if (!option) {
    warn(
      `Skipping optional Project field "${fieldName}": no option "${optionName}"`,
    );
    return "skipped";
  }
  return {
    field,
    clear: false,
    payload: { singleSelectOptionId: option.id },
    optionName,
  };
}

function optionalNumber(
  fields: ProjectField[],
  fieldName: string,
  number: number,
  warn: (message: string) => void,
): PreparedUpdate | "skipped" {
  const field = findField(fields, fieldName);
  if (!field) {
    warn(`Skipping missing optional Project field "${fieldName}"`);
    return "skipped";
  }
  return {
    field,
    clear: false,
    payload: { number },
    number,
  };
}

function optionalDate(
  fields: ProjectField[],
  fieldName: string,
  date: string | null,
  warn: (message: string) => void,
): PreparedUpdate | "skipped" {
  const field = findField(fields, fieldName);
  if (!field) {
    warn(`Skipping missing optional Project field "${fieldName}"`);
    return "skipped";
  }
  if (!date) {
    return { field, clear: true, date: null };
  }
  return {
    field,
    clear: false,
    payload: { date },
    date,
  };
}

function optionalText(
  fields: ProjectField[],
  fieldName: string,
  text: string | null,
  warn: (message: string) => void,
): PreparedUpdate | "skipped" {
  const field = findField(fields, fieldName);
  if (!field) {
    warn(`Skipping missing optional Project field "${fieldName}"`);
    return "skipped";
  }
  if (!text) {
    return { field, clear: true, text: null };
  }
  return {
    field,
    clear: false,
    payload: { text },
    text,
  };
}

function fieldValueMatches(
  current: ProjectItemFieldValue | undefined,
  update: PreparedUpdate,
): boolean {
  if (update.clear) {
    if (!current) return true;
    return (
      empty(current.optionId) &&
      empty(current.optionName) &&
      (current.number === null || current.number === undefined) &&
      empty(current.date) &&
      empty(current.text)
    );
  }
  if (!current || !update.payload) return false;
  if ("singleSelectOptionId" in update.payload) {
    return (
      current.optionId === update.payload.singleSelectOptionId ||
      (update.optionName != null &&
        current.optionName?.toLowerCase() === update.optionName.toLowerCase())
    );
  }
  if ("number" in update.payload) {
    return Number(current.number) === Number(update.payload.number);
  }
  if ("date" in update.payload) {
    return (current.date ?? "").slice(0, 10) === update.payload.date;
  }
  return (current.text ?? "") === update.payload.text;
}

function findField(
  fields: ProjectField[],
  name: string,
): ProjectField | undefined {
  const needle = name.toLowerCase();
  return fields.find((field) => field.name.toLowerCase() === needle);
}

function findOption(
  field: ProjectField,
  optionName: string,
): { id: string; name: string } | undefined {
  const needle = optionName.toLowerCase();
  return field.options?.find((option) => option.name.toLowerCase() === needle);
}

function empty(value: string | null | undefined): boolean {
  return value == null || value === "";
}

export const RULE_STATUSES: RuleStatus[] = [
  "Deprecated",
  "In review",
  "Blocked by issue",
  "Awaiting implementation",
  "Approved, current",
  "Approved, unpublished changes",
  "Proposed, reviewable",
];

type OrgProjectResponse = {
  organization: {
    projectV2: {
      id: string;
      title: string;
      fields: { nodes: GraphQlFieldNode[] };
    } | null;
  } | null;
};

type GraphQlFieldNode = {
  id?: string;
  name?: string;
  dataType?: string;
  options?: Array<{ id: string; name: string }>;
};

type ProjectItemsResponse = {
  node: {
    items: {
      nodes: Array<{
        id: string;
        content: {
          id?: string;
          number?: number;
          title?: string;
        } | null;
        fieldValues: {
          nodes: Array<{
            field?: { id?: string; name?: string } | null;
            name?: string | null;
            optionId?: string | null;
            number?: number | null;
            date?: string | null;
            text?: string | null;
          }>;
        };
      }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
};

export class OctokitActBoardProjectClient implements ActBoardProjectClient {
  public constructor(private readonly octokit: Octokit) {}

  public async getProject(
    owner: string,
    projectNumber: number,
  ): Promise<ProjectSnapshot> {
    const response: OrgProjectResponse = await this.octokit.graphql(
      `query ActBoardProject($login: String!, $number: Int!) {
        organization(login: $login) {
          projectV2(number: $number) {
            id
            title
            fields(first: 50) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  dataType
                  options { id name }
                }
                ... on ProjectV2IterationField {
                  id
                  name
                  dataType
                }
              }
            }
          }
        }
      }`,
      { login: owner, number: projectNumber },
    );
    const project = response.organization?.projectV2;
    if (!project) {
      throw new Error(
        `GitHub Project #${projectNumber} was not found on ${owner}. Set ACT_BOARD_PROJECT_NUMBER.`,
      );
    }

    const fields: ProjectField[] = project.fields.nodes
      .filter((node): node is GraphQlFieldNode & { id: string; name: string } =>
        Boolean(node?.id && node?.name),
      )
      .map((node) => ({
        id: node.id,
        name: node.name,
        dataType: node.dataType ?? "UNKNOWN",
        options: node.options,
      }));

    const items: ProjectItem[] = [];
    let cursor: string | null = null;
    do {
      const page: ProjectItemsResponse = await this.octokit.graphql(
        `query ActBoardProjectItems($id: ID!, $cursor: String) {
          node(id: $id) {
            ... on ProjectV2 {
              items(first: 100, after: $cursor) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  id
                  content {
                    ... on Issue { id number title }
                  }
                  fieldValues(first: 20) {
                    nodes {
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        name
                        optionId
                        field { ... on ProjectV2SingleSelectField { id name } }
                      }
                      ... on ProjectV2ItemFieldNumberValue {
                        number
                        field { ... on ProjectV2Field { id name } }
                      }
                      ... on ProjectV2ItemFieldDateValue {
                        date
                        field { ... on ProjectV2Field { id name } }
                      }
                      ... on ProjectV2ItemFieldTextValue {
                        text
                        field { ... on ProjectV2Field { id name } }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
        { id: project.id, cursor },
      );
      if (!page.node) break;
      for (const node of page.node.items.nodes) {
        items.push({
          id: node.id,
          issueNodeId: node.content?.id,
          issueNumber: node.content?.number,
          issueTitle: node.content?.title,
          fieldValues: node.fieldValues.nodes.flatMap((value) => {
            const fieldId = value.field?.id;
            const fieldName = value.field?.name;
            if (!fieldId || !fieldName) return [];
            return [
              {
                fieldId,
                fieldName,
                optionId: value.optionId,
                optionName: value.name,
                number: value.number,
                date: value.date,
                text: value.text,
              },
            ];
          }),
        });
      }
      cursor = page.node.items.pageInfo.hasNextPage
        ? page.node.items.pageInfo.endCursor
        : null;
    } while (cursor);

    return { id: project.id, title: project.title, fields, items };
  }

  public async addItem(
    projectId: string,
    contentNodeId: string,
  ): Promise<string> {
    const response: { addProjectV2ItemById: { item: { id: string } } } =
      await this.octokit.graphql(
        `mutation AddActBoardProjectItem($projectId: ID!, $contentId: ID!) {
          addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
            item { id }
          }
        }`,
        { projectId, contentId: contentNodeId },
      );
    return response.addProjectV2ItemById.item.id;
  }

  public async updateFieldValue(
    projectId: string,
    itemId: string,
    fieldId: string,
    value:
      | { singleSelectOptionId: string }
      | { number: number }
      | { date: string }
      | { text: string },
  ): Promise<void> {
    await this.octokit.graphql(
      `mutation UpdateActBoardProjectField(
        $projectId: ID!
        $itemId: ID!
        $fieldId: ID!
        $value: ProjectV2FieldValue!
      ) {
        updateProjectV2ItemFieldValue(
          input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: $value
          }
        ) {
          projectV2Item { id }
        }
      }`,
      { projectId, itemId, fieldId, value },
    );
  }

  public async clearFieldValue(
    projectId: string,
    itemId: string,
    fieldId: string,
  ): Promise<void> {
    await this.octokit.graphql(
      `mutation ClearActBoardProjectField(
        $projectId: ID!
        $itemId: ID!
        $fieldId: ID!
      ) {
        clearProjectV2ItemFieldValue(
          input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId }
        ) {
          projectV2Item { id }
        }
      }`,
      { projectId, itemId, fieldId },
    );
  }
}
