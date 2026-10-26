import { NextResponse } from 'next/server';
import { contractForecast, type ContractForecastInput } from '@credbridge/credit-ledger';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<ContractForecastInput>;

    const input: ContractForecastInput = {
      months: typeof body.months === 'number' ? body.months : 12,
      monthlyCohortGrowthRate:
        typeof body.monthlyCohortGrowthRate === 'number'
          ? body.monthlyCohortGrowthRate
          : 0.05,
      initialMonthlyLearners:
        typeof body.initialMonthlyLearners === 'number'
          ? body.initialMonthlyLearners
          : 250,
      licensePricePerLearner:
        typeof body.licensePricePerLearner === 'number'
          ? body.licensePricePerLearner
          : 50,
      creditCostPerLearner:
        typeof body.creditCostPerLearner === 'number'
          ? body.creditCostPerLearner
          : 0.54,
      supportCostPerLearner:
        typeof body.supportCostPerLearner === 'number'
          ? body.supportCostPerLearner
          : 2.0,
    };

    const forecast = contractForecast(input);
    return NextResponse.json({
      success: true,
      input,
      forecast,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Forecast calculation failed' },
      { status: 400 }
    );
  }
}
