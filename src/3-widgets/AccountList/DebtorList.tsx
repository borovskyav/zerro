import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Collapse, List, ListItemButton } from '@mui/material'
import { AccountRow, Subheader, createSortFunction, getTotal } from './components'
import { isZero } from '6-shared/helpers/money'
import { keys } from '6-shared/helpers/keys'
import { TFxAmount, TFxCode } from '6-shared/types'
import { debtorModel } from '5-entities/debtors'
import { useToggle } from '6-shared/hooks/useToggle'
import { TAccountPopulated } from '5-entities/account'

export type TDebtorInfo = {
  id?: string
  title: string
  balance: number
  fxCode: TFxCode
}

export const DebtorList: FC<{ loans: TAccountPopulated[] }> = props => {
  const { t } = useTranslation('common')
  const { loans = [] } = props

  let iOweList: TDebtorInfo[] = []
  let iLentList: TDebtorInfo[] = []

  Object.values(debtorModel.useDebtors())
    .filter(debtor => !isZero(debtor.balance))
    .forEach((debtor) => {
      keys(debtor.balance).forEach(currency => {
        if (!debtor.balance[currency]) return

        const list = debtor.balance[currency] < 0 ? iOweList : iLentList
        list.push({
          title: debtor.name,
          balance: debtor.balance[currency],
          fxCode: currency,
        })
      })
    })

  loans.filter(acc => acc.balance !== 0)
    .forEach((acc) => {
      iOweList.push({
        id: acc.id,
        title: acc.title,
        balance: acc.balance,
        fxCode: acc.fxCode,
      })
    })

  const sort = createSortFunction<TDebtorInfo>()
  const totalOwe = getTotal(iOweList)
  const totalLent = getTotal(iLentList)

  iOweList = iOweList.sort(sort)
  iLentList = iLentList.sort(sort)

  return (
    <div>
      <DebtorSection
        debtors={iOweList}
        title={t('iOwe')}
        totalAmount={totalOwe}
      />

      <DebtorSection
        debtors={iLentList}
        title={t('iAmOwed')}
        totalAmount={totalLent}
      />
    </div>
  )
}

interface DebtorSectionProps {
  debtors: TDebtorInfo[]
  title: string
  totalAmount: TFxAmount
}

const DebtorSection: FC<DebtorSectionProps> = ({debtors, title, totalAmount}) => {
  const [visible, toggleVisibility] = useToggle(true)
  if (!debtors.length)
    return null

  return (
    <List dense>
      <ListItemButton
        component="div"
        onClick={toggleVisibility}
        disableGutters
        sx={{ p: 0, borderRadius: 1 }}
      >
        <Subheader
          name={title}
          amount={totalAmount}
          sx={{width: '100%', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }}}
        />
      </ListItemButton>
      <Collapse in={visible} unmountOnExit>
        {debtors.map(acc => (
          <AccountRow
            key={acc.id || `${acc.title}_${acc.fxCode}`}
            id={acc.id}
            title={acc.title}
            fxCode={acc.fxCode}
            balance={acc.balance}
          />
        ))}
      </Collapse>
    </List>
  )
}
