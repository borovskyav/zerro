import { useMemo } from 'react'
import { Period } from '../shared/period'
import { useCashFlow } from '../shared/cashflow'
import {formatMoney} from "../../../6-shared/helpers/money";

export type StatSummary = {
  totalIncome: number
  totalOutcomeInBalance: number
  totalOutcomeOutOfBalance: number
  totalSavings: number
  savingsRate: number
}

type Formatters = {
  formatCurrency: (amount: number) => string
  formatPercent: (value: number) => string
}

const PERCENT_THRESHOLD = 0.05

export function useFormatters(currency: string): Formatters {
  return useMemo(() => ({
    formatCurrency: (amount: number): string => formatMoney(amount, currency),
    formatPercent: (value: number): string =>
      Math.abs(value) < PERCENT_THRESHOLD ? '0.0' : value.toFixed(1)
  }), [currency])
}

export function useStatSummary(period: Period): StatSummary {
  const points = useCashFlow(period)

  return useMemo(() => {
    const totalIncome = points.reduce(
      (sum, point) => sum + point.income, 0
    )

    const totalOutcomeInBalance = points.reduce(
      (sum, point) => sum + Math.abs(point.outcomeInBalance), 0
    )

    const totalOutcomeOutOfBalance = points.reduce(
      (sum, point) => sum + Math.abs(point.outcomeOutOfBalance), 0
    )

    const totalSavings = totalIncome - totalOutcomeInBalance - totalOutcomeOutOfBalance
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

    return {
      totalIncome,
      totalOutcomeInBalance,
      totalOutcomeOutOfBalance,
      totalSavings,
      savingsRate
    }
  }, [points])
}
