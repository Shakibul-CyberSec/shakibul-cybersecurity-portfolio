import { NextResponse } from 'next/server';

// Move the import inside the handler so it runs at request time, not module load time
async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch (error) {
    console.error('KV Import Error:', error);
    return null;
  }
}

export async function GET() {
  const kv = await getKV();
  const kvAvailable = !!kv;

  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      KV_REST_API_URL: process.env.KV_REST_API_URL ? '✅ Set' : '❌ Missing',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? '✅ Set' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    kvStatus: {
      imported: kvAvailable ? '✅ Yes' : '❌ No',
      available: kv ? '✅ Yes' : '❌ No'
    },
    tests: {}
  };

  if (kvAvailable && kv) {
    // ... rest of your tests stay exactly the same
  } else {
    results.tests.error = '❌ KV not available - check environment variables';
  }

  // ... summary logic stays the same

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}
