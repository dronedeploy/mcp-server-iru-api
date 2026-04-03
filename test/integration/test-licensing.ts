#!/usr/bin/env tsx
/**
 * Quick test script for get_licensing tool
 * Run with: npx tsx test-licensing.ts
 */

import { KandjiClient } from '../../src/utils/client.js';
import { getLicensing } from '../../src/tools/get_licensing.js';
import { loadIruMcpEnv } from '../../src/utils/loadEnv.js';

loadIruMcpEnv();

const requiredEnvVars = ['KANDJI_API_TOKEN', 'KANDJI_SUBDOMAIN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    console.error(
      'Use ~/dev/.secrets/kandji.env (or ~/.secrets/kandji.env) or a repo .env — see .env.example.'
    );
    process.exit(1);
  }
}

async function testGetLicensing() {
  console.log('='.repeat(60));
  console.log('Testing get_licensing tool');
  console.log('='.repeat(60));
  console.log();

  // Initialize Kandji client
  const kandjiClient = new KandjiClient({
    apiToken: process.env.KANDJI_API_TOKEN!,
    subdomain: process.env.KANDJI_SUBDOMAIN!,
    region: (process.env.KANDJI_REGION as 'us' | 'eu') || 'us',
    enablePIIRedaction: process.env.ENABLE_PII_REDACTION === 'true',
  });

  console.log(`Region: ${process.env.KANDJI_REGION || 'us'}`);
  console.log(`Subdomain: ${process.env.KANDJI_SUBDOMAIN}`);
  console.log(
    `PII Redaction: ${process.env.ENABLE_PII_REDACTION === 'true' ? 'Enabled' : 'Disabled'}`
  );
  console.log();

  try {
    console.log('Calling get_licensing tool...');
    console.log();

    const startTime = Date.now();
    const result = await getLicensing(kandjiClient);
    const elapsedTime = Date.now() - startTime;

    console.log('='.repeat(60));
    console.log('RESULT');
    console.log('='.repeat(60));
    console.log();

    if (result.success) {
      console.log('Success: true');
      console.log(`Summary: ${result.summary}`);
      console.log(`Elapsed: ${elapsedTime}ms`);
      console.log(`Cached: ${result.metadata?.cached ? 'Yes' : 'No'}`);
      console.log();

      if (result.table) {
        console.log('Table Data:');
        console.log('-'.repeat(60));
        console.log(`| ${'Metric'.padEnd(30)} | ${'Value'.padEnd(25)} |`);
        console.log('-'.repeat(60));
        result.table.rows.forEach(row => {
          console.log(`| ${row.Metric.padEnd(30)} | ${row.Value.padEnd(25)} |`);
        });
        console.log('-'.repeat(60));
        console.log();
      }

      if (result.data) {
        console.log('Raw API Response:');
        console.log(JSON.stringify(result.data, null, 2));
        console.log();
      }

      if (result.suggestions && result.suggestions.length > 0) {
        console.log('Suggestions:');
        result.suggestions.forEach((suggestion, i) => {
          console.log(`  ${i + 1}. ${suggestion}`);
        });
        console.log();
      }

      console.log('='.repeat(60));
      console.log('Test completed successfully!');
      console.log('='.repeat(60));
    } else {
      console.log('Success: false');
      console.log();

      if (result.errors && result.errors.length > 0) {
        console.log('Errors:');
        result.errors.forEach((error, i) => {
          console.log(`  Error ${i + 1}:`);
          console.log(`    Category: ${error.category}`);
          console.log(`    Message: ${error.message}`);
          console.log(`    Recovery Steps:`);
          error.recovery.forEach((step, j) => {
            console.log(`      ${j + 1}. ${step}`);
          });
          console.log();
        });
      }

      console.log('='.repeat(60));
      console.log('Test failed - see errors above');
      console.log('='.repeat(60));
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error during test:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testGetLicensing();
