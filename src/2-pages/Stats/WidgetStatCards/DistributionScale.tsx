import React from 'react'
import { Box, BoxProps, styled, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { assetCategories, AssetCategoryKey } from '../shared/assetCategories'
import { formatMoney} from "../../../6-shared/helpers/money";
import { displayCurrency } from "../../../5-entities/currency/displayCurrency";
import { PercentBar } from "../../../6-shared/ui/PercentBar";

type DistributionScaleProps = {
  values: Record<string, number>
  totalValue: number
  visibleCategories: AssetCategoryKey[]
  title: string
} & BoxProps

export const DistributionScale: React.FC<DistributionScaleProps> = ({
  values,
  totalValue,
  visibleCategories,
  title,
  ...rest
}) => {
  const {t} = useTranslation('analytics')
  const [currency] = displayCurrency.useDisplayCurrency()

  if (totalValue === 0) return null

  const categories = visibleCategories.map((key) => {
    const config = assetCategories[key]
    // Для долгов используем абсолютное значение, для активов - как есть
    const value = Math.abs(values[key] || 0)

    if (value === 0) return undefined
    const percentage = totalValue === 0 ? 100 / visibleCategories.length : (value / totalValue) * 100
    const label = t(config.labelKey as any)

    return {
      key,
      value,
      percentage,
      color: config.color,
      label,
      tooltip: `${label}: ${formatMoney(value, currency)}`,
    }
  }).filter(x => x !== undefined)

  if (categories.length === 0) return null

  return (
    <Box {...rest} sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
      </Box>
      <PercentBar
        data={categories.map(category => ({
          id: category.key,
          name: category.tooltip,
          amount: category.percentage,
          color: category.color
        }))}
        height="21px"
        style={{ marginTop: '7px' }}
      />

      <LegendContainer>
        {categories.map((category, index) => (
          <LegendItem key={index} color={category.color}>
            <span className="category-label">{category.label}: </span> {Math.round(category.percentage)}%
          </LegendItem>
        ))}
      </LegendContainer>
    </Box>
  )
}

const LegendContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(1),
  fontSize: '0.75rem',
  alignItems: 'center'
}))

const LegendItem = styled('div')<{ color: string }>(({ theme, color }) => ({
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    display: 'inline-block',
    width: '10px',
    height: '10px',
    backgroundColor: color,
    marginRight: '4px',
    borderRadius: '2px',
  },
  '& .category-label': {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
}))
