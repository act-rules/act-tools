import request from "request-promise";
import debug from "debug";
import { promisify } from "util";
import fs from "fs";

const readFile = promisify(fs.readFile);

// eslint-disable @typescript-eslint/ban-types
export async function loadJson<T = Object>(filePath: string): Promise<T> {
  if (/^https?:\/\//.test(filePath)) {
    debug("load:request")(`fetching ${filePath}`);
    return await request({ uri: filePath, json: true });
  } else {
    debug("load:readFile")(`Loading ${filePath}`);
    const str = await readFile(filePath, "utf8");
    return JSON.parse(str);
  }
}
