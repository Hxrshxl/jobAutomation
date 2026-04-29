import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '../../../lib/mongodb';

export async function GET() {
  let dbConnected = false;
  
  try {
    await dbConnect();
    // mongoose.connection.readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    dbConnected = mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('Health check DB connection error:', error);
  }

  return NextResponse.json({
    status: 'ok',
    dbConnected,
    timestamp: new Date().toISOString()
  });
}
