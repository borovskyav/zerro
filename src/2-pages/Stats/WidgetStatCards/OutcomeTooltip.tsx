import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { DisplayAmount } from "5-entities/currency/displayCurrency";

type OutcomeTooltipProps = {
  totalOutcomeInBudget: number
  totalOutcomeOutOfBudget: number
}

export const OutcomeCardTooltip: React.FC<OutcomeTooltipProps> = ({
  totalOutcomeInBudget,
  totalOutcomeOutOfBudget
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
        {t('fromFundsInBalance')}: <DisplayAmount value={totalOutcomeInBudget} noShade decMode="ifOnly"/>
      </Typography>
      <Typography variant="body2" gutterBottom>
        {t('fromFundsSaving')}: <DisplayAmount value={totalOutcomeOutOfBudget} noShade decMode="ifOnly"/>
      </Typography>
    </Box>
  )
}
