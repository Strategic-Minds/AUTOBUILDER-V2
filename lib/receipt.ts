import { NextResponse } from 'next/server'

export interface Receipt {
  receipt_id: string
  action: string
  timestamp: string
  agent: string
  result: 'success' | 'failure'
  rollback?: string
  evidence?: string
}

export function createReceipt(action: string, agent: string, result: 'success' | 'failure', evidence?: string): Receipt {
  return {
    receipt_id: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    action,
    timestamp: new Date().toISOString(),
    agent,
    result,
    rollback: `Revert commit on ${new Date().toISOString()}`,
    evidence
  }
}

export function receiptResponse(data: object, receipt: Receipt) {
  return NextResponse.json({ ...data, _receipt: receipt })
}
