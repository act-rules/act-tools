import assert from 'assert';
import { ActualOutcome } from 'src/types';
import { getConsistency } from "./get-consistency";
import { getCoverage } from "./get-coverage";
import { ActProcedureMapping, ConsistencyLevel, ProcedureCoverage, TestResult } from "./types";

export function findProcedureSet(
  procedureMappings: ActProcedureMapping[]
) {
  // For each procedure work out consistency & coverage
  // So we can filter on the highest consistency, and sort by coverage
  const procedureScores = procedureMappings.map(getProcedureScore);
  let consistency = procedureScores.reduce(findConsistency, null);
  const procedureSet = procedureScores.filter(score => score.consistency === consistency);
  procedureSet.sort(sortByCoverage);
  
  // Combine the procedures, to grab the combined name, consistency, coverage
  const procedures = procedureSet.map(({ mapping }) => mapping)
  const combinedProcedure = combineProcedureSet(procedures);
  const { procedureName } = combinedProcedure;
  const coverage = getCoverage(combinedProcedure);
  // Work out if the set is complete, even if all procedures are partials
  if (consistency === 'partial') {
    consistency = getConsistency(combinedProcedure);
  }
  return { procedureName, consistency, coverage, procedures }
}

type ProcedureScore = {
  mapping: ActProcedureMapping;
  coverage: ProcedureCoverage;
  consistency: ConsistencyLevel;
}

function getProcedureScore(mapping: ActProcedureMapping): ProcedureScore {
  const consistency = getConsistency(mapping);
  const coverage = getCoverage(mapping);
  return { consistency, coverage, mapping };
}

const consistencyLevels: ConsistencyLevel[] = ['complete', 'partial', 'minimal', null];
function findConsistency(
  consistencyA: ConsistencyLevel,
  { consistency: consistencyB}: ProcedureScore
): ConsistencyLevel {
  if (
    consistencyLevels.indexOf(consistencyA) > 
    consistencyLevels.indexOf(consistencyB)
  ) {
    return consistencyB
  }
  return consistencyA;
}

function sortByCoverage(scoreA: ProcedureScore, scoreB: ProcedureScore): number {
  const automaticScore = scoreB.coverage.automatic - scoreA.coverage.automatic
  if (automaticScore === 0) {
    return scoreB.coverage.covered - scoreA.coverage.covered;
  }
  return automaticScore
}

function combineProcedureSet(
  procedureSet: ActProcedureMapping[]
): ActProcedureMapping {
  assert(procedureSet.length > 0, 'Can not combine procedures if the procedureSet is empty');
  const ruleId = procedureSet[0].ruleId;
  const procedureName = procedureSet.map(({ procedureName }) => procedureName).join('+')
  const consistentRequirements = procedureSet.every(({ consistentRequirements }) => {
    return consistentRequirements === true
  });
  const testResults = procedureSet[0].testResults.map((testResult): TestResult => {
    return combineTestResults(testResult, procedureSet);
  })
  return { procedureName, consistentRequirements, ruleId, testResults }
}

function combineTestResults(
  testResult: TestResult,
  procedureSet: ActProcedureMapping[]
): TestResult {
  const { testcaseId, expected } = testResult
  const outcomes: ActualOutcome[] = [];
  const testcaseResults: TestResult[] = []
  procedureSet.forEach(procedure => {
    procedure.testResults.forEach((result) => {
      if (result.testcaseId === testcaseId) {
        testcaseResults.push(result);
      }
    });
  })
  testcaseResults.forEach(result => outcomes.push(...result.outcomes));
  const automatic = testcaseResults.every(({ automatic }) => automatic);
  return { testcaseId, expected, outcomes, automatic }
}
