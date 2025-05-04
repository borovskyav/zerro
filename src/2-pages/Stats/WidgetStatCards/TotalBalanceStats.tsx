import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Grid, Typography } from '@mui/material'
import { Period, getStart } from '../shared/period'
import { GroupBy, formatDate, nextDay } from '6-shared/helpers/date'
import { trModel } from '5-entities/transaction'
import { useAppSelector } from 'store'
import { differenceInMonths } from 'date-fns'
import { useNetWorthUncategorized } from "../shared/netWorth";
import { useAppTheme } from "6-shared/ui/theme";
import {StatSummary, useFormatters, useStatSummary} from "./model";
import { displayCurrency } from "5-entities/currency/displayCurrency";
import { StatCard } from "./StatCard";
import { Tooltip } from "6-shared/ui/Tooltip";

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

export const TotalBalanceStats: React.FC<{period: Period, stats: StatSummary}> = ({ period, stats }) => {
  const { t } = useTranslation('analytics')
  const theme = useAppTheme()
  const [currency] = displayCurrency.useDisplayCurrency()
  const { formatCurrency, formatPercent } = useFormatters(currency)

  const startDate = getStart(period, GroupBy.Day)
  const incomeLabelTooltip = startDate
    ? t('period_from', { date: formatDate(nextDay(startDate)) })
    : t('period_all')

  return (
    <>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title={
            <Tooltip title={incomeLabelTooltip} arrow placement="right">
              <span>{t('income')}</span>
            </Tooltip>
          }
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
          value={formatPercent(stats.savingsRate)+'%'}
          color={stats.savingsRate >= 0 ? theme.palette.success.main : theme.palette.error.main}
        />
      </Grid>
    </>
  );
}

export const OutcomeCardTooltip: React.FC<OutcomeTooltipProps> = ({
  totalOutcomeInBudget,
  totalOutcomeOutOfBudget,
  period,
  formatCurrency
}) => {
  const {monthsToLive, avgOutcome} = calculateMonthsToLiveAndAgvOutcome(totalOutcomeInBudget + totalOutcomeOutOfBudget, period)
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
          {t('monthsToLive', {count: monthsToLive, avgOutcome: formatCurrency(avgOutcome)})}
        </Typography>
      )}

      {showOutcomeSection && (
        <Box mt={1.5} mb={0.5}>
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
        </Box>
      )}
    </Box>
  )
}

function calculateMonthsToLiveAndAgvOutcome(
  totalOutcome: number,
  period: Period): { monthsToLive: number; avgOutcome: number } {
  // with period = LastYear it return 13 points max, so we need to get only 12,
  // but if it returns only 11 or less we need to divide by 11
  const netWorthPoints = useNetWorthUncategorized(period, GroupBy.Month)
  const lastMonth = netWorthPoints.length > 0 ? netWorthPoints[netWorthPoints.length - 1] : null

  if (!lastMonth)
    return { monthsToLive: 0,  avgOutcome: 0 }

  const currentBalance = lastMonth.lented +
    lastMonth.debts +
    lastMonth.accountDebts +
    lastMonth.fundsInBudget +
    lastMonth.fundsSaving

  const monthsInPeriod = useMonthsInPeriod(period)
  const months = monthsInPeriod >= netWorthPoints.length ? netWorthPoints.length : monthsInPeriod
  const avgOutcome = totalOutcome / months
  return {
    monthsToLive: Math.round(currentBalance / avgOutcome),
    avgOutcome: avgOutcome
  }
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
