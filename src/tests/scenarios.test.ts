import { describe, it, expect } from 'vitest';
import { scenarioSystem } from '../systems/ScenarioSystem';
import { calculateTotalCash } from '../systems/CashSystem';

describe('ScenarioSystem', () => {
  it('loads all predefined scenarios', () => {
    const scenarios = scenarioSystem.getAllScenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(4);
    expect(scenarios.map((s) => s.id)).toContain('standard-morning');
    expect(scenarios.map((s) => s.id)).toContain('change-squeeze');
    expect(scenarios.map((s) => s.id)).toContain('market-frenzy');
    expect(scenarios.map((s) => s.id)).toContain('night-shift');
  });

  it('retrieves specific scenario by id', () => {
    const scenario = scenarioSystem.getScenarioById('change-squeeze');
    expect(scenario.id).toBe('change-squeeze');
    expect(scenario.difficulty).toBe('Challenging');
    expect(calculateTotalCash(scenario.startingCash)).toBeGreaterThan(0);
    expect(scenario.passengers.length).toBe(3);
    expect(scenario.boardingPool.length).toBe(2);
  });

  it('falls back to default when id is not found', () => {
    const fallback = scenarioSystem.getScenarioById('non-existent-scenario');
    expect(fallback.id).toBe('standard-morning');
  });

  it('generates consistent deterministic scenarios for identical seeds', () => {
    const runA = scenarioSystem.generateScenarioFromSeed('lagos-express-42');
    const runB = scenarioSystem.generateScenarioFromSeed('lagos-express-42');

    expect(runA.title).toBe(runB.title);
    expect(runA.startingCash).toEqual(runB.startingCash);
    expect(runA.passengers.length).toBe(runB.passengers.length);
    expect(runA.passengers[0].tenderedNotes).toEqual(runB.passengers[0].tenderedNotes);
  });

  it('generates different setups for different seeds', () => {
    const run1 = scenarioSystem.generateScenarioFromSeed(101);
    const run2 = scenarioSystem.generateScenarioFromSeed(999);

    expect(run1.id).not.toBe(run2.id);
  });
});
