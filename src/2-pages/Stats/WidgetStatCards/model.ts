import { useMemo } from 'react'
import { formatMoney } from '6-shared/helpers/money'

type Formatters = {
  formatCurrency: (amount: number) => string
  formatCurrencyShort: (amount: number) => string
  formatPercent: (value: number) => string
  formatPercentShort: (value: number) => string
}

const percentThreshold = 0.05

export function useFormatters(currency: string): Formatters {
  return useMemo(() => ({
    formatCurrency: (amount: number): string =>
      formatMoney(amount, currency),
    formatCurrencyShort: (amount: number): string =>
      formatMoney(amount, currency, 0),
    formatPercent: (value: number): string =>
      Math.abs(value) < percentThreshold ? '0' : value.toFixed(1),
    formatPercentShort: (value: number): string =>
      Math.abs(value) < percentThreshold ? '0' : value.toFixed(0)
  }), [currency])
}
