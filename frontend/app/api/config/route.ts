import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  });
}
