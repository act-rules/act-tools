# ACT Tools

This repository contains a collection of tools for the Accessibility Conformance Testing Task Force. This project is chiefly written using TypeScript, and relies on [ts-node](https://www.npmjs.com/package/ts-node?activeTab=readme) to run.

To use this project, you will need the following. Any version released in the last 12 months should do.

- [git](https://git-scm.com/)
- [NodeJS](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)

## Installation

To install this project from the command line run the following commands:

```sh
git clone git@github.com/act-rules/act-tools.git
cd act-tools
yarn
```

## ActTestRunner class

The ActTestRunner class helps accessibility tools to run ACT test cases, and turn the outcome into a valid EARL report. The following example shows how to run the test cases using Playwright.

```js
import { chromium } from 'playwright';
import { ActTestRunner } from 'act-tools';
import myA11yTool from './myA11yTool';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // Create a new instance of the tool runner
  const actRunner = new ActTestRunner({
    fileTypes: ['html'] // Only test HTML files
    implementor: { // Set metadata about the tool
      name: 'My Accessibility Tool',
      versionNumber: '1.0.0'
    }
  });

  // Run the tool against each HTML test case:
  const actReport = await actRunner.run(async (testCase) => {
    await page.goto(testCase.url); // Playwright load the page
    const issues = await myA11yTool.a11yTest(page); // Run myA11yTool

    // Convert myA11yTool's output to one the reporter understands
    return issues.map(issue => ({
      outcome: 'failed',
      ruleId: issue.id,
      wcag2: issue.wcagCriteria
    }))
  });

  // Save the EARL report to disk
  const earlText = JSON.stringify(actReport.getEarlReport(), null, 2);
  writeFileSync('./earl-report.json', earlText, 'utf8');

  // Console log a summary of the implementation
  const { approvedRules, proposedRules } = report.getImplementationMapping();
  console.table({ approvedRules, proposedRules });
})();
```

### ActTestRunner#constructor

The ActTestRunner constructor takes a single object as an argument, with the following options:

- `implementor`: Object with the following optional properties:
    - `name`: Name of the accessibility test tool
    - `shortDesc`: Short description or title for the tool
    - `versionNumber`: Version used in testing
    - `vendorName`: Author of the tool
- `rules`: Optional array of strings that limit which rules run
- `fileTypes`: Optional array of strings that limit which file extensions are tested
- `log`: Boolean, set to `false` to disable console logging
- `gitVersion`: Branch name or commit from which to pull the `testcases.json` file. Defaults to `publication`, which is the latest version published on the WAI website.
- `testCaseJsonUrl`: URL from which to load the testcases.json file. Setting this overrides `gitVersion`

### run(testRunner)

The function passed into `actTestRunner.run()` is called the testRunner. The test runner is passed a single testCase object with the following properties and method:

- `fetchSource()`; Async method that returns the source code of the test case as a string
- `ruleId`: 6-character ID given to the ACT rule
- `ruleName`: Title given to the ACT rule
- `testcaseId`: 48 character hash of the test case code
- `testcaseTitle`: Name of the test case such as "Passed example 1"
- `url`: Absolute path to the test case
- `relativePath`: Unique path for the test case
- `expected`: `passed`, `failed`, or `inapplicable`
- `rulePage`: URL to the ACT rule page;
- `ruleAccessibilityRequirements`: null, or Record of accessibility requirements

The testRunner must return an array of objects with the following properties:

- `procedureId` (required): Unique identifier or name for the procedure / check / rule the tool tested.
- `outcome` (required): `passed`, `failed`, `inapplicable`, or `cantTell`.
- `wcag2`: Array of WCAG 2 success criteria numbers that fail if the procedure fails
- `requirements`: Array of other accessibility requirements that fail if the procedure fails, such as ARIA Practices and WCAG Techniques

Tools can return more than one result for a procedure. For example if the test case as two links without a name, the tool may return two `failed` outcomes. Many accessibility tools report warning in addition to violations. Warnings should be reported as `cantTell`. 

## CLI Usage

### Rule Transformer

This tool takes rule markdown files and transforms it to a markdown file that the WAI website can consume using Jekyll. To run it, use a command like the following:

```sh
yarn transform-rule \
  --rulesDir "../act-rules.github.io/_rules/" \
  --glossaryDir "../act-rules.github.io/pages/glossary/" \
  --outDir "../wcag-act-rules/" \
  --matrix \
  --ruleIds 5f99a7,6cfa84
```

### Build Examples

This tool takes rule markdown files, extracts the examples from it, saves those into a directory, and creates a new testcases.json file.

```sh
yarn build-examples \
  --rulesDir "../act-rules.github.io/_rules/" \
  --outDir "../wcag-act-rules/" \
  --testCaseJson "../wcag-act-rules/content-assets/wcag-act-rules/testcases.json" \
  --ruleIds 5f99a7,6cfa84
```

### Map an implementation

The `map-implementation` tool takes the test results from an implementation and works out how that implementation maps to ACT.

```sh
yarn map-implementation \
  --name "Acme Test Tool" \
  --vendor "Acme Corp" \
  --jsonReport "./acme-earl-report.json" \
  --output "../implementations/{organization}-{tool}.json" \
  --testCaseJson "../wcag-act-rules/content/testcases.json"
```

This script outputs a file `implementations/acme-test-tool-mapping.json`, which looks something like this:

```json
{
  "vendor": "Acme Corp",
  "name": "Acme Test Tool",
  "summary": {
    "consistent": 20,
    "partiallyConsistent": 1,
    "inconsistent": 69,
    "incomplete": 68
  },
  "actMapping": [{
    "ruleId": "b5c3f8",
    "ruleName": "HTML page has `lang` attribute",
    "complete": false,
    "consistency": "consistent",
    "implementations": [{ ...details }]
  }]
}
```

### Implementation Batch Update

The `implementations-update` tool generates implementation tables for rule pages. It uses an `implementations.yml` file which describes all implementations that need to be included.

```sh
yarn implementations-update \
  --implementations "../wcag-act-rules/implementations.yml" \
  --testCaseJson "https://act-rules.github.io/testcases.json" \
  --outDir "../wcag-act-rules/implementations/"
  --tableFilePattern "../wcag-act-rules/content/implementations/{ruleId}.md"
```

## Development

The following commands are available for use in development:

- `yarn build`: Compile the TypeScript, and will tell you if there are any type errors
- `yarn test`: Executes all the tests in `__tests__` directories using [Jest](https://jestjs.io/)
- `yarn develop`: Run tests, and watch for changes
- `yarn lint`: Check code for lint errors using [ESLint](https://eslint.org/)
- `yarn format`: Format the code using [Prettier](https://prettier.io/)

