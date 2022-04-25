import { Contributor } from "../types";
import { contributors as contributorsJson } from "./contributors.json";
import successCriteria from "./sc-urls.json";

export type Criterion = {
  num: string;
  handle: string;
  level: string;
  scId: string;
};

export const contributors: Contributor[] = contributorsJson;
export const criteria: Record<string, Criterion | undefined> = successCriteria;
