import React, { useState } from 'react'
import { Box, Paper, styled, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import BoltIcon from '@mui/icons-material/Bolt'
import { useTranslation } from 'react-i18next'
import { Period } from '../shared/period'
import { TNetWorthCategorizedPoint } from '../shared/netWorth'
import { formatMoney } from '6-shared/helpers/money'
import { displayCurrency } from '5-entities/currency/displayCurrency'
import { useStatSummary } from "./model";
import {
  ColoredGaugeReferenceArc,
  GaugeContainer,
  GaugeReferenceArc,
  GaugeValueArc,
  SafetyRanges
} from "./CustomGauge";
import { useAppTheme, useColorScheme } from "6-shared/ui/theme";
import { Tooltip } from '6-shared/ui/Tooltip';

type SafetyMonthsGaugeProps = {
  netWorthData: TNetWorthCategorizedPoint[]
}

const notConfigured = {color: '#9E9E9E', infoText: 'safetyMonths.notConfigured'}

export const SafetyMonthsGauge: React.FC<SafetyMonthsGaugeProps> = ({netWorthData}) => {
  const { t } = useTranslation('analytics')
  const [currency] = displayCurrency.useDisplayCurrency()
  const [stressTest, setStressTest] = useState(false)
  const stats = useStatSummary(Period.LastYear)
  const {mode} = useColorScheme()
  const theme = useAppTheme()

  const latestData = netWorthData[netWorthData.length - 1]

  if (!latestData) return null

  const {fundsSaving} = latestData
  const totalOutcome = stats.totalOutcomeInBalance + stats.totalOutcomeOutOfBalance

  if (!totalOutcome) return null

  // Calculate average monthly expense based on the period data
  // We use (length - 1) because we need the number of months, not the number of data points
  const avgMonthlyExpense = totalOutcome / (netWorthData.length - 1 || 1)
  const adjustedMonthlyExpense = stressTest ? avgMonthlyExpense * 1.2 : avgMonthlyExpense
  const monthsSafety = fundsSaving / adjustedMonthlyExpense
  const isEmptySafety = fundsSaving === 0

  const safetyRange: { color: string, infoText: string } = isEmptySafety
    ? notConfigured
    : SafetyRanges.find(({min, max}) => monthsSafety >= min && monthsSafety < max)
    || notConfigured

  const displayValue = monthsSafety >= 12 ? 12 : monthsSafety;
  const gaugeText = `${monthsSafety.toFixed(0)} ${t('safetyMonths.months')}`;

  return (
    <Paper sx={{height: '236px'}}>
      <Box p={2} display="flex" flexDirection="column" alignItems="center"
           position="relative">
        <GaugeHeader
          title={t('safetyMonths.title')}
          tooltipText={t('safetyMonths.formula')}
          stressTest={stressTest}
          onStressTestToggle={() => setStressTest(!stressTest)}
          stressTestTooltip={t('safetyMonths.stressTest')}
        />

        <Box position="relative" width={200} height={136}>
          <GaugeContainer value={displayValue} valueMax={12}
                          color={safetyRange.color} text={gaugeText}>
            <ColoredGaugeReferenceArc innerRadius={85} outerRadius={90}/>
            <GaugeReferenceArc innerRadius={65} outerRadius={84}
                               color={mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]}/>
            <GaugeValueArc innerRadius={65} outerRadius={84}/>
          </GaugeContainer>
        </Box>

        <GaugeStatus
          text={t(`${safetyRange.infoText}` as any)}
          tooltip={t(`${safetyRange.infoText}Tooltip` as any)}
          color={safetyRange.color}
        />

        {stressTest && (
          <Typography variant="caption" color={theme.palette.warning.light}
                      mt={0.5}>
            {t('safetyMonths.stressTestApplied', {expense: formatMoney(adjustedMonthlyExpense, currency)})}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

type GaugeHeaderProps = {
  title: string
  tooltipText: string
  stressTest: boolean
  onStressTestToggle: () => void
  stressTestTooltip: string
}


const GaugeHeader: React.FC<GaugeHeaderProps> = ({
  title,
  tooltipText,
  stressTest,
  onStressTestToggle,
  stressTestTooltip
}) => {
  const theme = useAppTheme()

  return (
    <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
      <Box display="flex" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Tooltip title={tooltipText} arrow>
          <InfoIcon
            fontSize="small"
            htmlColor={theme.palette.text.secondary}
            sx={{ml: 0.5}}/>
        </Tooltip>
      </Box>
      <Tooltip title={stressTestTooltip} arrow>
        <BoltIcon
          htmlColor={stressTest ? theme.palette.warning.light : theme.palette.text.secondary}
          onClick={onStressTestToggle}
          sx={{cursor: 'pointer'}}
        />
      </Tooltip>
    </Box>
  );
};

type GaugeStatusProps = {
  text: string
  tooltip: string
  color: string
}


const GaugeStatus: React.FC<GaugeStatusProps> = ({text, tooltip, color}) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
      sx={{zIndex: 0}}
    >
      <Typography
        variant="body2"
        color={color}
        fontWeight="medium"
        sx={{
          display: 'inline-block',
          textAlign: 'center',
        }}>
        {text}
      </Typography>
      <Tooltip title={tooltip} arrow>
        <InfoIcon
          fontSize="small"
          htmlColor={color}
          sx={{ml: 0.5}}
        />
      </Tooltip>
    </Box>
  );
};


const InfoIcon = styled(InfoOutlinedIcon)({
  fontSize: '1rem',
  cursor: 'pointer'
});
