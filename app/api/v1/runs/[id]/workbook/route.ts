import { NextRequest, NextResponse } from 'next/server';
import { compileWorkbook } from '@/lib/workbook/compiler';
import { canonicalHash } from '@/lib/pipeline/idempotency';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get('workbook') as File | null;
    if (!file) return NextResponse.json({ error: 'workbook file required' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = canonicalHash(bytes.toString('base64'));
    const ir = compileWorkbook(bytes);
    return NextResponse.json({ success: true, run_id: id, sha256, project_ir: ir, status: 'compiled' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: e.code ?? 'UNKNOWN' }, { status: 422 });
  }
}