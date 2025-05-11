import React, {useCallback, useState, useMemo} from 'react'
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Card,
} from '@mui/material'
import {
  ResponsiveContainer,
  ComposedChart,
  YAxis,
  Tooltip,
  Bar,
  Line,
  ReferenceLine,
} from 'recharts'
import { useAppTheme } from '6-shared/ui/theme'
import { round } from '6-shared/helpers/money'
import { formatDate, GroupBy } from '6-shared/helpers/date'
import { useTranslation } from 'react-i18next'
import { WidgetHeader } from './WidgetHeader'

import { displayCurrency } from '5-entities/currency/displayCurrency'
import { userSettingsModel } from '5-entities/userSettings'
import { DataLine } from '3-widgets/DataLine'
import { Period, PeriodTitle } from '../shared/period'
import { TNetWorthPoint, useNetWorthUncategorized, useNetWorthCategorized } from '../shared/netWorth'
import { assetCategories, AssetCategoryKey } from '../shared/assetCategories'

type FieldConfig = {
  key: AssetCategoryKey
  name: string
  color: string
}

type WidgetNetWorthProps = {
  period: Period
  onTogglePeriod: () => void
}

export function WidgetNetWorth(props: WidgetNetWorthProps) {
  const { useAccountCategorization } = userSettingsModel.useUserSettings()

  return useAccountCategorization
    ? <WidgetNetWorthCategorized {...props} />
    : <WidgetNetWorthUncategorized {...props} />;
}

export function WidgetNetWorthUncategorized(props: WidgetNetWorthProps) {
  const { t } = useTranslation('analytics')
  const theme = useAppTheme()

  const fields: FieldConfig[] = [
    {
      key: 'fundsInBudget',
      name: t('netWorth.fundsInBudget'),
      color: theme.palette.primary.dark,
    },
    {
      key: 'fundsSaving',
      name: t('netWorth.fundsOutOfBalance'),
      color: theme.palette.primary.light,
    },
    {
      key: 'accountDebts',
      name: t('netWorth.accountDebts'),
      color: theme.palette.error.dark,
    },
    {
      key: 'debts',
      name: t('netWorth.debts'),
      color: theme.palette.error.light,
    },
    {
      key: 'lented',
      name: t('netWorth.lented'),
      color: theme.palette.success.light,
    },
  ]

  const visibleFields: AssetCategoryKey[] = ['fundsInBudget', 'fundsSaving', 'accountDebts', 'debts']

  return (
    <Paper>
      <WidgetHeader period={props.period} onTogglePeriod={props.onTogglePeriod}/>
      <WidgetNetWorthGeneric
        {...props}
        getData={useNetWorthUncategorized}
        visibleFields={visibleFields}
        fields={fields}
      />
    </Paper>
  )
}

export function WidgetNetWorthCategorized(props: WidgetNetWorthProps) {
  const { t } = useTranslation('analytics')
  const theme = useAppTheme()

  const fieldsKeys: AssetCategoryKey[] = ['fundsInBudget', 'fundsSaving', 'realAssets', 'investments', 'accountDebts', 'debts', 'lented']
  const visibleFields: AssetCategoryKey[] = ['fundsInBudget', 'fundsSaving', 'realAssets', 'investments', 'accountDebts', 'debts']

  const fields: FieldConfig[] = fieldsKeys
    .map(key => ({
      key,
      name: t(assetCategories[key].labelKey as any),
      color: assetCategories[key].color,
    }))

  return (
    <Paper>
      <Box p={2} minWidth="100%">
        <Typography variant="h5">
          {t('netWorth.title')}{' '}
          <span style={{ color: theme.palette.secondary.main, cursor: 'pointer' }} onClick={props.onTogglePeriod}>
            <PeriodTitle period={props.period} />
          </span>
        </Typography>
      </Box>
      <WidgetNetWorthGeneric
        {...props}
        getData={useNetWorthCategorized}
        visibleFields={visibleFields}
        fields={fields}
      />
    </Paper>
  )
}

type WidgetNetWorthGenericProps<T extends TNetWorthPoint> = {
  period: Period
  onTogglePeriod: () => void
  fields: FieldConfig[]
  visibleFields: AssetCategoryKey[]
  getData: (period: Period, aggregation: GroupBy) => T[]
}

export function WidgetNetWorthGeneric<T extends TNetWorthPoint>(props: WidgetNetWorthGenericProps<T>) {
  const { t } = useTranslation('analytics')
  const {period, onTogglePeriod, fields, getData, visibleFields} = props
  const theme = useAppTheme()

  const balances: T[] = getData(period, GroupBy.Month)

  const [visibleParts, setVisibleParts] = useState<Array<AssetCategoryKey>>([...visibleFields, 'total'])
  const isVisible = useCallback((key: AssetCategoryKey) => visibleParts.includes(key), [visibleParts])

  const toggle = useCallback((key: AssetCategoryKey) =>
      setVisibleParts(arr => arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key]),
    [setVisibleParts]
  );

  const points = useMemo(() => {
    return balances.map(b => {
      let total = 0

      fields.forEach((field: FieldConfig) => {
        total = isVisible(field.key)
          ? round(total + ((b as unknown as Record<AssetCategoryKey, number>)[field.key] || 0))
          : total
      })

      return { ...b, total } as T & { total: number }
    })
  }, [balances, fields, isVisible])

  const colors = useMemo(() => {
    const result: Record<string, string> = { total: theme.palette.info.main }
    fields.forEach(field => { result[field.key as string] = field.color })
    return result
  }, [fields, theme.palette.info.main])

  const names = useMemo(() => {
    const result: Record<string, string> = { total: t('netWorth.total') }
    fields.forEach(field => { result[field.key as string] = field.name })
    return result
  }, [fields, t])

  const makeBar = useCallback((field: FieldConfig) => {
    if (!isVisible(field.key)) return null

    return (
      <Bar
        key={field.key as string}
        dataKey={field.key as string}
        name={field.name}
        stackId="a"
        fill={field.color}
        isAnimationActive={false}
      />
    )
  }, [isVisible])

  const makeCheck = useCallback((field: FieldConfig) => {
    return (
      <FormControlLabel
        key={field.key as string}
        label={field.name}
        control={
          <Checkbox
            sx={{
              color: field.color,
              '&.Mui-checked': { color: field.color },
            }}
            checked={isVisible(field.key)}
            onChange={() => toggle(field.key)}
          />
        }
      />
    )
  }, [isVisible, toggle])

  return (
    <>
      <Box p={2} minWidth="100%" height={300}>
        <ResponsiveContainer>
          <ComposedChart
            data={points}
            stackOffset="sign"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <YAxis type="number" domain={['dataMin', 'dataMax']} hide />
            <Tooltip content={<CustomTooltip<T> names={names} colors={colors} />} />
            {visibleParts.length > 0 && (
              <ReferenceLine y={0} stroke={theme.palette.divider} />
            )}

            {fields.map(field => makeBar(field))}

            {isVisible('total') && (
              <Line
                type="monotone"
                dataKey="total"
                name={t('netWorth.total')}
                stroke={colors.total}
                isAnimationActive={false}
                dot={false}
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      <Box p={2} display="flex" flexWrap="wrap">
        {fields.map(field => makeCheck(field))}

        <FormControlLabel
          label={t('netWorth.total')}
          control={
            <Checkbox
              sx={{
                color: colors.total,
                '&.Mui-checked': { color: colors.total },
              }}
              checked={isVisible('total')}
              onChange={() => toggle('total')}
            />
          }
        />
      </Box>
    </>
  )
}

type TPayload<T> = {
  dataKey: string
  name: string
  color: string
  fill: string
  payload: T & { total?: number }
  value: number
}

function CustomTooltip<T extends TNetWorthPoint>(props: {
  active?: boolean
  payload?: TPayload<T>[]
  names: Record<string, string>
  colors: Record<string, string>
}): React.ReactElement | null {
  const { active, payload } = props
  const [currency] = displayCurrency.useDisplayCurrency()

  if (!active || !payload?.length)
    return null

  const date = payload[0]?.payload?.date
  const values = payload.filter(v => v.value !== 0 && v.value !== undefined)

  return (
    <Card elevation={10} sx={{ p: 2 }}>
      <Typography variant="h6">
        {capitalize(formatDate(date, 'LLLL yyyy'))}
      </Typography>
      {values.map(v => (
        <DataLine
          color={v.color}
          key={v.dataKey}
          name={v.name}
          amount={v.value}
          currency={currency}
        />
      ))}
    </Card>
  )
}

function capitalize(string: string): string {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}
