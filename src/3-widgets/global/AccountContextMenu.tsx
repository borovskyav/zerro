import { AccountType, TAccountId } from '6-shared/types'
import React, { FC, useCallback } from 'react'
import { Menu, MenuItem, MenuProps, Box } from '@mui/material'
import { useAppDispatch } from 'store'
import { registerPopover } from '6-shared/historyPopovers'
import { useTranslation } from 'react-i18next'
import { accountModel, TAccountPopulated } from '5-entities/account'
import { getMenuPosition } from './shared/helpers'
import { userSettingsModel } from "../../5-entities/userSettings";
import { AccountCategory } from "../../5-entities/account/shared/settings";
import {
  AccountBalanceWalletOutlined,
  AssessmentOutlined,
  HomeOutlined,
  SavingsOutlined
} from '@mui/icons-material';

type AccountMenuProps = { id: TAccountId }

const accContext = registerPopover<AccountMenuProps, MenuProps>(
  'accountContextMenu',
  { id: '' }
)

export const useAccountContextMenu = () => {
  const { open } = accContext.useMethods()
  return useCallback(
    (props: AccountMenuProps, anchorPosition?: { left: number; top: number }) => {
      open(props, getMenuPosition(anchorPosition))
    },
    [open]
  )
}

export const AccountContextMenu: FC = () => {
  const { useAccountCategorization } = userSettingsModel.useUserSettings()
  const { t } = useTranslation('accountContextMenu')
  const { displayProps, extraProps } = accContext.useProps()
  const dispatch = useAppDispatch()
  const { id } = extraProps
  const account = accountModel.usePopulatedAccounts()[id]

  if (!account)
    return null

  const options = useAccountCategorization && account.balance >= 0
    ? getCategorizationOptions(account, dispatch)
    : getNoCategorizationOptions(account, dispatch)

  return (
    <Menu {...displayProps} disableAutoFocusItem>
      {options
        .filter(({ condition }) => condition)
        .map(({ label, action, icon }) =>
          <MenuItem
            key={label}
            onClick={() => {
              displayProps.onClose()
              action()
            }}
          >
            <Box component="span" sx={{display: 'flex', alignItems: 'center'}}>
              {icon}
              <Box component="span" sx={{ml: 1}}>
                {t(label)}
              </Box>
            </Box>
          </MenuItem>)
      }
    </Menu>
  )
}

type MenuOption = {
  label: any
  condition: boolean
  action: () => void
  icon?: React.ReactNode
}

const getCategorizationOptions = (
  account: TAccountPopulated,
  dispatch: ReturnType<typeof useAppDispatch>
): MenuOption[] => {
  return [
    {
      label: 'setBalanceCategory',
      condition: account.category !== AccountCategory.Balance,
      action: () => setAccountCategory(account, dispatch, AccountCategory.Balance, true),
      icon: <AccountBalanceWalletOutlined sx={{ fontSize: 16 }}/>
    },
    {
      label: 'setSavingsCategory',
      condition: account.category !== AccountCategory.Safety,
      action: () => setAccountCategory(account, dispatch, AccountCategory.Safety, false),
      icon: <SavingsOutlined sx={{ fontSize: 16 }}/>
    },
    {
      label: 'setRealAssetCategory',
      condition: account.category !== AccountCategory.RealAsset,
      action: () => setAccountCategory(account, dispatch, AccountCategory.RealAsset, false),
      icon: <HomeOutlined sx={{ fontSize: 16 }}/>
    },
    {
      label: 'setInvestmentCategory',
      condition: account.category !== AccountCategory.Investment,
      action: () => setAccountCategory(account, dispatch, AccountCategory.Investment, false),
      icon: <AssessmentOutlined sx={{ fontSize: 16 }}/>
    },
  ]
}

const setAccountCategory = (
  account: TAccountPopulated,
  dispatch: ReturnType<typeof useAppDispatch>,
  category: AccountCategory,
  shouldBeInBalance: boolean
) => {
  if (account.inBalance !== shouldBeInBalance) {
    dispatch(accountModel.setInBudget(account.id, shouldBeInBalance))
  }
  dispatch(accountModel.patchAccountMeta({id: account.id, category}))
}

const getNoCategorizationOptions = (
  account: TAccountPopulated,
  dispatch: any,
): MenuOption[] => {
  return [
    {
      label: 'moveFromBalance',
      condition: account.inBalance,
      action: () => dispatch(accountModel.setInBudget(account.id, false)),
    },
    {
      label: 'moveInBalance',
      condition: !account.inBalance,
      action: () => dispatch(accountModel.setInBudget(account.id, true)),
    },
  ]
}
