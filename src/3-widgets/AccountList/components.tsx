import React, { FC, ReactNode, useCallback } from 'react'
import {
  ListSubheader,
  Box,
  ListItemButtonProps,
  ListSubheaderProps,
  Typography,
  ListItemButton,
} from '@mui/material'
import { toISOMonth } from '6-shared/helpers/date'
import { Amount } from '6-shared/ui/Amount'
import { TFxAmount, TFxCode } from '6-shared/types'
import { Tooltip } from '6-shared/ui/Tooltip'

import { isAccountPinned } from '5-entities/account'
import { DisplayAmount, displayCurrency } from '5-entities/currency/displayCurrency'
import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'
import { useAccountContextMenu } from '3-widgets/global/AccountContextMenu'
import { useContextMenu } from '6-shared/hooks/useContextMenu'
import { getEventPosition } from '3-widgets/global/shared/helpers'
import { addFxAmount } from '6-shared/helpers/money'

type AccountRowProps = {
  id?: string;
  title: string;
  fxCode: TFxCode;
  balance: number;
  archived?: boolean;
} & ListItemButtonProps

export const AccountRow: FC<AccountRowProps> = ({ id, title, fxCode, balance, archived, sx, ...rest }) => {
  const transactionDrawer = useTransactionDrawer()
  const openContextMenu = useAccountContextMenu()
  const showTransactions = useCallback(
    () => transactionDrawer.open({title: title, filterConditions: {account: id}}),
    [id, title, transactionDrawer]
  )

  const propsToPass = !id ? {} : useContextMenu({
    onContextMenu: e => {
      if (isAccountPinned(title)) return
      openContextMenu({ id: id }, getEventPosition(e))
    },
    onClick: showTransactions,
  })
  return (
    <ListItemButton
      sx={{
        typography: 'body2',
        borderRadius: 1,
        display: 'flex',
        ...sx,
      }}
      {...rest}
      {...propsToPass}
    >
      <Box
        sx={{
          textDecoration: archived ? 'line-through' : 'none',
          flexGrow: 1,
          minWidth: 0,
          position: 'relative',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          maskImage: 'linear-gradient(to left, transparent, black 40px)',
        }}
        title={title}
      >
        {title}
      </Box>

      <Box
        component="span"
        sx={{
          ml: 1,
          flexShrink: 0,
          color: balance < 0 ? 'error.main' : 'text.secondary',
        }}
      >
        <Tooltip
          title={
            <Amount value={balance} currency={fxCode} noShade />
          }
          disableInteractive
          placement="right"
        >
          <div>
            <Amount
              value={balance}
              currency={fxCode}
              decMode="ifOnly"
              noShade
            />
          </div>
        </Tooltip>
      </Box>
    </ListItemButton>
  )
}

export const Subheader: FC<
  {
    name: ReactNode
    amount: TFxAmount
  } & ListSubheaderProps
> = ({ name, amount, sx, ...rest }) => {
  const month = toISOMonth(new Date())
  const toDisplay = displayCurrency.useToDisplay(month)
  const isNegative = toDisplay(amount) < 0
  return (
    <ListSubheader sx={{ borderRadius: 1, ...sx }} {...rest}>
      <Box component="span" display="flex" width="100%">
        <Typography
          component="span"
          noWrap
          sx={{ flexGrow: 1, lineHeight: 'inherit' }}
        >
          <b>{name}</b>
        </Typography>

        <Box
          component="span"
          ml={2}
          color={isNegative ? 'error.main' : 'text.secondary'}
        >
          <b>
            <DisplayAmount
              month={month}
              value={amount}
              decMode="ifOnly"
              noShade
            />
          </b>
        </Box>
      </Box>
    </ListSubheader>
  )
}

export interface SortableItem {
  fxCode: TFxCode
  balance: number
}

export const createSortFunction = <T extends SortableItem>(date = new Date()) => {
  const month = toISOMonth(date)
  const toDisplay = displayCurrency.useToDisplay(month)

  return (a: T, b: T) =>
    toDisplay({ [b.fxCode]: b.balance }) -
    toDisplay({ [a.fxCode]: a.balance })
}

export const getTotal = (accs: SortableItem[]): TFxAmount => {
  return accs.reduce(
    (sum, a) => addFxAmount(sum, { [a.fxCode]: a.balance }),
    {}
  )
}

export const filterPositiveBalance = <T extends SortableItem>(items: T[]): T[] =>
  items.filter(a => a.balance >= 0)

export const filterNegativeBalance = <T extends SortableItem>(items: T[]): T[] =>
  items.filter(a => a.balance < 0)
