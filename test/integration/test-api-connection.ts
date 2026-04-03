#!/usr/bin/env tsx
/**
 * Test basic API connectivity
 */

import { KandjiClient } from '../../src/utils/client.js';
import { loadIruMcpEnv } from '../../src/utils/loadEnv.js';

loadIruMcpEnv();

async function testConnection() {
  console.log('Testing Kandji API connection...\n');

  const kandjiClient = new KandjiClient({
    apiToken: process.env.KANDJI_API_TOKEN!,
    subdomain: process.env.KANDJI_SUBDOMAIN!,
    region: (process.env.KANDJI_REGION as 'us' | 'eu') || 'us',
    enablePIIRedaction: false,
  });

  try {
    console.log('1. Testing /blueprints endpoint...');
    const blueprints = await kandjiClient.listBlueprints();
    console.log(`   Success: Found ${blueprints.length} blueprints`);
    console.log();

    console.log('2. Testing /devices endpoint...');
    const devices = await kandjiClient.listDevices({ limit: 5 });
    console.log(`   Success: Found ${devices.length} devices (limited to 5)`);
    console.log();

    console.log('3. Testing /settings/licensing endpoint...');
    try {
      const licensing = await kandjiClient.getLicensing();
      console.log('   Success: Retrieved licensing data');
      console.log('   Raw response:');
      console.log(JSON.stringify(licensing, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   Failed: ${errorMessage}`);

      if (errorMessage.includes('Forbidden')) {
        console.log('\n   Note: 403 Forbidden suggests the API token lacks permissions');
        console.log('   for the /settings/licensing endpoint. This endpoint may require');
        console.log('   admin-level API permissions or may not be available in your');
        console.log('   Kandji plan/version.');
      }
    }

    console.log('\nAPI token is valid and working for basic endpoints.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testConnection();
