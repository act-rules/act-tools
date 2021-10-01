import debug from "debug";
import { EarlAssertion } from "./earl/types";
import { implementationIdFromTest } from "./utils/get-implementation-id";
import { getImplementation } from "./get-implementation";
import { isConsistentImplementationSet } from "./utils/is-consistent-implementation-set";
import { sortImplementations } from "./utils/sort-implementations";
import {
  Implementation,
  Consistency,
  TestCase,
  AssertionGroup,
  PartialImplementationSet,
} from "./types";

export function getImplementationSet(
  assertions: EarlAssertion[],
  testcases: TestCase[]
): PartialImplementationSet {
  // Group asserts by implementation ID
  const assertsByImplementationId = assertions.reduce(
    (assertsByRule: AssertionGroup, assertion) => {
      // Normalise around a bug in WCAG-EM
      const test = assertion.test || assertion["wcagem-test"];
      if (!test) {
        debug("getImplementationSet")(
          `Skipped! Could not find 'test' in assertion ${JSON.stringify(
            assertion
          )}`
        );
        return assertsByRule;
      }
      const implementationId = implementationIdFromTest(test);
      if (!assertsByRule[implementationId]) {
        assertsByRule[implementationId] = [];
      }
      assertsByRule[implementationId].push(assertion);
      return assertsByRule;
    },
    {}
  );
  // Get all implementnations, sorted and with their ID added in
  const allImplementations: Implementation[] = Object.entries(
    assertsByImplementationId
  )
    .map(([implementationId, asssertions]) => ({
      implementationId,
      ...getImplementation(testcases, asssertions),
    }))
    .sort(sortImplementations);

  // Figure out what implementations make for what consistency
  const { implementations, consistency } = findConsistency(allImplementations);
  const complete = implementations.every(({ complete }) => complete);

  return { complete, consistency, implementations };
}

function findConsistency(implementations: Implementation[]): {
  consistency: Consistency;
  implementations: Implementation[];
} {
  const consistentImpl = implementations.filter(
    ({ consistency }) => consistency === "consistent"
  );
  if (consistentImpl.length > 0) {
    return {
      consistency: "consistent",
      implementations: consistentImpl,
    };
  }
  const partialImpl = implementations.filter(
    ({ consistency }) => consistency === "partially-consistent"
  );
  if (partialImpl.length > 0) {
    const consistency = isConsistentImplementationSet(partialImpl)
      ? "consistent"
      : "partially-consistent";
    return {
      consistency,
      implementations: partialImpl,
    };
  }
  return {
    consistency: "inconsistent",
    implementations,
  };
}
