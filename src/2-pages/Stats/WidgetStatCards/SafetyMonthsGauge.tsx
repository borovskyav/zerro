import React, { useState } from 'react'
import {Box, Paper, Tooltip, Typography, styled, useTheme} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import BoltIcon from '@mui/icons-material/Bolt'
import { useTranslation } from 'react-i18next'
import { Period } from '../shared/period'
import { GroupBy } from '../../../6-shared/helpers/date'
import { useNetWorthCategorized } from '../shared/netWorth'
import { formatMoney } from '../../../6-shared/helpers/money'
import { displayCurrency } from '../../../5-entities/currency/displayCurrency'
import { StatSummary } from "./model";
import { SafetyRanges, GaugeContainer, GaugeReferenceArc, GaugeValueArc, ColoredGaugeReferenceArc } from "./CustomGauge";
import {useAppTheme, useColorScheme} from "../../../6-shared/ui/theme";

type SafetyMonthsGaugeProps = {
  period: Period
  stats: StatSummary
}

const notConfigured =  {color: '#9E9E9E', tooltip: 'safetyMonths.notConfigured'}

export const SafetyMonthsGauge: React.FC<SafetyMonthsGaugeProps> = ({ period, stats }) => {
  const { t } = useTranslation('analytics')
  const [currency] = displayCurrency.useDisplayCurrency()
  const [stressTest, setStressTest] = useState(false)
  const {mode} = useColorScheme()
  const theme = useAppTheme()

  // Получаем текущие данные о подушке безопасности
  const netWorthData = useNetWorthCategorized(Period.LastYear, GroupBy.Month)
  const latestData = netWorthData[netWorthData.length - 1]

  if (!latestData) return null

  const { fundsSaving } = latestData

  // Рассчитываем средний месячный расход за последние 12 месяцев
  const totalOutcome = stats.totalOutcomeInBalance + stats.totalOutcomeOutOfBalance

  if (!totalOutcome) return null

  const avgMonthlyExpense = totalOutcome / (netWorthData.length - 1 || 1)

  // Применяем стресс-тест, если включен
  const adjustedMonthlyExpense = stressTest ? avgMonthlyExpense * 1.2 : avgMonthlyExpense

  const monthsSafety = fundsSaving / adjustedMonthlyExpense
  const isEmptySafety = fundsSaving === 0

  let safetyRange: {color: string, tooltip: string} = isEmptySafety
    ? notConfigured
    : SafetyRanges.find(({min, max}) => monthsSafety >= min && monthsSafety < max)
      || notConfigured

  const displayValue = monthsSafety >= 12 ? 12 : monthsSafety;
  const gaugeText = `${monthsSafety.toFixed()} ${t('safetyMonths.months')}`;

  return (
    <Paper>
      <Box p={2} display="flex" flexDirection="column" alignItems="center" position="relative">
        <GaugeHeader
          title={t('safetyMonths.title')}
          tooltipText={t('safetyMonths.formula')}
          stressTest={stressTest}
          onStressTestToggle={() => setStressTest(!stressTest)}
          stressTestTooltip={t('safetyMonths.stressTest')}
        />

        <Box position="relative" width={200} height={150}>
          <GaugeContainer value={displayValue} valueMax={12} color={safetyRange.color} text={gaugeText}>
            <ColoredGaugeReferenceArc innerRadius={85} outerRadius={90} />
            <GaugeReferenceArc innerRadius={65} outerRadius={84} color={mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]} />
            <GaugeValueArc innerRadius={65} outerRadius={84} />
          </GaugeContainer>
        </Box>

        <GaugeStatus
          text={t(safetyRange.tooltip as any)}
          color={safetyRange.color}
        />

        {stressTest && (
          <StressTestInfo
            text={t('safetyMonths.stressTestApplied', {
              expense: formatMoney(adjustedMonthlyExpense, currency)
            })}
          />
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
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>
    </Box>
  );
};

type GaugeStatusProps = {
  text: string
  color: string
}

const GaugeStatus: React.FC<GaugeStatusProps> = ({ text, color }) => {
  return (
    <Typography
      variant="body2"
      color={color}
      fontWeight="medium"
      mt={1}
      sx={{
        width: '100%',
        display: 'inline-block',
        textAlign: 'center',
      }}
    >
      {text}
    </Typography>
  );
};

const StressTestInfo: React.FC<{text: string}> = ({ text }) => {
  return (
    <Typography variant="caption" color="text.secondary" mt={1}>
      {text}
    </Typography>
  );
};

const InfoIcon = styled(InfoOutlinedIcon)({
  fontSize: '1rem',
  cursor: 'pointer',
});
