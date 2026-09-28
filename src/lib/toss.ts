import { loadTossPayments, type TossPaymentsSDK } from '@tosspayments/tosspayments-sdk'

const tossClientKey = import.meta.env.VITE_TOSS_CLIENT_KEY

let tossPaymentsPromise: Promise<TossPaymentsSDK> | null = null

/**
 * Toss Payments SDK를 한 번만 로드합니다.
 * client key는 결제창을 여는 데 필요한 공개 키이며 secret key를 사용하면 안 됩니다.
 */
export function getTossPayments() {
  if (!tossClientKey) {
    return Promise.reject(new Error('VITE_TOSS_CLIENT_KEY가 설정되지 않았습니다.'))
  }

  tossPaymentsPromise ??= loadTossPayments(tossClientKey).catch((error) => {
    tossPaymentsPromise = null
    throw error
  })

  return tossPaymentsPromise
}

/**
 * 최신 결제위젯 SDK에서 사용할 결제 인스턴스를 생성합니다.
 * customerKey는 로그인한 회원을 식별할 수 있는 안정적인 값이어야 합니다.
 */
export async function getTossWidgets(customerKey: string) {
  const normalizedCustomerKey = customerKey.trim()
  if (!normalizedCustomerKey) {
    throw new Error('Toss Payments customerKey가 필요합니다.')
  }

  const tossPayments = await getTossPayments()
  return tossPayments.widgets({ customerKey: normalizedCustomerKey })
}
