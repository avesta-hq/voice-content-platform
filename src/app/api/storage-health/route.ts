import { NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';

export async function GET() {
  try {
    const health = await hybridStorageService.healthCheck();
    
    return NextResponse.json({
      message: 'Hybrid Storage Health Check',
      timestamp: new Date().toISOString(),
      health: health,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        USE_S3_LOCAL: process.env.USE_S3_LOCAL,
        AWS_REGION: process.env.AWS_REGION ? 'SET' : 'NOT SET',
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME ? 'SET' : 'NOT SET',
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'
      }
    });
  } catch (error) {
    console.error('Storage health check error:', error);
    return NextResponse.json({ 
      error: 'Storage health check failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
