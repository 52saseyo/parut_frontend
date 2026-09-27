import { describe, expect, it } from 'vitest'
import { approveRefundsPayload } from './api'

describe('refund API contract', () => {
  it('exposes a batch approval operation for seller workflows', () => {
    expect(approveRefundsPayload(['refund-1', 'refund-2'])).toEqual({
      refundIds: ['refund-1', 'refund-2'],
    })
  })
})
