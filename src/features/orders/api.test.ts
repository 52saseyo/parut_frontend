import { describe, expect, it } from 'vitest'
import { createOrderPayload, paymentReadyPayload } from './api'

describe('order request payloads', () => {
  it('keeps the backend order item and recipient contract', () => {
    expect(
      createOrderPayload({
        items: [{ productId: 'product-1', quantity: 2 }],
        recipient: {
          recipientName: '파릇 고객',
          recipientPhone: '010-0000-0000',
          zipCode: '00000',
          addressBase: '서울시 파릇구 파릇로 1',
        },
      }),
    ).toEqual({
      items: [{ productId: 'product-1', quantity: 2 }],
      recipient: {
        recipientName: '파릇 고객',
        recipientPhone: '010-0000-0000',
        zipCode: '00000',
        addressBase: '서울시 파릇구 파릇로 1',
      },
      removeFromCart: false,
    })
  })

  it('uses the payment method expected by payment ready', () => {
    expect(paymentReadyPayload('order-1')).toEqual({
      orderId: 'order-1',
      paymentMethod: 'TOSS_PAY',
    })
    expect(paymentReadyPayload('order-1', 'CREDIT_CARD')).toEqual({
      orderId: 'order-1',
      paymentMethod: 'CREDIT_CARD',
    })
  })
})
