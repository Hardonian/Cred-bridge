import { describe, expect, it } from 'vitest';
import {
  CreditLedger,
  unitEconomics,
  calculateCreditCost,
  contractForecast,
} from './index';

describe('credit-ledger', () => {
  it('manages credit reservation, idempotency, and transitions', () => {
    const ledger = new CreditLedger(5000);
    const r1 = ledger.reserve({
      tenantId: 'gulf-innovation',
      learnerId: 'l1',
      achievementId: 'ent-val',
      milestoneVersion: '1.0',
      available: 10,
    });
    expect(r1.status).toBe('RESERVED');

    // Duplicate returns existing reservation
    const r2 = ledger.reserve({
      tenantId: 'gulf-innovation',
      learnerId: 'l1',
      achievementId: 'ent-val',
      milestoneVersion: '1.0',
      available: 10,
    });
    expect(r2.idempotencyKey).toBe(r1.idempotencyKey);

    const consumed = ledger.consume(r1.idempotencyKey);
    expect(consumed.status).toBe('CONSUMED');
  });

  it('calculates unit economics correctly', () => {
    const res = unitEconomics({
      eligibleCohortSize: 1000,
      participationRate: 0.8,
      paidAttachRate: 0.25,
      licencePrice: 50,
      creditCost: 0.54,
      partnerSimulationCost: 2.0,
      supportCost: 1.0,
    });
    expect(res.realizedLicenceRevenue).toBe(10000);
    expect(res.credentialCreditCost).toBe(432);
    expect(res.netContributionMargin).toBeGreaterThan(0);
    expect(res.breakEvenCohortSize).toBeGreaterThan(0);
  });

  it('calculates tiered credit pricing and multi-month contract forecasting', () => {
    expect(calculateCreditCost(1000)).toBe(600); // 1000 * 0.60
    expect(calculateCreditCost(5000)).toBe(2700); // 5000 * 0.54
    expect(calculateCreditCost(20000)).toBe(9000); // 20000 * 0.45

    const forecast = contractForecast({
      months: 6,
      monthlyCohortGrowthRate: 0.1,
      initialMonthlyLearners: 100,
      licensePricePerLearner: 45,
      creditCostPerLearner: 0.54,
      supportCostPerLearner: 1.5,
    });

    expect(forecast.points).toHaveLength(6);
    expect(forecast.totalLearnersServed).toBeGreaterThan(600);
    expect(forecast.totalRevenue).toBeGreaterThan(27000);
    expect(forecast.blendedMarginPercent).toBeGreaterThan(80);
  });
});
