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

## Usage

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

