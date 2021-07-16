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

This tool takes a rule markdown file, and transforms it to a markdown file that the WAI website can consume using Jekyll. To run it, use a command like the following:

```sh
yarn transform-rule \
  --rulesDir "../act-rules.github.io/_rules/" \
  --glossaryDir "../act-rules.github.io/pages/glossary/" \
  --outDir "../wcag-act-rules/" \
  --ruleIds 5f99a7,6cfa84
```

## Development

The following commands are available for use in development:

- `yarn build`: Compile the TypeScript, and will tell you if there are any type errors
- `yarn test`: Executes all the tests in `__tests__` directories using [Jest](https://jestjs.io/)
- `yarn develop`: Run tests, and watch for changes
- `yarn lint`: Check code for lint errors using [ESLint](https://eslint.org/)
- `yarn format`: Format the code using [Prettier](https://prettier.io/)

