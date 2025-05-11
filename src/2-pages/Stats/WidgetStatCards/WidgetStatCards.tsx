import React from 'react'
import { Box, Grid} from '@mui/material'
import { getStart, Period } from '../shared/period'
import { useStatSummary } from "../shared/cashflow";
import { OutcomeCardTooltip } from './OutcomeTooltip'
import { useNetWorthCategorized } from "../shared/netWorth";
import { formatDate, GroupBy, nextDay} from "6-shared/helpers/date";
import { ActivesDistributionScale } from "./ActivesDistributionScale";
import { SafetyMonthsGauge } from "./SafetyMonthsGauge";
import { useTranslation } from "react-i18next";
import { useFormatters } from "./model";
import { StatCard } from "./StatCard";
import { useAppTheme } from "6-shared/ui/theme";
import { DisplayAmount, displayCurrency } from "5-entities/currency/displayCurrency";
import { Tooltip } from "6-shared/ui/Tooltip";

export const WidgetStatCards: React.FC<{period: Period}> = ({ period }) => {
  const { t } = useTranslation('analytics')
  const netWorthData = useNetWorthCategorized(Period.LastYear, GroupBy.Month);
  const stats = useStatSummary(period)
  const [currency] = displayCurrency.useDisplayCurrency()
  const theme = useAppTheme()
  const { formatCurrency, formatPercent } = useFormatters(currency)
  const outcome = stats.totalOutcomeInBalance + stats.totalOutcomeOutOfBalance

  const startDate = getStart(period, GroupBy.Day)
  const incomeLabelTooltip = startDate
    ? t('period_from', { date: formatDate(nextDay(startDate)) })
    : t('period_all')

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} lg={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} lg={4}>
              <StatCard
                title={
                  <Tooltip title={incomeLabelTooltip} arrow placement="right">
                    <span>{t('income')}</span>
                  </Tooltip>
                }
                value={<DisplayAmount value={stats.totalIncome} noShade decMode="ifOnly" />}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={12} sm={4} lg={4}>
              <StatCard
                title={t('outcome')}
                value={<DisplayAmount value={outcome} noShade decMode="ifOnly" />}
                color={theme.palette.error.main}
                tooltip={
                  <OutcomeCardTooltip
                    totalOutcomeInBudget={stats.totalOutcomeInBalance}
                    totalOutcomeOutOfBudget={stats.totalOutcomeOutOfBalance}
                  />
                }
              />
            </Grid>
            <Grid item xs={12} sm={4} lg={4}>
              <StatCard
                title={t('savingsRate')}
                value={formatPercent(stats.savingsRate) + ' %'}
                color={stats.savingsRate >= 0 ? theme.palette.success.main : theme.palette.error.main}
              />
            </Grid>
            <Grid item xs={12}>
              <ActivesDistributionScale netWorthData={netWorthData}/>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12} lg={4}>
          <SafetyMonthsGauge netWorthData={netWorthData} />
        </Grid>
      </Grid>
    </Box>
  )
}
