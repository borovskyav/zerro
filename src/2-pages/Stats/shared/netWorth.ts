import { AccountType, TISODate } from '6-shared/types'
import { GroupBy } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'
import { round } from '6-shared/helpers/money'

import { accountModel } from '5-entities/account'
import { accBalanceModel } from '5-entities/accBalances'
import { getStart, Period } from './period'
import { isFinite } from 'lodash'
import {AccountCategory} from "../../../5-entities/account/shared/settings";

export type TNetWorthPoint = {
  date: TISODate
  /** Money I gave to somebody */
  lented: number
  /** Money I owe to somebody */
  debts: number
  /** All negative amounts on accounts */
  accountDebts: number
  fundsInBudget: number
  fundsSaving: number
}

export type TNetWorthPointCategorized = TNetWorthPoint & {
  realAssets: number
  investments: number
}

export function useNetWorthCategorized(period: Period, aggregation: GroupBy): TNetWorthPointCategorized[] {
  return processNetWorth<TNetWorthPointCategorized>(
    period,
    aggregation,
    (date, accs, accounts) => {
      let fundsInBudget = 0
      let fundsSaving = 0
      let accountDebts = 0
      let realAssets = 0
      let investments = 0

      keys(accounts).forEach(id => {
        if (accs[id].type === AccountType.Debt)
          return
        console.assert(
          isFinite(accounts[id]),
          `accounts[${id}] is not a number`,
          accounts[id],
          date
        )

        const accountValue  = round(accounts[id] || 0)
        if (accountValue < 0) {
          accountDebts += round(accountValue)
          return
        }
        const accountCategory = accs[id].category
        switch (accountCategory) {
          case AccountCategory.Balance:
            fundsInBudget += accountValue
            break
          case AccountCategory.Safety:
            fundsSaving += accountValue
            break
          case AccountCategory.RealAsset:
            realAssets += accountValue
            break
          case AccountCategory.Investment:
            investments += accountValue
            break
          default:
            console.warn(`Unknown account category: ${accountCategory}`)
        }
      })

      return {fundsInBudget, fundsSaving, accountDebts, realAssets, investments}
    }
  )
}

export function useNetWorthUncategorized(period: Period, aggregation: GroupBy): TNetWorthPoint[] {
  return processNetWorth<TNetWorthPoint>(
    period,
    aggregation,
    (date, accs, accounts) => {
      let fundsInBudget = 0
      let fundsSaving = 0
      let accountDebts = 0
      keys(accounts).forEach(id => {
        if (accs[id].type === AccountType.Debt) return
        console.assert(
          isFinite(accounts[id]),
          `accounts[${id}] is not a number`,
          accounts[id],
          date
        )
        const value = accounts[id] || 0
        if (value > 0) {
          if (accs[id]?.inBudget) {
            fundsInBudget = round(fundsInBudget + value)
          } else {
            fundsSaving = round(fundsSaving + value)
          }
        }
        if (value < 0) {
          accountDebts = round(accountDebts + value)
        }
      })

      return {fundsInBudget, fundsSaving, accountDebts}
    }
  )
}

function processNetWorth<T>(
  period: Period,
  aggregation: GroupBy,
  processor: (date: TISODate, accs: Record<string, any>, accounts: Record<string, number>) => any
) : T[] {
  const accs = accountModel.usePopulatedAccounts()

  return accBalanceModel
    .useDisplayBalances(aggregation, getStart(period, aggregation))
    .map(({date, balances}) => {
      const {accounts, debtors} = balances

      let lented = 0
      let debts = 0
      keys(debtors).forEach(id => {
        console.assert(
          isFinite(debtors[id]),
          `debtors[${id}] is not a number`,
          debtors[id],
          date
        )
        const value = debtors[id] || 0
        if (value > 0) lented = round(lented + value)
        if (value < 0) debts = round(debts + value)
      })

      const res = processor(date, accs, accounts)
      return {
        lented,
        debts,
        date,
        ...res
      }
    })
}
