import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { approveVisualReference } from '@/lib/factory/visual-approval'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 90

function numberField(value: FormDataEntryValue | null) {
  const parsed = Number(String(value || ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!user.email) return NextResponse.json({ error: 'Authenticated user has no email' }, { status: 400 })
    const { id } = await params
    const form = await req.formData()
    const image = form.get('image')
    if (!(image instanceof File)) return NextResponse.json({ error: 'An image file is required' }, { status: 400 })

    const bytes = Buffer.from(await image.arrayBuffer())
    const result = await approveVisualReference({
      projectId: id,
      ownerEmail: user.email,
      actor: user.email,
      fileName: image.name || 'approved-visual.png',
      contentType: image.type || 'image/png',
      bytes,
      width: numberField(form.get('width')),
      height: numberField(form.get('height')),
      notes: String(form.get('notes') || '').trim() || undefined,
    })

    return NextResponse.json(result, { status: 202 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    const message = error instanceof Error ? error.message : 'Unable to approve visual reference'
    const status = message.includes('not found') ? 404 : message.includes('configured') ? 503 : 500
    return NextResponse.json({ error: message, production_locked: true }, { status })
  }
}
