import { Octokit } from "@octokit/rest";

import {
  BoardIssue,
  DEFAULT_BOARD_REPOSITORY,
  RepositoryRef,
  selectManagedIssues,
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
  rowsWithoutIssue: number;
  failures: Array<{ ruleId: string; message: string }>;
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
    rowsWithoutIssue: 0,
    failures: [],
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
  if (statusField.dataType !== "SINGLE_SELECT") {
    throw new Error(
      `Required Project field "${fieldNames.status}" must have data type SINGLE_SELECT, got ${statusField.dataType}`,
    );
  }
  const fieldPlan = resolveFieldPlan(project.fields, fieldNames, warn);
  result.optionalFieldsSkipped = fieldPlan.optionalFieldsSkipped;

  const issues = (await deps.listBoardIssues(boardRepository)).filter(
    (issue) => !issue.isPullRequest,
  );
  const { managedIssues: issueByRuleId } = selectManagedIssues(issues);

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
      result.rowsWithoutIssue += 1;
      continue;
    }

    try {
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

      const updates = desiredFieldUpdates(row, fieldPlan, warn);
      let changed = false;
      for (const update of updates) {
        const current = item.fieldValues.find(
          (value) => value.fieldId === update.field.id,
        );
        if (fieldValueMatches(current, update)) continue;
        if (update.clear) {
          await deps.project.clearFieldValue(
            project.id,
            item.id,
            update.field.id,
          );
          changed = true;
          result.fieldsUpdated += 1;
        } else if (update.payload) {
          await deps.project.updateFieldValue(
            project.id,
            item.id,
            update.field.id,
            update.payload,
          );
          changed = true;
          result.fieldsUpdated += 1;
        }
      }

      if (!changed) result.skipped += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warn(`Failed Project sync for [${row.ruleId}]: ${message}`);
      result.failures.push({ ruleId: row.ruleId, message });
    }
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

type FieldPlan = {
  status: ProjectField;
  type?: ProjectField;
  implCount?: ProjectField;
  blockerCount?: ProjectField;
  openIssueCount?: ProjectField;
  ruleCommits?: ProjectField;
  definitionCommits?: ProjectField;
  lastApproved?: ProjectField;
  lastUpdated?: ProjectField;
  reviewPrUrl?: ProjectField;
  optionalFieldsSkipped: number;
};

const OPTIONAL_FIELD_TYPES: Array<{
  key: Exclude<keyof FieldPlan, "status" | "optionalFieldsSkipped">;
  nameKey: Exclude<keyof ProjectFieldNames, "status">;
  dataType: string;
}> = [
  { key: "type", nameKey: "type", dataType: "SINGLE_SELECT" },
  { key: "implCount", nameKey: "implCount", dataType: "NUMBER" },
  { key: "blockerCount", nameKey: "blockerCount", dataType: "NUMBER" },
  { key: "openIssueCount", nameKey: "openIssueCount", dataType: "NUMBER" },
  { key: "ruleCommits", nameKey: "ruleCommits", dataType: "NUMBER" },
  {
    key: "definitionCommits",
    nameKey: "definitionCommits",
    dataType: "NUMBER",
  },
  { key: "lastApproved", nameKey: "lastApproved", dataType: "DATE" },
  { key: "lastUpdated", nameKey: "lastUpdated", dataType: "DATE" },
  { key: "reviewPrUrl", nameKey: "reviewPrUrl", dataType: "TEXT" },
];

function resolveFieldPlan(
  fields: ProjectField[],
  names: ProjectFieldNames,
  warn: (message: string) => void,
): FieldPlan {
  const status = findField(fields, names.status);
  if (!status) {
    throw new Error(`Missing required Project field "${names.status}"`);
  }
  const plan: FieldPlan = { status, optionalFieldsSkipped: 0 };
  for (const descriptor of OPTIONAL_FIELD_TYPES) {
    const name = names[descriptor.nameKey];
    const field = findField(fields, name);
    if (!field) {
      warn(`Skipping missing optional Project field "${name}"`);
      plan.optionalFieldsSkipped += 1;
      continue;
    }
    if (field.dataType !== descriptor.dataType) {
      warn(
        `Skipping optional Project field "${name}": expected data type ${descriptor.dataType}, got ${field.dataType}`,
      );
      plan.optionalFieldsSkipped += 1;
      continue;
    }
    plan[descriptor.key] = field;
  }
  return plan;
}

function desiredFieldUpdates(
  row: RuleApprovalRow,
  plan: FieldPlan,
  warn: (message: string) => void,
): PreparedUpdate[] {
  const values: PreparedUpdate[] = [];
  values.push(requiredSingleSelect(plan.status, row.status));
  pushIfDefined(
    values,
    optionalSingleSelect(plan.type, row.ruleTypeSummary, warn),
  );
  pushIfDefined(
    values,
    optionalNumber(plan.implCount, row.implementations.length),
  );
  pushIfDefined(values, optionalNumber(plan.blockerCount, row.blockersCount));
  pushIfDefined(values, optionalNumber(plan.openIssueCount, row.issues.length));
  pushIfDefined(values, optionalNumber(plan.ruleCommits, row.ruleCommitCount));
  pushIfDefined(
    values,
    optionalNumber(plan.definitionCommits, row.definitionCommitCount),
  );
  pushIfDefined(values, optionalDate(plan.lastApproved, row.approvalIsoDate));
  pushIfDefined(values, optionalDate(plan.lastUpdated, row.lastUpdatedIsoDate));
  pushIfDefined(values, optionalText(plan.reviewPrUrl, row.reviewPrUrl));
  return values;
}

function requiredSingleSelect(
  field: ProjectField,
  optionName: string,
): PreparedUpdate {
  const option = findOption(field, optionName);
  if (!option) {
    throw new Error(
      `Project field "${field.name}" has no option "${optionName}"`,
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
  field: ProjectField | undefined,
  optionName: string,
  warn: (message: string) => void,
): PreparedUpdate | undefined {
  if (!field) return undefined;
  const option = findOption(field, optionName);
  if (!option) {
    warn(
      `Skipping optional Project field "${field.name}": no option "${optionName}"`,
    );
    return undefined;
  }
  return {
    field,
    clear: false,
    payload: { singleSelectOptionId: option.id },
    optionName,
  };
}

function optionalNumber(
  field: ProjectField | undefined,
  number: number,
): PreparedUpdate | undefined {
  if (!field) return undefined;
  return {
    field,
    clear: false,
    payload: { number },
    number,
  };
}

function optionalDate(
  field: ProjectField | undefined,
  date: string | null,
): PreparedUpdate | undefined {
  if (!field) return undefined;
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
  field: ProjectField | undefined,
  text: string | null,
): PreparedUpdate | undefined {
  if (!field) return undefined;
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

function pushIfDefined(
  updates: PreparedUpdate[],
  update: PreparedUpdate | undefined,
): void {
  if (update) updates.push(update);
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
    return normalizeDate(current.date) === normalizeDate(update.payload.date);
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

function normalizeDate(value: string | null | undefined): string {
  return (value ?? "").slice(0, 10);
}

const RULE_STATUS_RECORD = {
  Deprecated: true,
  "In review": true,
  "Blocked by issue": true,
  "Awaiting implementation": true,
  "Approved, current": true,
  "Approved, unpublished changes": true,
  "Proposed, reviewable": true,
} satisfies Record<RuleStatus, true>;

export const RULE_STATUSES = Object.keys(RULE_STATUS_RECORD) as RuleStatus[];

export function parseProjectNumber(value: unknown): number | null {
  const text = String(value ?? "");
  if (!/^[1-9]\d*$/.test(text)) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) ? number : null;
}

type OrgProjectResponse = {
  organization: {
    projectV2: {
      id: string;
      title: string;
      fields: GraphQlFieldsConnection;
    } | null;
  } | null;
};

type GraphQlFieldNode = {
  id?: string;
  name?: string;
  dataType?: string;
  options?: Array<{ id: string; name: string }>;
};

type GraphQlFieldsConnection = {
  nodes: GraphQlFieldNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

type ProjectFieldsResponse = {
  node: {
    fields: GraphQlFieldsConnection;
  } | null;
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
      }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
};

type GraphQlFieldValueNode = {
  field?: { id?: string; name?: string } | null;
  name?: string | null;
  optionId?: string | null;
  number?: number | null;
  date?: string | null;
  text?: string | null;
};

type ProjectItemFieldValuesResponse = {
  node: {
    fieldValues: {
      nodes: GraphQlFieldValueNode[];
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
            fields(first: 100) {
              pageInfo { hasNextPage endCursor }
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
        `GitHub Project #${projectNumber} was not found on organization ${owner}. Check ACT_BOARD_PROJECT_NUMBER and ensure the token can access the Project.`,
      );
    }

    const fieldNodes = [...project.fields.nodes];
    let fieldsCursor = project.fields.pageInfo.hasNextPage
      ? project.fields.pageInfo.endCursor
      : null;
    while (fieldsCursor) {
      const page: ProjectFieldsResponse = await this.octokit.graphql(
        `query ActBoardProjectFields($id: ID!, $cursor: String) {
          node(id: $id) {
            ... on ProjectV2 {
              fields(first: 100, after: $cursor) {
                pageInfo { hasNextPage endCursor }
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
        { id: project.id, cursor: fieldsCursor },
      );
      if (!page.node) break;
      fieldNodes.push(...page.node.fields.nodes);
      fieldsCursor = page.node.fields.pageInfo.hasNextPage
        ? page.node.fields.pageInfo.endCursor
        : null;
    }

    const fields: ProjectField[] = fieldNodes
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
          fieldValues: await this.getItemFieldValues(node.id),
        });
      }
      cursor = page.node.items.pageInfo.hasNextPage
        ? page.node.items.pageInfo.endCursor
        : null;
    } while (cursor);

    return { id: project.id, title: project.title, fields, items };
  }

  private async getItemFieldValues(
    itemId: string,
  ): Promise<ProjectItemFieldValue[]> {
    const values: ProjectItemFieldValue[] = [];
    let cursor: string | null = null;
    do {
      const page: ProjectItemFieldValuesResponse = await this.octokit.graphql(
        `query ActBoardProjectItemFieldValues($id: ID!, $cursor: String) {
          node(id: $id) {
            ... on ProjectV2Item {
              fieldValues(first: 100, after: $cursor) {
                pageInfo { hasNextPage endCursor }
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
        }`,
        { id: itemId, cursor },
      );
      if (!page.node) break;
      for (const value of page.node.fieldValues.nodes) {
        const fieldId = value.field?.id;
        const fieldName = value.field?.name;
        if (!fieldId || !fieldName) continue;
        values.push({
          fieldId,
          fieldName,
          optionId: value.optionId,
          optionName: value.name,
          number: value.number,
          date: value.date,
          text: value.text,
        });
      }
      cursor = page.node.fieldValues.pageInfo.hasNextPage
        ? page.node.fieldValues.pageInfo.endCursor
        : null;
    } while (cursor);
    return values;
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
