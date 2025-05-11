import React, { useState, useCallback, memo } from 'react'
import { Stack } from '@mui/system'

import { WidgetNetWorth } from './WidgetNetWorth'
import { WidgetCashflow } from './WidgetCashflow'
import { WidgetAccHistory } from './WidgetAccHistory'
import { WidgetStatCards } from "./WidgetStatCards";
import { nextPeriod, Period } from './shared/period'
import { userSettingsModel } from "../../5-entities/userSettings";

const MemoizedWidgetStatCards = memo(WidgetStatCards)
const MemoizedWidgetNetWorth = memo(WidgetNetWorth)
const MemoizedWidgetCashflow = memo(WidgetCashflow)
const MemoizedWidgetAccHistory = memo(WidgetAccHistory)

export default function Stats() {
  const [period, setPeriod] = useState<Period>(Period.LastYear)
  const togglePeriod = useCallback(() => setPeriod(prevPeriod => nextPeriod(prevPeriod)), [])

  const {useAccountCategorization} = userSettingsModel.useUserSettings()

  return (
    <Stack spacing={2} p={3} pb={10}>
      {useAccountCategorization && <MemoizedWidgetStatCards period={period} />}
      <MemoizedWidgetNetWorth period={period} onTogglePeriod={togglePeriod} />
      <MemoizedWidgetCashflow period={period} onTogglePeriod={togglePeriod} />
      <MemoizedWidgetAccHistory period={period} />
    </Stack>
  )
}
