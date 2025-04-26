import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Collapse, List, ListItemButton } from '@mui/material'
import { Debtor, Subheader } from './components'
import { addFxAmount, isZero } from '6-shared/helpers/money'
import { keys } from '6-shared/helpers/keys'
import { TFxAmount, TFxCode } from '6-shared/types'
import { debtorModel } from '5-entities/debtors'
import { useToggle } from "../../6-shared/hooks/useToggle";

type TDebtorInfo = {
  name: string
  balance: number
  currency: TFxCode
}

export function DebtorList({ className = '' }) {
  const { t } = useTranslation('common')
  const debtors = debtorModel.useDebtors()
  const list = Object.values(debtors)
    .filter(debtor => !isZero(debtor.balance))
    .reduce((acc, debtor) => {
      keys(debtor.balance).forEach(currency => {
        if (!debtor.balance[currency]) return
        acc.push({
          name: debtor.name,
          balance: debtor.balance[currency],
          currency,
        })
      })
      return acc
    }, [] as TDebtorInfo[])

  if (!list.length) return null

  const iOweList = list.filter(d => d.balance < 0)
  const iLentList = list.filter(d => d.balance > 0)
  const totalOwe = iOweList.reduce(
    (sum, d) => addFxAmount(sum, { [d.currency]: d.balance }),
    {}
  )
  const totalLent = iLentList.reduce(
    (sum, d) => addFxAmount(sum, { [d.currency]: d.balance }),
    {}
  )

  return (
    <div className={className}>
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

const DebtorSection: FC<DebtorSectionProps> = ({ debtors, title, totalAmount }) => {
  const [visible, toggleVisibility] = useToggle(true);
  if (!debtors.length) return null

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
        {debtors.map(d => (
          <Debtor
            key={d.name + d.currency}
            name={d.name}
            currency={d.currency}
            balance={d.balance}
          />
        ))}
      </Collapse>
    </List>
  )
}
