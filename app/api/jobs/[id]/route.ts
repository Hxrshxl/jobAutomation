import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import JobResult from '../../../../models/JobResult';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const body = await request.json();
  
  const updated = await JobResult.findByIdAndUpdate(
    params.id,
    { $set: { applied: body.applied } },
    { new: true }
  );
  
  if (!updated) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  
  return NextResponse.json(updated);
}
