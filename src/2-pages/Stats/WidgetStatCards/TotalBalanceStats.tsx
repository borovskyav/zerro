import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Box, Grid, Typography} from '@mui/material'
import {Period} from '../shared/period'
import {GroupBy} from '6-shared/helpers/date'
import {trModel} from '5-entities/transaction'
import {useAppSelector} from 'store'
import {differenceInMonths} from 'date-fns'
import {useNetWorthUncategorized} from "../shared/netWorth";
import {useAppTheme} from "../../../6-shared/ui/theme";
import {useFormatters, useStatSummary} from "./model";
import {displayCurrency} from "../../../5-entities/currency/displayCurrency";
import {StatCard} from "./StatCard";

const CONSTANTS = {
  DECIMAL_PRECISION: 1,
  DEFAULT_MONTHS: 12,
  THREE_YEARS_MONTHS: 36,
  DATE_FORMAT: 10
}

type OutcomeTooltipProps = {
  totalOutcomeInBudget: number
  totalOutcomeOutOfBudget: number
  period: Period
  formatCurrency: (amount: number) => string
}

export const TotalBalanceStats: React.FC<{period: Period}> = ({ period }) => {
  const { t } = useTranslation('analytics')
  const theme = useAppTheme()
  const stats = useStatSummary(period)
  const [currency] = displayCurrency.useDisplayCurrency()
  const { formatCurrency, formatPercent } = useFormatters(currency)

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={t('income')}
          value={formatCurrency(stats.totalIncome)}
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={t('outcome')}
          value={formatCurrency(stats.totalOutcomeInBalance + stats.totalOutcomeOutOfBalance)}
          color={theme.palette.error.main}
          tooltip={
            <OutcomeCardTooltip
              totalOutcomeInBudget={stats.totalOutcomeInBalance}
              totalOutcomeOutOfBudget={stats.totalOutcomeOutOfBalance}
              period={period}
              formatCurrency={formatCurrency}
            />
          }
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={t(stats.totalSavings < 0 ? 'netOutcome' : 'netIncome')}
          value={formatCurrency(stats.totalSavings)}
          color={stats.totalSavings >= 0 ? theme.palette.success.main : theme.palette.error.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={t('savingsRate')}
          value={formatPercent(stats.savingsRate)}
          suffix="%"
          color={stats.savingsRate >= 0 ? theme.palette.success.main : theme.palette.error.main}
        />
      </Grid>
    </Grid>
  );
}

export const OutcomeCardTooltip: React.FC<OutcomeTooltipProps> = ({
  totalOutcomeInBudget,
  totalOutcomeOutOfBudget,
  period,
  formatCurrency
}) => {
  const monthsToLive = useMonthsToLive(totalOutcomeInBudget + totalOutcomeOutOfBudget, period)
  const { t } = useTranslation('analytics')
  const hasInBalanceOutcome = totalOutcomeInBudget > 0
  const hasOutOfBalanceOutcome = totalOutcomeOutOfBudget > 0
  const showOutcomeSection = hasInBalanceOutcome || hasOutOfBalanceOutcome

  if (monthsToLive <= 0 && !showOutcomeSection)
    return null

  return (
    <Box p={1}>
      {monthsToLive > 0 && (
        <Typography variant="body2">
          {t('monthsToLive', {count: monthsToLive})}
        </Typography>
      )}

      {showOutcomeSection && (
        <>
          {monthsToLive > 0 && <Box mt={1.5} mb={0.5}>
            <Typography variant="body2" fontWeight="bold">
              {t('outcome')}:
            </Typography>
          </Box>}

          {hasInBalanceOutcome && (
            <Typography variant="body2" display="flex"
                        justifyContent="space-between">
              <span>{t('fromFundsInBalance')}:</span>
              <span
                style={{marginLeft: 8}}>{formatCurrency(totalOutcomeInBudget)}</span>
            </Typography>
          )}

          {hasOutOfBalanceOutcome && (
            <Typography variant="body2" display="flex"
                        justifyContent="space-between">
              <span>{t('fromFundsSaving')}:</span>
              <span
                style={{marginLeft: 8}}>{formatCurrency(totalOutcomeOutOfBudget)}</span>
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}

const useMonthsToLive = (totalOutcome: number, period: Period): number => {
  const fundsInBudget = useLastBudgetFromNetWorth()
  const monthsInPeriod = useMonthsInPeriod(period)
  const monthlyOutcome = totalOutcome / monthsInPeriod
  return Math.round(fundsInBudget / monthlyOutcome)
}

const useMonthsInPeriod = (period: Period): number => {
  const historyStart = useAppSelector(trModel.getHistoryStart)

  return useMemo(() => {
    switch (period) {
      case Period.LastYear:
        return CONSTANTS.DEFAULT_MONTHS
      case Period.ThreeYears:
        return CONSTANTS.THREE_YEARS_MONTHS
      case Period.All:
        const startDate = new Date(historyStart)
        const currentDate = new Date()
        const monthsDiff = differenceInMonths(currentDate, startDate) + 1
        return Math.max(1, monthsDiff)
      default:
        return CONSTANTS.DEFAULT_MONTHS
    }
  }, [period, historyStart])
}

const useLastBudgetFromNetWorth = (): number => {
  const netWorthPoints = useNetWorthUncategorized(Period.LastYear, GroupBy.Month)
  const lastMonth = netWorthPoints.length > 0 ? netWorthPoints[netWorthPoints.length - 1] : null

  if (!lastMonth)
    return 0

  return lastMonth.lented + lastMonth.debts + lastMonth.accountDebts + lastMonth.fundsInBudget + lastMonth.fundsSaving
}
