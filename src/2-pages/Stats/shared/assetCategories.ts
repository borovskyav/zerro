import { TNetWorthCategorizedData } from './netWorth'

export type AssetCategoryKey = keyof TNetWorthCategorizedData | 'total'

export type AssetCategoryConfig = {
  color: string
  labelKey: string
}

// @ts-ignore
export const assetCategories: Record<AssetCategoryKey, AssetCategoryConfig> = {
  fundsInBudget: {
    color: '#4CAF50',
    labelKey: 'netWorth.fundsInBudget',
  },
  fundsSaving: {
    color: '#2196F3',
    labelKey: 'netWorth.fundsSaving',
  },
  realAssets: {
    color: '#9E9E9E',
    labelKey: 'netWorth.realAssets',
  },
  investments: {
    color: '#9C27B0',
    labelKey: 'netWorth.investments',
  },
  accountDebts: {
    color: '#F44336',
    labelKey: 'netWorth.accountDebts',
  },
  debts: {
    color: '#FF5722',
    labelKey: 'netWorth.debts',
  },
  lented: {
    color: '#8BC34A',
    labelKey: 'netWorth.lented',
  }
}
