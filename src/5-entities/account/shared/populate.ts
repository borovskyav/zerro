import { TAccount, TFxCode, AccountType } from '6-shared/types'
import { TInstCodeMap } from '5-entities/currency/instrument'
import { AccountCategory, TAccountMeta } from "./settings";

export type TAccountPopulated = TAccount & {
  startBalanceReal: number
  inBudget: boolean
  fxCode: TFxCode
  category: AccountCategory
}

export function populate(
  raw: TAccount,
  fxIdMap: TInstCodeMap,
  accountMeta?: TAccountMeta
): TAccountPopulated {
  const inBudget = isInBudget(raw)
  let accountType: AccountCategory
  if (accountMeta?.category !== undefined) {
    accountType = accountMeta.category
  } else if (inBudget) {
    accountType = AccountCategory.Balance
  } else {
    accountType = AccountCategory.Safety
  }

  return {
    ...raw,
    startBalanceReal: getStartBalance(raw),
    inBudget: inBudget,
    fxCode: fxIdMap[raw.instrument],
    category: accountType,
  }
}

function getStartBalance(acc: TAccount): number {
  //  Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}

function isInBudget(a: TAccount): boolean {
  if (a.type === AccountType.Debt) return false
  if (a.title.endsWith('📍')) return true
  return a.inBalance
}
