import { useMemo } from 'react'
import { Period } from '../shared/period'
import { useCashFlow } from '../shared/cashflow'
import { formatMoney } from '6-shared/helpers/money'
import { GroupBy } from '6-shared/helpers/date'

export type StatSummary = {
  totalIncome: number
  totalOutcomeInBalance: number
  totalOutcomeOutOfBalance: number
  totalSavings: number
  savingsRate: number
}

type Formatters = {
  formatCurrency: (amount: number) => string
  formatCurrencyShort: (amount: number) => string
  formatPercent: (value: number) => string
  formatPercentShort: (value: number) => string
}

const PERCENT_THRESHOLD = 0.05

export function useFormatters(currency: string): Formatters {
  return useMemo(() => ({
    formatCurrency: (amount: number): string =>
      formatMoney(amount, currency),
    formatCurrencyShort: (amount: number): string =>
      formatMoney(amount, currency, 0),
    formatPercent: (value: number): string =>
      Math.abs(value) < PERCENT_THRESHOLD ? '0' : value.toFixed(1),
    formatPercentShort: (value: number): string =>
      Math.abs(value) < PERCENT_THRESHOLD ? '0' : value.toFixed(0)
  }), [currency])
}

export function useStatSummary(period: Period): StatSummary {
  const points = useCashFlow(period, GroupBy.Day)

  const {totalIncome, totalOutcomeInBalance, totalOutcomeOutOfBalance}
    = points.reduce((acc, point, index) => {
      // Skip the first point because we need to get the total
      // for the exact period, but not period + 1 day
      if (index === 0) return acc
      return {
        totalIncome: acc.totalIncome + point.income,
        totalOutcomeInBalance: acc.totalOutcomeInBalance + Math.abs(point.outcomeInBalance),
        totalOutcomeOutOfBalance: acc.totalOutcomeOutOfBalance + Math.abs(point.outcomeOutOfBalance)
      }
    },
    {totalIncome: 0, totalOutcomeInBalance: 0, totalOutcomeOutOfBalance: 0}
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
}
