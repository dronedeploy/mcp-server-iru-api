#!/usr/bin/env tsx
/**
 * Iru/Kandji API Verification Script
 *
 * This script verifies that your API token has the correct permissions
 * and that the API is accessible from your environment.
 *
 * Usage:
 *   npx tsx troubleshooting/verify-api-access.ts
 *
 * Prerequisites:
 *   - ~/dev/.secrets/kandji.env (or repo .env) with KANDJI_API_TOKEN and KANDJI_SUBDOMAIN
 *   - Node.js 18 or higher
 */

import { KandjiClient } from '../src/utils/client.js';
import { loadIruMcpEnv } from '../src/utils/loadEnv.js';

loadIruMcpEnv();

interface TestResult {
  endpoint: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: any;
  requiredScope?: string;
}

class APIVerifier {
  private client: KandjiClient;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    const apiToken = process.env.KANDJI_API_TOKEN;
    const subdomain = process.env.KANDJI_SUBDOMAIN;
    const region = process.env.KANDJI_REGION || 'us';

    if (!apiToken || !subdomain) {
      console.error('❌ Error: Missing required environment variables');
      console.error(
        '   Please ensure KANDJI_API_TOKEN and KANDJI_SUBDOMAIN are set in ~/dev/.secrets/kandji.env or .env'
      );
      process.exit(1);
    }

    this.client = new KandjiClient({
      apiToken,
      subdomain,
      region: region as 'us' | 'eu',
    });

    console.log('🔍 Iru/Kandji API Verification Tool');
    console.log('=====================================\n');
    console.log(`Subdomain: ${subdomain}`);
    console.log(`Region: ${region.toUpperCase()}`);
    console.log(`Base URL: https://${subdomain}.api${region === 'eu' ? '.eu' : ''}.kandji.io/api/v1\n`);
  }

  private addResult(result: TestResult) {
    this.results.push(result);

    const icons = {
      PASS: '✅',
      FAIL: '❌',
      WARN: '⚠️',
      SKIP: '⏭️',
    };

    const statusColors = {
      PASS: '\x1b[32m', // Green
      FAIL: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      SKIP: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';

    console.log(
      `${icons[result.status]} ${statusColors[result.status]}[${result.status}]${reset} ${result.endpoint}`
    );
    console.log(`   ${result.description}`);
    console.log(`   ${result.message}`);
    if (result.requiredScope) {
      console.log(`   Required Scope: ${result.requiredScope}`);
    }
    if (result.details && result.status === 'PASS') {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
    }
    console.log('');
  }

  private categorizeError(error: Error): { category: string; isPermissionIssue: boolean } {
    const message = error.message.toLowerCase();

    if (message.includes('authentication failed') || message.includes('401')) {
      return { category: 'authentication', isPermissionIssue: false };
    } else if (message.includes('permission denied') || message.includes('403') || message.includes('forbidden')) {
      return { category: 'permission', isPermissionIssue: true };
    } else if (message.includes('not found') || message.includes('404')) {
      return { category: 'not_found', isPermissionIssue: false };
    } else if (message.includes('rate limit') || message.includes('429')) {
      return { category: 'rate_limit', isPermissionIssue: false };
    } else if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused')) {
      return { category: 'network', isPermissionIssue: false };
    } else {
      return { category: 'unknown', isPermissionIssue: false };
    }
  }

  private enhanceErrorMessage(error: Error, scope: string): string {
    const { category, isPermissionIssue } = this.categorizeError(error);
    const scopeHint = isPermissionIssue ? ` - API token is missing the "${scope}" permission scope` : '';
    return `${error.message}${scopeHint}`;
  }

  async testDevicesList(): Promise<void> {
    const scope = 'Read: Devices';
    try {
      const devices = await this.client.listDevices({ limit: 1 });
      this.addResult({
        endpoint: '/devices',
        description: 'List devices',
        status: 'PASS',
        message: `Successfully retrieved ${devices.length} device(s)`,
        details: { deviceCount: devices.length },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/devices',
        description: 'List devices',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testDeviceDetails(): Promise<void> {
    try {
      // First get a device ID
      const devices = await this.client.listDevices({ limit: 1 });

      if (devices.length === 0) {
        this.addResult({
          endpoint: '/devices/{id}',
          description: 'Get device details',
          status: 'SKIP',
          message: 'No devices available to test',
          requiredScope: 'Read: Devices',
        });
        return;
      }

      const deviceId = devices[0].device_id;
      const device = await this.client.getDevice(deviceId);

      this.addResult({
        endpoint: '/devices/{id}',
        description: 'Get device details',
        status: 'PASS',
        message: `Retrieved details for device: ${device.device_name || deviceId}`,
        details: {
          deviceId: device.device_id,
          deviceName: device.device_name,
          platform: device.platform,
        },
        requiredScope: 'Read: Devices',
      });
    } catch (error: any) {
      const scope = 'Read: Devices';
      this.addResult({
        endpoint: '/devices/{id}',
        description: 'Get device details',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testBlueprints(): Promise<void> {
    const scope = 'Read: Blueprints';
    try {
      const blueprints = await this.client.listBlueprints();
      this.addResult({
        endpoint: '/blueprints',
        description: 'List blueprints',
        status: 'PASS',
        message: `Successfully retrieved ${blueprints.length} blueprint(s)`,
        details: { blueprintCount: blueprints.length },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/blueprints',
        description: 'List blueprints',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testCompliance(): Promise<void> {
    const scope = 'Read: Prism';
    try {
      const data = await this.client.getPrismDeviceInfo({ platform: 'Mac' });
      this.addResult({
        endpoint: '/prism/device_information',
        description: 'Get compliance data',
        status: 'PASS',
        message: `Successfully retrieved compliance data for ${data.length} device(s)`,
        details: { deviceCount: data.length },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/prism/device_information',
        description: 'Get compliance data',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testLicensing(): Promise<void> {
    const scope = 'Read: Settings';
    try {
      const licensing = await this.client.getLicensing();
      this.addResult({
        endpoint: '/settings/licensing',
        description: 'Get licensing information',
        status: 'PASS',
        message: `License: ${licensing.tier} - ${licensing.available_licenses}/${licensing.total_licenses} available`,
        details: {
          tier: licensing.tier,
          totalLicenses: licensing.total_licenses,
          availableLicenses: licensing.available_licenses,
        },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/settings/licensing',
        description: 'Get licensing information',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testUsers(): Promise<void> {
    const scope = 'Read: Users';
    try {
      const response = await this.client.listUsers();
      this.addResult({
        endpoint: '/users',
        description: 'List users',
        status: 'PASS',
        message: `Successfully retrieved ${response.results.length} user(s)`,
        details: { userCount: response.results.length },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/users',
        description: 'List users',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testTags(): Promise<void> {
    const scope = 'Read: Tags';
    try {
      const tags = await this.client.getTags();
      this.addResult({
        endpoint: '/tags',
        description: 'Get tags',
        status: 'PASS',
        message: `Successfully retrieved ${tags.length} tag(s)`,
        details: { tagCount: tags.length },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/tags',
        description: 'Get tags',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testVulnerabilities(): Promise<void> {
    const scope = 'Read: Vulnerability Management';
    try {
      const response = await this.client.listVulnerabilities({ size: 1 });
      this.addResult({
        endpoint: '/vulnerability-management/vulnerabilities',
        description: 'List vulnerabilities',
        status: 'PASS',
        message: `Successfully retrieved vulnerability data (${response.count} total CVEs)`,
        details: { totalCVEs: response.count },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/vulnerability-management/vulnerabilities',
        description: 'List vulnerabilities',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testBehavioralDetections(): Promise<void> {
    const scope = 'Read: Threat Details';
    try {
      const detections = await this.client.listBehavioralDetections({ limit: 1 });
      this.addResult({
        endpoint: '/behavioral-detections',
        description: 'List behavioral detections',
        status: 'PASS',
        message: `Successfully retrieved ${detections.length} detection(s)`,
        details: { detectionCount: detections.length },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/behavioral-detections',
        description: 'List behavioral detections',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testThreatDetails(): Promise<void> {
    const scope = 'Read: Threat Details';
    try {
      const threats = await this.client.getThreatDetails({ limit: 1 });
      this.addResult({
        endpoint: '/threat-details',
        description: 'Get threat details',
        status: 'PASS',
        message: `Successfully retrieved ${threats.length} threat(s)`,
        details: { threatCount: threats.length },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/threat-details',
        description: 'Get threat details',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  async testAuditEvents(): Promise<void> {
    const scope = 'Read: Audit Logs';
    try {
      const response = await this.client.listAuditEvents({ limit: 1 });
      this.addResult({
        endpoint: '/audit/events',
        description: 'List audit events',
        status: 'PASS',
        message: `Successfully retrieved ${response.results.length} audit event(s)`,
        details: { eventCount: response.results.length },
        requiredScope: scope,
      });
    } catch (error: any) {
      this.addResult({
        endpoint: '/audit/events',
        description: 'List audit events',
        status: 'FAIL',
        message: this.enhanceErrorMessage(error, scope),
        requiredScope: scope,
      });
    }
  }

  printSummary(): void {
    const elapsed = Date.now() - this.startTime;
    const pass = this.results.filter(r => r.status === 'PASS').length;
    const fail = this.results.filter(r => r.status === 'FAIL').length;
    const warn = this.results.filter(r => r.status === 'WARN').length;
    const skip = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log('\n=====================================');
    console.log('📊 Summary');
    console.log('=====================================\n');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${pass}`);
    console.log(`❌ Failed: ${fail}`);
    console.log(`⚠️  Warnings: ${warn}`);
    console.log(`⏭️  Skipped: ${skip}`);
    console.log(`⏱️  Time: ${elapsed}ms\n`);

    if (fail > 0) {
      console.log('⚠️  Some API endpoints failed. Common issues:\n');
      console.log('1. API Token Permissions: Ensure your token has the required scopes');
      console.log('2. Subscription Tier: Some features require specific Kandji/Iru subscription tiers');
      console.log('3. Network Access: Verify firewall rules allow access to *.api.kandji.io');
      console.log('4. Token Expiration: Check if your API token is still valid\n');
      console.log('To generate a new API token:');
      console.log('  1. Log in to your Iru/Kandji tenant');
      console.log('  2. Navigate to Settings → Access');
      console.log('  3. Click "Add API Token"');
      console.log('  4. Grant the necessary scopes (see failed tests above)\n');
    } else if (pass === total) {
      console.log('✅ All API endpoints are accessible! Your configuration is correct.\n');
    }

    if (fail > 0) {
      // Categorize failures
      const authFailures = this.results.filter(
        r => r.status === 'FAIL' && r.message.toLowerCase().includes('authentication failed')
      );
      const permissionFailures = this.results.filter(
        r =>
          r.status === 'FAIL' &&
          (r.message.toLowerCase().includes('permission denied') ||
            r.message.toLowerCase().includes('forbidden') ||
            r.message.toLowerCase().includes('missing the'))
      );
      const otherFailures = this.results.filter(
        r =>
          r.status === 'FAIL' &&
          !authFailures.includes(r) &&
          !permissionFailures.includes(r)
      );

      if (authFailures.length > 0) {
        console.log('🔐 Authentication Failures:');
        console.log('   Your API token is invalid or expired.\n');
        authFailures.forEach(r => {
          console.log(`  - ${r.endpoint}`);
        });
        console.log('\n   Fix: Regenerate your API token in Settings → Access\n');
      }

      if (permissionFailures.length > 0) {
        console.log('🔒 Permission/Scope Failures:');
        console.log('   Your API token is missing required permission scopes.\n');
        permissionFailures.forEach(r => {
          console.log(`  - ${r.endpoint}`);
          console.log(`    Missing: ${r.requiredScope}`);
        });
        console.log('\n   Fix: Edit your API token in Settings → Access and grant these scopes:\n');
        const uniqueScopes = [...new Set(permissionFailures.map(r => r.requiredScope))];
        uniqueScopes.forEach(scope => {
          console.log(`     [ ] ${scope}`);
        });
        console.log('');
      }

      if (otherFailures.length > 0) {
        console.log('❓ Other Failures:');
        otherFailures.forEach(r => {
          console.log(`  - ${r.endpoint} (${r.requiredScope})`);
          console.log(`    Error: ${r.message}`);
        });
        console.log('');
      }

      process.exit(1);
    }
  }

  async runAll(): Promise<void> {
    this.startTime = Date.now();

    console.log('Running API tests...\n');

    // Core endpoints - most common
    await this.testDevicesList();
    await this.testDeviceDetails();
    await this.testBlueprints();
    await this.testCompliance();
    await this.testLicensing();

    // User management
    await this.testUsers();
    await this.testTags();

    // Security endpoints
    await this.testVulnerabilities();
    await this.testBehavioralDetections();
    await this.testThreatDetails();

    // Audit
    await this.testAuditEvents();

    this.printSummary();
  }
}

// Run the verification
const verifier = new APIVerifier();
verifier.runAll().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
