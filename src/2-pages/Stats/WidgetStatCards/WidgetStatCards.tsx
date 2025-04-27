import React, {ReactElement} from 'react'
import {Box} from '@mui/material'
import {Period} from '../shared/period'
import {TotalBalanceStats} from './TotalBalanceStats'
import {CategoryStats} from './CategoryStats'
import {userSettingsModel} from "../../../5-entities/userSettings";

type WidgetStatCardsProps = {
  period: Period
}

export const WidgetStatCards = React.memo(
  function WidgetStatCards({period}: WidgetStatCardsProps) : ReactElement {
    const { useAccountCategorization } = userSettingsModel.useUserSettings()

    return (
      <Box>
        {<TotalBalanceStats period={period} />}
        {useAccountCategorization ?? <CategoryStats period={period} />}
      </Box>
    )
  })
