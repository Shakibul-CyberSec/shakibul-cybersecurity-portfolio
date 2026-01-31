import { NextResponse } from 'next/server';

/* ---------- VERCEL KV TEST ---------- */
let kv = null;
let kvAvailable = false;

// Try to import Vercel KV
if (typeof process !== 'undefined' && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  try {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
    kvAvailable = true;
  } catch (error) {
    console.error('KV Import Error:', error);
  }
}

export async function GET() {
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

  // Test 1: Write a test value
  if (kvAvailable && kv) {
    try {
      const testKey = 'test:connection';
      const testValue = { message: 'Hello from Vercel KV!', timestamp: Date.now() };
      
      await kv.set(testKey, testValue, { ex: 60 }); // Expire in 60 seconds
      results.tests.write = '✅ Success';
    } catch (error) {
      results.tests.write = `❌ Failed: ${error.message}`;
    }

    // Test 2: Read the test value
    try {
      const testKey = 'test:connection';
      const data = await kv.get(testKey);
      
      if (data && data.message === 'Hello from Vercel KV!') {
        results.tests.read = '✅ Success';
        results.tests.data = data;
      } else {
        results.tests.read = '⚠️ Read succeeded but data mismatch';
        results.tests.data = data;
      }
    } catch (error) {
      results.tests.read = `❌ Failed: ${error.message}`;
    }

    // Test 3: Set with expiry and check TTL
    try {
      const ttlKey = 'test:ttl';
      await kv.set(ttlKey, 'expiring-value', { ex: 300 }); // 5 minutes
      
      const ttl = await kv.ttl(ttlKey);
      results.tests.ttl = `✅ Success (TTL: ${ttl}s)`;
    } catch (error) {
      results.tests.ttl = `❌ Failed: ${error.message}`;
    }

    // Test 4: Delete test
    try {
      const delKey = 'test:delete';
      await kv.set(delKey, 'to-be-deleted');
      const deleted = await kv.del(delKey);
      results.tests.delete = deleted > 0 ? '✅ Success' : '⚠️ Nothing deleted';
    } catch (error) {
      results.tests.delete = `❌ Failed: ${error.message}`;
    }

    // Test 5: Set operations (for shadow ban tracking)
    try {
      const setKey = 'test:set';
      await kv.sadd(setKey, 'member1', 'member2', 'member3');
      const isMember = await kv.sismember(setKey, 'member2');
      const members = await kv.smembers(setKey);
      
      results.tests.sets = {
        status: '✅ Success',
        isMember: isMember === 1 ? 'Yes' : 'No',
        membersCount: members.length
      };
      
      // Cleanup
      await kv.del(setKey);
    } catch (error) {
      results.tests.sets = `❌ Failed: ${error.message}`;
    }

    // Test 6: Keys pattern matching
    try {
      await kv.set('test:pattern:1', 'value1');
      await kv.set('test:pattern:2', 'value2');
      
      const keys = await kv.keys('test:pattern:*');
      results.tests.keys = {
        status: '✅ Success',
        found: keys.length
      };
      
      // Cleanup
      await kv.del('test:pattern:1', 'test:pattern:2');
    } catch (error) {
      results.tests.keys = `❌ Failed: ${error.message}`;
    }
  } else {
    results.tests.error = '❌ KV not available - check environment variables';
  }

  // Summary
  const allTestsPassed = Object.values(results.tests).every(test => 
    typeof test === 'string' ? test.startsWith('✅') : test.status?.startsWith('✅')
  );

  results.summary = {
    overall: allTestsPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED',
    recommendation: kvAvailable 
      ? 'Vercel KV is working correctly!' 
      : 'Check your KV_REST_API_URL and KV_REST_API_TOKEN environment variables'
  };

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}
