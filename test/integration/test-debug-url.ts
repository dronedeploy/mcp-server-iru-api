#!/usr/bin/env tsx
/**
 * Debug URL construction and authentication
 */

import { loadIruMcpEnv } from '../../src/utils/loadEnv.js';

loadIruMcpEnv();

console.log('Environment Variables:');
console.log('-'.repeat(60));
console.log(
  `KANDJI_API_TOKEN: ${process.env.KANDJI_API_TOKEN ? `${process.env.KANDJI_API_TOKEN.substring(0, 10)}...` : 'NOT SET'}`
);
console.log(`KANDJI_SUBDOMAIN: ${process.env.KANDJI_SUBDOMAIN || 'NOT SET'}`);
console.log(`KANDJI_REGION: ${process.env.KANDJI_REGION || 'NOT SET (will default to us)'}`);
console.log('-'.repeat(60));
console.log();

// Simulate URL construction
const subdomain = process.env.KANDJI_SUBDOMAIN || 'NOT_SET';
const region = process.env.KANDJI_REGION || 'us';

const baseUrl =
  region === 'eu'
    ? `https://${subdomain}.api.eu.kandji.io/api/v1`
    : `https://${subdomain}.api.kandji.io/api/v1`;

console.log('Constructed Base URL:');
console.log(`  ${baseUrl}`);
console.log();

console.log('Sample endpoint URLs:');
console.log(`  Blueprints: ${baseUrl}/blueprints`);
console.log(`  Devices: ${baseUrl}/devices`);
console.log(`  Licensing: ${baseUrl}/settings/licensing`);
console.log();

// Test a simple fetch to see the actual HTTP response
console.log('Testing direct HTTP request to /blueprints...');
console.log('-'.repeat(60));

const testUrl = `${baseUrl}/blueprints`;
const apiToken = process.env.KANDJI_API_TOKEN;

if (!apiToken) {
  console.error('Error: KANDJI_API_TOKEN not set');
  process.exit(1);
}

try {
  const response = await fetch(testUrl, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log(`Headers:`);
  for (const [key, value] of response.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  console.log();

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`Response body:`);
    console.log(errorText);
  } else {
    const data = await response.json();
    console.log(`Success! Received data:`);
    console.log(JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('Error:', error);
}
