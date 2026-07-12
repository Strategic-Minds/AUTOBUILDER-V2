import { NextRequest, NextResponse } from 'next/server'
import { dbGetTasks, dbCreateTask } from '@/lib/supabase/db'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    const tasks = await dbGetTasks(projectId)
    return NextResponse.json({ tasks })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/tasks GET]', err)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    if (!body.projectId || !body.title) return NextResponse.json({ error: 'projectId and title required' }, { status: 400 })
    const task = await dbCreateTask(body)
    return NextResponse.json({ task }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/tasks POST]', err)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
