import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'

type OutcomeTooltipProps = {
  totalOutcomeInBudget: number
  totalOutcomeOutOfBudget: number
  formatCurrency: (amount: number) => string
}

export const OutcomeCardTooltip: React.FC<OutcomeTooltipProps> = ({
  totalOutcomeInBudget,
  totalOutcomeOutOfBudget,
  formatCurrency
}) => {
  const { t } = useTranslation('analytics')
  const hasInBalanceOutcome = totalOutcomeInBudget > 0
  const hasOutOfBalanceOutcome = totalOutcomeOutOfBudget > 0
  const showOutcomeSection = hasInBalanceOutcome && hasOutOfBalanceOutcome

  if (!showOutcomeSection)
    return null

  return (
    <Box p={1}>
      <Typography variant="body2" gutterBottom>
        <span>{t('fromFundsInBalance')}:</span>
        <span style={{marginLeft: 8}}>{formatCurrency(totalOutcomeInBudget)}</span>
      </Typography>
      <Typography variant="body2" gutterBottom>
        <span>{t('fromFundsSaving')}:</span>
        <span style={{marginLeft: 8}}>{formatCurrency(totalOutcomeOutOfBudget)}</span>
      </Typography>
    </Box>
  )
}
