import { ById, OptionalExceptFor, TAccount, TAccountId } from "6-shared/types";
import { HiddenDataType, makeSimpleHiddenStore } from "5-entities/shared/hidden-store";
import { AppDispatch, AppThunk, RootState } from "store";

/**
 * Categories for accounts to help users organize their finances
 */
export enum AccountCategory {
  /** Regular accounts used for daily transactions */
  Balance = 'balance',
  /** Safety accounts like emergency funds */
  Safety = 'safety',
  /** Physical assets like real estate or vehicles */
  RealAsset = 'realAsset',
  /** Investment accounts like stocks, bonds, etc. */
  Investment = 'investment',
}

export type TAccountMetaPatch = OptionalExceptFor<TAccountMeta, 'id'>

export type TAccountMeta = {
  id: TAccountId
  category?: AccountCategory
}

const accountMetaStore = makeSimpleHiddenStore<ById<TAccountMeta>>(
  'AccountMeta',
  {}
)

export const getAccountMeta = accountMetaStore.getData

export const patchAccountMeta =
  (updates: TAccountMetaPatch | TAccountMetaPatch[]): AppThunk =>
    (dispatch: AppDispatch, getState: () => RootState) => {
      const currentData = getAccountMeta(getState())
      const updateList = Array.isArray(updates) ? updates : [updates]

      const newData = {...currentData}
      updateList.forEach(update => {
        if (!currentData[update.id]) {
          newData[update.id] = { id: update.id }
        }
        newData[update.id] = {...newData[update.id], ...update}
      })

      dispatch(accountMetaStore.setData(newData))
    }

export function isAccountPinned(title: string): boolean {
    return title.endsWith('📍')
}
