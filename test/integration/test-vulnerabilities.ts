#!/usr/bin/env tsx
/**
 * Test Suite: Vulnerability Management Tools
 * Tests: list_vulnerabilities, get_vulnerability_details, list_vulnerability_detections,
 *        list_affected_devices, list_affected_software
 */

import { KandjiClient } from '../../src/utils/client.js';
import { listVulnerabilities } from '../../src/tools/list_vulnerabilities.js';
import { getVulnerabilityDetails } from '../../src/tools/get_vulnerability_details.js';
import { listVulnerabilityDetections } from '../../src/tools/list_vulnerability_detections.js';
import { listAffectedDevices } from '../../src/tools/list_affected_devices.js';
import { listAffectedSoftware } from '../../src/tools/list_affected_software.js';
import { loadIruMcpEnv } from '../../src/utils/loadEnv.js';

loadIruMcpEnv();

async function main() {
  console.log('Testing Vulnerability Management Tools');
  console.log('=======================================\n');

  const client = new KandjiClient({
    apiToken: process.env.KANDJI_API_TOKEN || '',
    subdomain: process.env.KANDJI_SUBDOMAIN || '',
    region: (process.env.KANDJI_REGION as 'us' | 'eu') || 'us',
  });

  // Test 1: List all vulnerabilities
  console.log('Test 1: List all vulnerabilities');
  console.log('-'.repeat(40));
  const allVulns = await listVulnerabilities(client, {});
  console.log(`Success: ${allVulns.success}`);
  console.log(`Summary: ${allVulns.summary}`);
  console.log(`Total Vulnerabilities: ${allVulns.metadata?.totalCount}`);
  console.log(`Cached: ${allVulns.metadata?.cached}`);
  console.log(`Duration: ${allVulns.metadata?.elapsedMs}ms\n`);

  // Test 2: List critical vulnerabilities
  console.log('Test 2: Filter by critical severity');
  console.log('-'.repeat(40));
  const criticalVulns = await listVulnerabilities(client, {
    severity: 'critical',
    limit: 5,
  });
  console.log(`Success: ${criticalVulns.success}`);
  console.log(`Summary: ${criticalVulns.summary}`);
  console.log(`Critical Vulnerabilities: ${criticalVulns.metadata?.totalCount}\n`);

  // Test 3: Filter by known exploits
  console.log('Test 3: Filter by known exploits');
  console.log('-'.repeat(40));
  const exploitVulns = await listVulnerabilities(client, {
    known_exploit: true,
    limit: 5,
  });
  console.log(`Success: ${exploitVulns.success}`);
  console.log(`Summary: ${exploitVulns.summary}`);
  console.log(`Exploitable Vulnerabilities: ${exploitVulns.metadata?.totalCount}\n`);

  // Test 4: Get vulnerability details
  if (allVulns.success && allVulns.data.results.length > 0) {
    const cveId = allVulns.data.results[0].cve_id;

    console.log('Test 4: Get vulnerability details');
    console.log('-'.repeat(40));
    console.log(`Testing with CVE ID: ${cveId}`);

    const vulnDetails = await getVulnerabilityDetails(client, { cve_id: cveId });
    console.log(`Success: ${vulnDetails.success}`);
    console.log(`Summary: ${vulnDetails.summary}`);

    if (vulnDetails.table) {
      console.log('\nVulnerability Details:');
      vulnDetails.table.rows.forEach((row: any) => {
        console.log(`  ${row.Field}: ${row.Value}`);
      });
    }
    console.log(`Duration: ${vulnDetails.metadata?.elapsedMs}ms\n`);

    // Test 5: List affected devices
    console.log('Test 5: List affected devices for CVE');
    console.log('-'.repeat(40));
    const affectedDevices = await listAffectedDevices(client, { cve_id: cveId });
    console.log(`Success: ${affectedDevices.success}`);
    console.log(`Summary: ${affectedDevices.summary}`);
    console.log(`Affected Devices: ${affectedDevices.metadata?.totalCount}`);
    console.log(`Duration: ${affectedDevices.metadata?.elapsedMs}ms\n`);

    // Test 6: List affected software
    console.log('Test 6: List affected software for CVE');
    console.log('-'.repeat(40));
    const affectedSoftware = await listAffectedSoftware(client, { cve_id: cveId });
    console.log(`Success: ${affectedSoftware.success}`);
    console.log(`Summary: ${affectedSoftware.summary}`);
    console.log(`Affected Software: ${affectedSoftware.metadata?.totalCount}`);
    console.log(`Duration: ${affectedSoftware.metadata?.elapsedMs}ms\n`);
  }

  // Test 7: List vulnerability detections
  console.log('Test 7: List vulnerability detections');
  console.log('-'.repeat(40));
  const detections = await listVulnerabilityDetections(client, {});
  console.log(`Success: ${detections.success}`);
  console.log(`Summary: ${detections.summary}`);
  console.log(`Total Detections: ${detections.metadata?.totalCount}`);
  console.log(`Duration: ${detections.metadata?.elapsedMs}ms\n`);

  // Test 8: Filter detections by status
  console.log('Test 8: Filter detections by status');
  console.log('-'.repeat(40));
  const openDetections = await listVulnerabilityDetections(client, {
    status: 'open',
    limit: 10,
  });
  console.log(`Success: ${openDetections.success}`);
  console.log(`Summary: ${openDetections.summary}`);
  console.log(`Open Detections: ${openDetections.metadata?.totalCount}\n`);

  // Test 9: Pagination test
  console.log('Test 9: Test pagination');
  console.log('-'.repeat(40));
  const page1 = await listVulnerabilities(client, { limit: 3 });
  console.log(`Success: ${page1.success}`);
  console.log(`Page 1 Results: ${page1.metadata?.totalCount}`);
  console.log(`Has Next Page: ${page1.data.next ? 'Yes' : 'No'}\n`);

  console.log('='.repeat(50));
  console.log('Vulnerability Management Tests Complete');
  console.log('='.repeat(50));
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
