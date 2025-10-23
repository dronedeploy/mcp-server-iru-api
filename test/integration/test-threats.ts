#!/usr/bin/env tsx
/**
 * Test Suite: Threat Detection Tools
 * Tests: list_behavioral_detections, get_threat_details
 */

import { KandjiClient } from './src/utils/client.js';
import { listBehavioralDetections } from './src/tools/list_behavioral_detections.js';
import { getThreatDetails } from './src/tools/get_threat_details.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing Threat Detection Tools');
  console.log('================================\n');

  const client = new KandjiClient({
    apiToken: process.env.KANDJI_API_TOKEN || '',
    subdomain: process.env.KANDJI_SUBDOMAIN || '',
    region: (process.env.KANDJI_REGION as 'us' | 'eu') || 'us',
  });

  // Test 1: List all behavioral detections
  console.log('Test 1: List all behavioral detections');
  console.log('-'.repeat(40));
  const allDetections = await listBehavioralDetections(client, {});
  console.log(`Success: ${allDetections.success}`);
  console.log(`Summary: ${allDetections.summary}`);
  console.log(`Total Detections: ${allDetections.metadata?.totalCount}`);
  console.log(`Cached: ${allDetections.metadata?.cached}`);
  console.log(`Duration: ${allDetections.metadata?.elapsedMs}ms\n`);

  // Test 2: Filter by status
  console.log('Test 2: Filter by open status');
  console.log('-'.repeat(40));
  const openDetections = await listBehavioralDetections(client, {
    status: 'open',
    limit: 10
  });
  console.log(`Success: ${openDetections.success}`);
  console.log(`Summary: ${openDetections.summary}`);
  console.log(`Open Detections: ${openDetections.metadata?.totalCount}\n`);

  // Test 3: Filter by severity
  console.log('Test 3: Filter by high severity');
  console.log('-'.repeat(40));
  const highSeverity = await listBehavioralDetections(client, {
    severity: 'high',
    limit: 5
  });
  console.log(`Success: ${highSeverity.success}`);
  console.log(`Summary: ${highSeverity.summary}`);
  console.log(`High Severity Detections: ${highSeverity.metadata?.totalCount}\n`);

  // Test 4: Filter by device
  console.log('Test 4: Filter by device ID');
  console.log('-'.repeat(40));
  const deviceDetections = await listBehavioralDetections(client, {
    device_id: 'test-device-id',
    limit: 10
  });
  console.log(`Success: ${deviceDetections.success}`);
  console.log(`Summary: ${deviceDetections.summary}`);
  console.log(`Device-specific Detections: ${deviceDetections.metadata?.totalCount}\n`);

  // Test 5: Get all threat details
  console.log('Test 5: Get all threat details');
  console.log('-'.repeat(40));
  const allThreats = await getThreatDetails(client, {});
  console.log(`Success: ${allThreats.success}`);
  console.log(`Summary: ${allThreats.summary}`);
  console.log(`Total Threats: ${allThreats.metadata?.totalCount}`);
  console.log(`Cached: ${allThreats.metadata?.cached}`);
  console.log(`Duration: ${allThreats.metadata?.elapsedMs}ms\n`);

  // Test 6: Filter threats by classification
  console.log('Test 6: Filter threats by malware classification');
  console.log('-'.repeat(40));
  const malwareThreats = await getThreatDetails(client, {
    classification: 'malware',
    limit: 5
  });
  console.log(`Success: ${malwareThreats.success}`);
  console.log(`Summary: ${malwareThreats.summary}`);
  console.log(`Malware Threats: ${malwareThreats.metadata?.totalCount}\n`);

  // Test 7: Filter threats by status
  console.log('Test 7: Filter threats by quarantined status');
  console.log('-'.repeat(40));
  const quarantinedThreats = await getThreatDetails(client, {
    status: 'quarantined',
    limit: 5
  });
  console.log(`Success: ${quarantinedThreats.success}`);
  console.log(`Summary: ${quarantinedThreats.summary}`);
  console.log(`Quarantined Threats: ${quarantinedThreats.metadata?.totalCount}\n`);

  // Test 8: Filter threats by device
  console.log('Test 8: Filter threats by device ID');
  console.log('-'.repeat(40));
  const deviceThreats = await getThreatDetails(client, {
    device_id: 'test-device-id',
    limit: 10
  });
  console.log(`Success: ${deviceThreats.success}`);
  console.log(`Summary: ${deviceThreats.summary}`);
  console.log(`Device-specific Threats: ${deviceThreats.metadata?.totalCount}\n`);

  // Test 9: Combined filters
  console.log('Test 9: Combined filters (malware + open status)');
  console.log('-'.repeat(40));
  const combinedFilter = await getThreatDetails(client, {
    classification: 'malware',
    status: 'open',
    limit: 5
  });
  console.log(`Success: ${combinedFilter.success}`);
  console.log(`Summary: ${combinedFilter.summary}`);
  console.log(`Matching Threats: ${combinedFilter.metadata?.totalCount}\n`);

  // Test 10: Table output preview
  if (allThreats.success && allThreats.table && allThreats.table.rows.length > 0) {
    console.log('Test 10: Table output preview');
    console.log('-'.repeat(40));
    console.log('Columns:', allThreats.table.columns.join(' | '));
    console.log('\nFirst 3 threats:');
    allThreats.table.rows.slice(0, 3).forEach((row: any, idx: number) => {
      console.log(`\n${idx + 1}. ${row['Threat Name']}`);
      console.log(`   Device: ${row.Device}`);
      console.log(`   Classification: ${row.Classification}`);
      console.log(`   Status: ${row.Status}`);
      console.log(`   Detection Date: ${row['Detection Date']}`);
    });
    console.log();
  }

  console.log('='.repeat(50));
  console.log('Threat Detection Tests Complete');
  console.log('='.repeat(50));
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
