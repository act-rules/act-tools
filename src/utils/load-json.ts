import axios from "axios";
import debug from "debug";
import fs from "node:fs";

// eslint-disable @typescript-eslint/ban-types
export async function loadJson<T = Object>(filePath: string): Promise<T> {
  if (/^https?:\/\//.test(filePath)) {
    debug("load:request")(`fetching ${filePath}`);

    const response = await axios.get(filePath, {
      headers: { "Accept-Encoding": "application/json" },
      responseType: "json",
    });

    return response.data;
  } else {
    debug("load:readFile")(`Loading ${filePath}`);
    const str = fs.readFileSync(filePath, "utf8");
    return JSON.parse(str);
  }
}
