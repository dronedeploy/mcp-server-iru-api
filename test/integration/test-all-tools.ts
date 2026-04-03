#!/usr/bin/env tsx
/**
 * Comprehensive Test Suite for All New Kandji MCP Tools
 * Tests all 10 newly implemented API endpoints
 */

import { KandjiClient } from '../../src/utils/client.js';
import { getTags } from '../../src/tools/get_tags.js';
import { listUsers } from '../../src/tools/list_users.js';
import { getUser } from '../../src/tools/get_user.js';
import { listVulnerabilities } from '../../src/tools/list_vulnerabilities.js';
import { getVulnerabilityDetails } from '../../src/tools/get_vulnerability_details.js';
import { listVulnerabilityDetections } from '../../src/tools/list_vulnerability_detections.js';
import { listAffectedDevices } from '../../src/tools/list_affected_devices.js';
import { listAffectedSoftware } from '../../src/tools/list_affected_software.js';
import { listBehavioralDetections } from '../../src/tools/list_behavioral_detections.js';
import { getThreatDetails } from '../../src/tools/get_threat_details.js';
import { loadIruMcpEnv } from '../../src/utils/loadEnv.js';

loadIruMcpEnv();

interface TestResult {
  tool: string;
  success: boolean;
  duration: number;
  error?: string;
  summary?: string;
}

const results: TestResult[] = [];

async function runTest(toolName: string, testFn: () => Promise<any>): Promise<void> {
  const startTime = Date.now();

  try {
    console.log(`\n[${'='.repeat(60)}]`);
    console.log(`Testing: ${toolName}`);
    console.log(`[${'='.repeat(60)}]`);

    const result = await testFn();
    const duration = Date.now() - startTime;

    if (result.success) {
      console.log(`\n[SUCCESS] ${toolName}`);
      console.log(`Summary: ${result.summary}`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Cached: ${result.metadata?.cached || false}`);
      console.log(`Total Count: ${result.metadata?.totalCount || 'N/A'}`);

      if (result.table) {
        console.log(`\nTable Preview (first 3 rows):`);
        console.log(`Columns: ${result.table.columns.join(' | ')}`);
        result.table.rows.slice(0, 3).forEach((row: any, idx: number) => {
          console.log(`Row ${idx + 1}: ${JSON.stringify(row)}`);
        });
      }

      results.push({
        tool: toolName,
        success: true,
        duration,
        summary: result.summary,
      });
    } else {
      console.log(`\n[FAILED] ${toolName}`);
      console.log(`Errors: ${JSON.stringify(result.errors, null, 2)}`);

      results.push({
        tool: toolName,
        success: false,
        duration,
        error: result.errors?.[0]?.message || 'Unknown error',
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log(`\n[ERROR] ${toolName}`);
    console.log(`Exception: ${errorMessage}`);

    results.push({
      tool: toolName,
      success: false,
      duration,
      error: errorMessage,
    });
  }
}

async function main() {
  console.log('Kandji MCP Server - Comprehensive Test Suite');
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.KANDJI_SUBDOMAIN || 'NOT SET'}`);

  // Initialize client
  const client = new KandjiClient({
    apiToken: process.env.KANDJI_API_TOKEN || '',
    subdomain: process.env.KANDJI_SUBDOMAIN || '',
    region: (process.env.KANDJI_REGION as 'us' | 'eu') || 'us',
  });

  // Test 1: Get Tags
  await runTest('get_tags', async () => {
    return await getTags(client, {});
  });

  // Test 2: Get Tags with Search Filter
  await runTest('get_tags (with search)', async () => {
    return await getTags(client, { search: 'test' });
  });

  // Test 3: List Users
  await runTest('list_users', async () => {
    return await listUsers(client, {});
  });

  // Test 4: List Users with Filter
  await runTest('list_users (archived)', async () => {
    return await listUsers(client, { archived: false });
  });

  // Test 5: Get Specific User (requires user_id from previous test)
  await runTest('get_user', async () => {
    // First get a user ID from list
    const userList = await listUsers(client, {});
    if (userList.success && userList.data.results.length > 0) {
      const userId = userList.data.results[0].id;
      return await getUser(client, { user_id: userId });
    }
    return { success: false, errors: [{ message: 'No users found to test with' }] };
  });

  // Test 6: List Vulnerabilities
  await runTest('list_vulnerabilities', async () => {
    return await listVulnerabilities(client, {});
  });

  // Test 7: List Vulnerabilities with Filters
  await runTest('list_vulnerabilities (critical)', async () => {
    return await listVulnerabilities(client, {
      severity: 'critical',
      limit: 10,
    });
  });

  // Test 8: Get Vulnerability Details (requires CVE ID)
  await runTest('get_vulnerability_details', async () => {
    // First get a CVE from list
    const vulnList = await listVulnerabilities(client, { limit: 1 });
    if (vulnList.success && vulnList.data.results.length > 0) {
      const cveId = vulnList.data.results[0].cve_id;
      return await getVulnerabilityDetails(client, { cve_id: cveId });
    }
    return { success: false, errors: [{ message: 'No vulnerabilities found to test with' }] };
  });

  // Test 9: List Vulnerability Detections
  await runTest('list_vulnerability_detections', async () => {
    return await listVulnerabilityDetections(client, {});
  });

  // Test 10: List Vulnerability Detections with Filters
  await runTest('list_vulnerability_detections (filtered)', async () => {
    return await listVulnerabilityDetections(client, {
      status: 'open',
      limit: 10,
    });
  });

  // Test 11: List Affected Devices (requires CVE ID)
  await runTest('list_affected_devices', async () => {
    const vulnList = await listVulnerabilities(client, { limit: 1 });
    if (vulnList.success && vulnList.data.results.length > 0) {
      const cveId = vulnList.data.results[0].cve_id;
      return await listAffectedDevices(client, { cve_id: cveId });
    }
    return { success: false, errors: [{ message: 'No vulnerabilities found to test with' }] };
  });

  // Test 12: List Affected Software (requires CVE ID)
  await runTest('list_affected_software', async () => {
    const vulnList = await listVulnerabilities(client, { limit: 1 });
    if (vulnList.success && vulnList.data.results.length > 0) {
      const cveId = vulnList.data.results[0].cve_id;
      return await listAffectedSoftware(client, { cve_id: cveId });
    }
    return { success: false, errors: [{ message: 'No vulnerabilities found to test with' }] };
  });

  // Test 13: List Behavioral Detections
  await runTest('list_behavioral_detections', async () => {
    return await listBehavioralDetections(client, {});
  });

  // Test 14: List Behavioral Detections with Filters
  await runTest('list_behavioral_detections (filtered)', async () => {
    return await listBehavioralDetections(client, {
      status: 'open',
      limit: 10,
    });
  });

  // Test 15: Get Threat Details
  await runTest('get_threat_details', async () => {
    return await getThreatDetails(client, {});
  });

  // Test 16: Get Threat Details with Filters
  await runTest('get_threat_details (filtered)', async () => {
    return await getThreatDetails(client, {
      classification: 'malware',
      status: 'quarantined',
      limit: 10,
    });
  });

  // Print Summary Report
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('TEST SUITE SUMMARY');
  console.log(`${'='.repeat(80)}`);

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
  console.log(`Average Duration: ${avgDuration.toFixed(0)}ms`);

  console.log(`\nDetailed Results:`);
  results.forEach((result, idx) => {
    const status = result.success ? '[PASS]' : '[FAIL]';
    console.log(`${idx + 1}. ${status} ${result.tool} (${result.duration}ms)`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\nEnd Time: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error running test suite:', error);
  process.exit(1);
});
