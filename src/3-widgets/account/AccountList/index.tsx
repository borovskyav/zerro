import React, { FC, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Collapse, List, ListItemButton, SxProps, Theme } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'
import { useToggle } from '6-shared/hooks/useToggle'
import { TFxAmount } from '6-shared/types'
import { addFxAmount } from '6-shared/helpers/money'
import { toISOMonth } from '6-shared/helpers/date'

import { accountModel, TAccountPopulated } from '5-entities/account'
import { AccountCategory } from '5-entities/account/shared/settings'
import { DisplayAmount, displayCurrency } from '5-entities/currency/displayCurrency'
import { Account, Subheader } from './components'
import { userSettingsModel } from '5-entities/userSettings'

export default function AccountList({ className = '' }) {
  const { t } = useTranslation('accounts')
  const { useAccountCategorization } = userSettingsModel.useUserSettings()
  const toDisplay = displayCurrency.useToDisplay(toISOMonth(new Date()))
  const inBudget = accountModel
    .useInBudgetAccounts()
    .sort(
      (a, b) =>
        toDisplay({ [b.fxCode]: b.balance }) -
        toDisplay({ [a.fxCode]: a.balance })
    )
  const savings = accountModel
    .useSavingAccounts()
    .sort(
      (a, b) =>
        toDisplay({ [b.fxCode]: b.balance }) -
        toDisplay({ [a.fxCode]: a.balance })
    )

  return (
    <div className={className}>
      <CategorySection
        key={'inBalance'}
        categoryName={t('inBalance')}
        categoryDescription={t('inBalanceDescription')}
        accounts={inBudget}
      />

      {!useAccountCategorization && <OutOfBudgetList accounts={savings} />}
      {useAccountCategorization && <CategorizedAccountsList accounts={savings} />}
    </div>
  )
}

const CategorizedAccountsList: FC<{accounts?: TAccountPopulated[]}> = props => {
  const { accounts = [] } = props;
  const { t } = useTranslation('accounts')

  const categories = [
    AccountCategory.Safety,
    AccountCategory.RealAsset,
    AccountCategory.Investment
  ];

  const categoryNames: Record<AccountCategory, string> = {
    [AccountCategory.Balance]: t('inBalance'),
    [AccountCategory.Safety]: t('safety'),
    [AccountCategory.RealAsset]: t('realAssets'),
    [AccountCategory.Investment]: t('investments'),
  };

  const categoryDescriptions: Record<AccountCategory, string> = {
    [AccountCategory.Balance]: t('inBalanceDescription'),
    [AccountCategory.Safety]: t('safetyDescription'),
    [AccountCategory.RealAsset]: t('realAssetsDescription'),
    [AccountCategory.Investment]: t('investmentsDescription'),
  };

  return (
    <>
      {categories.map(category => {
        return <CategorySection
          key={category}
          categoryName={categoryNames[category]}
          categoryDescription={categoryDescriptions[category]}
          accounts={accounts.filter(a => a.category === category)}
        />
      })
      }
    </>
  );
}

const OutOfBudgetList: FC<{ accounts: TAccountPopulated[] }> = props => {
  const { accounts } = props;
  const { t } = useTranslation('accounts')

  return <CategorySection
    key={'other'}
    categoryName={t('other')}
    categoryDescription={t('otherDescription')}
    accounts={accounts}
  />
}

interface CategorySectionProps {
  categoryName: string;
  categoryDescription: string;
  accounts: TAccountPopulated[];
}

const CategorySection: FC<CategorySectionProps> = props => {
  const { categoryName, categoryDescription, accounts } = props;
  const [visible, toggleVisibility] = useToggle(true);
  const activeAccounts = accounts.filter(a => !a.archive);
  const archivedAccounts = accounts.filter(a => a.archive);

  if (!accounts.length) return null;

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
        {activeAccounts.map(acc => (
          <Account key={acc.id} account={acc} />
        ))}
        <ArchivedList accounts={archivedAccounts} />
      </Collapse>
    </List>
  );
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
          {accounts.map(acc => (
            <Account key={acc.id} account={acc} />
          ))}
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

const getTotal = (accs: TAccountPopulated[]): TFxAmount => {
  return accs.reduce(
    (sum, a) => addFxAmount(sum, { [a.fxCode]: a.balance }),
    {}
  )
}
