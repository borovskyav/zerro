import React, {ReactElement} from 'react'
import {Box, Grid, Paper} from '@mui/material'
import {Period} from '../shared/period'
import {TotalBalanceStats} from './TotalBalanceStats'
import {userSettingsModel} from "../../../5-entities/userSettings";
import {useNetWorthCategorized} from "../shared/netWorth";
import {GroupBy} from "../../../6-shared/helpers/date";
import {DistributionScale} from "./DistributionScale";
import {useTranslation} from "react-i18next";

type WidgetStatCardsProps = {
  period: Period
}

export const WidgetStatCards = React.memo(
  function WidgetStatCards({period}: WidgetStatCardsProps) : ReactElement {
    const { useAccountCategorization } = userSettingsModel.useUserSettings()

    return (
      <Box>
        <Grid container spacing={2}>
          {<TotalBalanceStats period={period}/>}
          {useAccountCategorization && <Grid item xs={12} sm={12} lg={12}>
            <CategoryStats period={period}/>
          </Grid>}
        </Grid>
      </Box>
    )
  })

const CategoryStats: React.FC<{period: Period}> = ({ period }) => {
  const { t } = useTranslation('analytics')
  const netWorthData = useNetWorthCategorized(period, GroupBy.Month);
  const latestData = netWorthData[netWorthData.length - 1];

  if (!latestData)
    return null;

  const { fundsInBudget, fundsSaving, realAssets, investments } = latestData;

  return (
    <Paper>
      <Box p={2} minWidth="100%">
        <DistributionScale
          title={t('netWorth.assetDistribution')}
          values={{fundsInBudget, fundsSaving, realAssets, investments}}
          totalValue={fundsInBudget + fundsSaving + realAssets + investments}
          visibleCategories={['fundsInBudget', 'fundsSaving', 'realAssets', 'investments']}
        />
      </Box>
    </Paper>
  )
}
