import { getCoverage } from '../get-coverage';

describe('getCoverage', () => {
  const procedureDefaults = {
    procedureName: 'abc123',
    ruleId: 'abc123',
    consistentRequirements: true,
  }

  it('returns testCaseTotal', () => {
    expect(getCoverage({
      ...procedureDefaults,
      testResults: [{
        testcaseId: '1',
        expected: 'passed',
        outcomes: ['passed', 'failed', 'inapplicable'],
      }, {
        testcaseId: '2',
        expected: 'passed',
        outcomes: ['passed', 'inapplicable'],
      }]
    })).toHaveProperty('testCaseTotal', 2);
  });

  describe('covered', () => {
    it('returns testCaseTotal, if all are covered', () => {
      expect(getCoverage({
        ...procedureDefaults,
        testResults: [{
          testcaseId: '1',
          expected: 'passed',
          outcomes: ['passed', 'failed', 'inapplicable'],
        }, {
          testcaseId: '2',
          expected: 'passed',
          outcomes: ['passed', 'inapplicable'],
        }]
      })).toHaveProperty('covered', 2);
    })

    it('does not count any cantTell results', () => {
      expect(getCoverage({
        ...procedureDefaults,
        testResults: [{
          testcaseId: '1',
          expected: 'passed',
          outcomes: ['passed', 'cantTell', 'inapplicable'],
        }, {
          testcaseId: '2',
          expected: 'passed',
          outcomes: ['passed', 'inapplicable'],
        }, {
          testcaseId: '3',
          expected: 'passed',
          outcomes: ['passed', 'inapplicable', 'cantTell'],
        }]
      })).toHaveProperty('covered', 1);
    });

    it('does not count untested results', () => {
      expect(getCoverage({
        ...procedureDefaults,
        testResults: [{
          testcaseId: '1',
          expected: 'passed',
          outcomes: ['passed', 'untested', 'inapplicable'],
        }, {
          testcaseId: '2',
          expected: 'passed',
          outcomes: ['passed', 'inapplicable'],
        }, {
          testcaseId: '3',
          expected: 'passed',
          outcomes: ['passed', 'inapplicable', 'cantTell'],
        }]
      })).toHaveProperty('covered', 1);
    });
  });

  describe('automatic', () => {
    it('reports how many have automatic: true', () => {
      expect(getCoverage({
        ...procedureDefaults,
        testResults: [{
          testcaseId: '1',
          expected: 'passed',
          outcomes: ['passed'],
          automatic: true
        }, {
          testcaseId: '2',
          expected: 'passed',
          outcomes: ['passed'],
          automatic: false
        }, {
          testcaseId: '3',
          expected: 'passed',
          outcomes: ['passed'],
          automatic: undefined
        }]
      })).toHaveProperty('automatic', 1);
    });

    it('does not count automatic that have cantTell', () => {
      expect(getCoverage({
        ...procedureDefaults,
        testResults: [{
          testcaseId: '1',
          expected: 'passed',
          outcomes: ['passed'],
          automatic: true
        }, {
          testcaseId: '2',
          expected: 'passed',
          outcomes: ['passed'],
          automatic: true
        }, {
          testcaseId: '3',
          expected: 'passed',
          outcomes: ['cantTell'],
          automatic: true
        }]
      })).toHaveProperty('automatic', 2);
    });

    it('does not count automatic that have untested', () => {
      expect(getCoverage({
        ...procedureDefaults,
        testResults: [{
          testcaseId: '1',
          expected: 'passed',
          outcomes: ['passed'],
          automatic: true
        }, {
          testcaseId: '2',
          expected: 'passed',
          outcomes: ['cantTell'],
          automatic: true
        }, {
          testcaseId: '3',
          expected: 'passed',
          outcomes: ['untested'],
          automatic: true
        }]
      })).toHaveProperty('automatic', 1);
    });

    it('does not count automatic that have no outcome', () => {
      expect(getCoverage({
        ...procedureDefaults,
        testResults: [{
          testcaseId: '1',
          expected: 'passed',
          outcomes: ['passed'],
          automatic: true
        }, {
          testcaseId: '2',
          expected: 'passed',
          outcomes: ['untested'],
          automatic: true
        }, {
          testcaseId: '3',
          expected: 'passed',
          outcomes: [],
          automatic: true
        }]
      })).toHaveProperty('automatic', 1);
    });
  });
});
