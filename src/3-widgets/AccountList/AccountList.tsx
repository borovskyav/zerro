import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Collapse, List, ListItemButton } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { useToggle } from '6-shared/hooks/useToggle'
import { toISOMonth } from '6-shared/helpers/date'

import { accountModel, TAccountPopulated } from '5-entities/account'
import { AccountCategory } from '5-entities/account/shared/settings'
import { DisplayAmount, displayCurrency } from '5-entities/currency/displayCurrency'
import {
  AccountRow,
  Subheader,
  createSortFunction,
  filterNegativeBalance,
  filterPositiveBalance,
  getTotal
} from './components'
import { userSettingsModel } from '5-entities/userSettings'
import { DebtorList } from './DebtorList'

export const AccountList: FC = () => {
  const { t } = useTranslation('accounts')
  const { useAccountCategorization } = userSettingsModel.useUserSettings()
  const sort = createSortFunction<TAccountPopulated>()

  const inBudget: TAccountPopulated[] = accountModel.useInBudgetAccounts().sort(sort)
  const savings: TAccountPopulated[] = accountModel.useSavingAccounts().sort(sort)

  return (
    <div>
      <CategorySection
        key={'inBalance'}
        categoryName={t('inBalance')}
        categoryDescription={t('inBalanceDescription')}
        accounts={inBudget}
      />

      {!useAccountCategorization && <OutOfBudgetList accounts={savings} />}
      {useAccountCategorization && (
        <CategorizedAccountsList
          accounts={filterPositiveBalance(savings).sort(sort)}
        />
      )}

      <DebtorList
        loans={useAccountCategorization ? filterNegativeBalance(savings).sort(sort) : []}
      />
    </div>
  )
}

const CategorizedAccountsList: FC<{accounts?: TAccountPopulated[]}> = props => {
  const { accounts = [] } = props
  const { t } = useTranslation('accounts')

  const categories = [
    AccountCategory.Safety,
    AccountCategory.RealAsset,
    AccountCategory.Investment,
  ]

  const categoryNames: Record<string, string> = {
    [AccountCategory.Balance]: t('inBalance'),
    [AccountCategory.Safety]: t('safety'),
    [AccountCategory.RealAsset]: t('realAssets'),
    [AccountCategory.Investment]: t('investments'),
  }

  const categoryDescriptions: Record<AccountCategory, string> = {
    [AccountCategory.Balance]: t('inBalanceDescription'),
    [AccountCategory.Safety]: t('safetyDescription'),
    [AccountCategory.RealAsset]: t('realAssetsDescription'),
    [AccountCategory.Investment]: t('investmentsDescription'),
  }

  return (
    categories.map(category => (
      <CategorySection
        key={category}
        categoryName={categoryNames[category]}
        categoryDescription={categoryDescriptions[category]}
        accounts={accounts.filter(a => a.category === category)}
      />
    ))
  )
}

const OutOfBudgetList: FC<{ accounts: TAccountPopulated[] }> = props => {
  const { accounts } = props
  const { t } = useTranslation('accounts')

  return <CategorySection
    key={'other'}
    categoryName={t('other')}
    categoryDescription={t('otherDescription')}
    accounts={accounts}
  />
}

interface CategorySectionProps {
  categoryName: string
  categoryDescription: string
  accounts: TAccountPopulated[]
}

const CategorySection: FC<CategorySectionProps> = props => {
  const { categoryName, categoryDescription, accounts } = props
  const [visible, toggleVisibility] = useToggle(true)
  const activeAccounts = accounts.filter(a => !a.archive)
  const archivedAccounts = accounts.filter(a => a.archive)

  if (!accounts.length) return null

  return (
    <List dense>
      <ListItemButton
        component="div"
        onClick={toggleVisibility}
        disableGutters
        sx={{ p: 0, borderRadius: 1 }}
      >
        <Subheader
          name={
            <Tooltip title={categoryDescription}>
              <span>{categoryName}</span>
            </Tooltip>
          }
          amount={getTotal(accounts)}
          sx={{width: '100%', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }}}
        />
      </ListItemButton>
      <Collapse in={visible} unmountOnExit>
        {activeAccounts.map(renderAccountRow)}
        <ArchivedList accounts={archivedAccounts} />
      </Collapse>
    </List>
  )
}

const ArchivedList: FC<{ accounts: TAccountPopulated[] }> = props => {
  const { t } = useTranslation('accounts')
  const { accounts } = props
  const month = toISOMonth(new Date())
  const toDisplay = displayCurrency.useToDisplay(month)
  const [visible, toggleVisibility] = useToggle()

  if (!accounts.length) return null

  const sum = getTotal(accounts)
  const hasArchivedMoney = Boolean(toDisplay(sum)) // It can be too small to show

  return (
    <>
      <Collapse in={visible} unmountOnExit>
        <List dense>
          {accounts.map(renderAccountRow)}
        </List>
      </Collapse>
      <ListItemButton
        sx={{ typography: 'body2', borderRadius: 1, color: 'info.main' }}
        onClick={toggleVisibility}
      >
        {visible ? (
          <span>{t('hideArchived')}</span>
        ) : (
          <span>
            {t('archivedAccounts', { count: accounts.length })}{' '}
            {hasArchivedMoney && (
              <DisplayAmount
                month={month}
                value={sum}
                decMode="ifOnly"
                noShade
              />
            )}
          </span>
        )}
      </ListItemButton>
    </>
  )
}

const renderAccountRow = (acc: TAccountPopulated) => (
  <AccountRow
    key={acc.id}
    id={acc.id}
    title={acc.title}
    fxCode={acc.fxCode}
    balance={acc.balance}
    archived={acc.archive}
  />
)
