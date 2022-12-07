import path from "path";
import fs from "fs";
import { AssertorSpec } from "../EarlReport/EarlReport";

export function getAssertor(
  assertor?: AssertorSpec | string
): AssertorSpec | undefined {
  if (typeof assertor === "object") {
    return assertor;
  }

  try {
    const pkgJsonPath = findPackageJson(assertor);
    const packageJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    return assertorFromPackageJson(packageJson);
  } catch {
    /* fall through */
  }

  return undefined;
}

function findPackageJson(fileClue?: string) {
  if (typeof fileClue !== "string") {
    return path.resolve("./package.json");
  }
  if (fs.existsSync(fileClue)) {
    return fileClue;
  }
  const nodeModulePath = path.resolve(
    `./node_modules/${fileClue}/package.json`
  );
  if (fs.existsSync(nodeModulePath)) {
    return nodeModulePath;
  }
  const filePath = require.resolve(fileClue);
  return filePath.split(fileClue)[0] + `/${fileClue}/package.json`;
}

function assertorFromPackageJson(
  packageJson: Record<string, any>
): AssertorSpec {
  const assertorSpec: AssertorSpec = {};
  if (typeof packageJson.name === "string") {
    assertorSpec.name = packageJson.name;
  }
  if (typeof packageJson.version === "string") {
    assertorSpec.versionNumber = packageJson.version;
  }
  if (typeof packageJson.description === "string") {
    assertorSpec.shortDesc = packageJson.description;
  }
  return assertorSpec;
}
