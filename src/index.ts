#!/usr/bin/env node
/**
 * Kandji MCP Server
 * AI-driven device management through Model Context Protocol
 *
 * Note: Kandji rebranded as "Iru" in 2025. This server works with the Iru platform.
 * "Kandji" naming is maintained for API compatibility. See REBRAND.md for details.
 */

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import dotenv from 'dotenv';
import { KandjiClient } from './utils/client.js';
import { searchDevicesByCriteria } from './tools/search_devices_by_criteria.js';
import { getDeviceDetails } from './tools/get_device_details.js';
import { getComplianceSummary } from './tools/get_compliance_summary.js';
import { listBlueprints } from './tools/list_blueprints.js';
import { executeDeviceAction } from './tools/execute_device_action.js';
import { getLicensing } from './tools/get_licensing.js';
import { getTags } from './tools/get_tags.js';
import { listUsers } from './tools/list_users.js';
import { getUser } from './tools/get_user.js';
import { listVulnerabilities } from './tools/list_vulnerabilities.js';
import { getVulnerabilityDetails } from './tools/get_vulnerability_details.js';
import { listVulnerabilityDetections } from './tools/list_vulnerability_detections.js';
import { listAffectedDevices } from './tools/list_affected_devices.js';
import { listAffectedSoftware } from './tools/list_affected_software.js';
import { listBehavioralDetections } from './tools/list_behavioral_detections.js';
import { getThreatDetails } from './tools/get_threat_details.js';
import { getDeviceActivity } from './tools/get_device_activity.js';
import { getDeviceApps } from './tools/get_device_apps.js';
import { getDeviceLibraryItems } from './tools/get_device_library_items.js';
import { getDeviceLostModeDetails } from './tools/get_device_lost_mode_details.js';
import { getDeviceParameters } from './tools/get_device_parameters.js';
import { getDeviceStatus } from './tools/get_device_status.js';
import { listAuditEvents } from './tools/list_audit_events.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['KANDJI_API_TOKEN', 'KANDJI_SUBDOMAIN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
}

// Initialize Kandji client
const kandjiClient = new KandjiClient({
  apiToken: process.env.KANDJI_API_TOKEN!,
  subdomain: process.env.KANDJI_SUBDOMAIN!,
  region: (process.env.KANDJI_REGION as 'us' | 'eu') || 'us',
  enablePIIRedaction: process.env.ENABLE_PII_REDACTION === 'true',
});

// Create FastMCP server
const server = new FastMCP({
  name: 'Kandji MCP Server',
  version: '1.0.0',
});

// Tool schemas
const SearchCriteriaSchema = z.object({
  name: z.string().optional().describe('Filter by device name (partial match)'),
  platform: z.enum(['Mac', 'iPhone', 'iPad', 'AppleTV']).optional().describe('Filter by platform'),
  blueprint_id: z.string().optional().describe('Filter by blueprint UUID'),
});

const DeviceDetailsSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
});

const DeviceActionSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
  action: z.enum(['lock', 'restart', 'shutdown', 'erase']).describe('Action to perform'),
  confirm: z.boolean().describe('Confirmation flag (must be true)'),
  message: z.string().optional().describe('Lock screen message (for lock action only)'),
  pin: z.string().optional().describe('6-digit PIN for erase action on macOS'),
});

// Register tools
server.addTool({
  name: 'search_devices_by_criteria',
  description: 'Filter devices by name, platform, or blueprint. Use this to find devices matching specific criteria.',
  parameters: SearchCriteriaSchema,
  execute: async (params) => {
    const result = await searchDevicesByCriteria(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_device_details',
  description: 'Retrieve detailed information about a specific device by its UUID. Returns hardware specs, software version, user info, and MDM status.',
  parameters: DeviceDetailsSchema,
  execute: async (params) => {
    const result = await getDeviceDetails(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_compliance_summary',
  description: 'Get organization-wide compliance summary showing compliant vs non-compliant devices by platform.',
  parameters: z.object({}),
  execute: async () => {
    const result = await getComplianceSummary(kandjiClient);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'list_blueprints',
  description: 'List all device blueprints in the Kandji tenant. Blueprints define device configurations and policies.',
  parameters: z.object({}),
  execute: async () => {
    const result = await listBlueprints(kandjiClient);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_licensing',
  description: 'Get Kandji tenant licensing and utilization information. Shows total licenses, used licenses, available licenses, and utilization percentage.',
  parameters: z.object({}),
  execute: async () => {
    const result = await getLicensing(kandjiClient);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'execute_device_action',
  description: 'Execute device actions (lock, restart, shutdown, erase). REQUIRES explicit confirmation (confirm=true) for all actions. Erase action is DESTRUCTIVE and will wipe the device.',
  parameters: DeviceActionSchema,
  execute: async (params) => {
    const result = await executeDeviceAction(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_tags',
  description: 'Get configured tags from Kandji. Optionally filter by search term.',
  parameters: z.object({
    search: z.string().optional().describe('Search term to filter tags'),
  }),
  execute: async (params) => {
    const result = await getTags(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'list_users',
  description: 'List users from user directory integrations with optional filtering.',
  parameters: z.object({
    email: z.string().optional().describe('Filter by email containing this string'),
    id: z.string().optional().describe('Search for user by UUID'),
    integration_id: z.string().optional().describe('Filter by integration UUID'),
    archived: z.boolean().optional().describe('Filter by archived status'),
  }),
  execute: async (params) => {
    const result = await listUsers(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_user',
  description: 'Get specific user details by user ID.',
  parameters: z.object({
    user_id: z.string().describe('User UUID'),
  }),
  execute: async (params) => {
    const result = await getUser(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'list_vulnerabilities',
  description: 'List all vulnerabilities grouped by CVE with optional filtering and pagination.',
  parameters: z.object({
    page: z.number().optional().describe('Page number'),
    size: z.number().optional().describe('Results per page (max 50)'),
    sort_by: z.string().optional().describe('Field to sort by (cve_id, cvss_score, device_count, etc.)'),
    filter: z.string().optional().describe('JSON filter string'),
  }),
  execute: async (params) => {
    const result = await listVulnerabilities(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_vulnerability_details',
  description: 'Get detailed information about a specific CVE vulnerability.',
  parameters: z.object({
    cve_id: z.string().describe('CVE ID (e.g., CVE-2024-12345)'),
  }),
  execute: async (params) => {
    const result = await getVulnerabilityDetails(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'list_vulnerability_detections',
  description: 'List all vulnerability detections across the entire device fleet.',
  parameters: z.object({
    after: z.string().optional().describe('Cursor token for pagination'),
    size: z.number().optional().describe('Results per page (max 300)'),
    filter: z.string().optional().describe('JSON filter string'),
  }),
  execute: async (params) => {
    const result = await listVulnerabilityDetections(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'list_affected_devices',
  description: 'List all devices affected by a specific CVE vulnerability.',
  parameters: z.object({
    cve_id: z.string().describe('CVE ID (e.g., CVE-2024-12345)'),
    page: z.number().optional().describe('Page number'),
    size: z.number().optional().describe('Results per page (max 50)'),
  }),
  execute: async (params) => {
    const result = await listAffectedDevices(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'list_affected_software',
  description: 'List all software packages affected by a specific CVE vulnerability.',
  parameters: z.object({
    cve_id: z.string().describe('CVE ID (e.g., CVE-2024-12345)'),
    page: z.number().optional().describe('Page number'),
    size: z.number().optional().describe('Results per page (max 50)'),
  }),
  execute: async (params) => {
    const result = await listAffectedSoftware(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'list_behavioral_detections',
  description: 'Get behavioral threat detections from Kandji security monitoring.',
  parameters: z.object({
    threat_id: z.string().optional().describe('Filter by threat ID'),
    classification: z.string().optional().describe('Filter by classification (e.g., malicious)'),
    status: z.string().optional().describe('Filter by status (e.g., blocked)'),
    device_id: z.string().optional().describe('Filter by device UUID'),
    limit: z.number().optional().describe('Max results (default 1000)'),
  }),
  execute: async (params) => {
    const result = await listBehavioralDetections(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_threat_details',
  description: 'Get detailed threat information with filtering options.',
  parameters: z.object({
    classification: z.string().optional().describe('Filter by classification (malware, pup)'),
    status: z.string().optional().describe('Filter by status (quarantined, not_quarantined, released)'),
    device_id: z.string().optional().describe('Filter by device UUID'),
    limit: z.number().optional().describe('Max results (default 1000)'),
  }),
  execute: async (params) => {
    const result = await getThreatDetails(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_device_activity',
  description: 'Retrieve device activity history for a specific device. Returns recent events and actions performed on the device.',
  parameters: z.object({
    device_id: z.string().uuid().describe('Device UUID'),
    limit: z.number().optional().describe('Maximum number of activity records to return (max 300)'),
    offset: z.number().optional().describe('Starting record to return for pagination'),
  }),
  execute: async (params) => {
    const result = await getDeviceActivity(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_device_apps',
  description: 'Retrieve installed apps for a specific device. For iPhone and iPad, preinstalled Apple apps are not reported.',
  parameters: z.object({
    device_id: z.string().uuid().describe('Device UUID'),
  }),
  execute: async (params) => {
    const result = await getDeviceApps(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_device_library_items',
  description: 'Retrieve library items and their statuses for a specific device. Shows configuration profiles, apps, and scripts with their installation status.',
  parameters: z.object({
    device_id: z.string().uuid().describe('Device UUID'),
  }),
  execute: async (params) => {
    const result = await getDeviceLibraryItems(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_device_lost_mode_details',
  description: 'Retrieve lost mode details for a specific iOS/iPadOS device. Lost Mode is only available for iOS and iPadOS.',
  parameters: z.object({
    device_id: z.string().uuid().describe('Device UUID'),
  }),
  execute: async (params) => {
    const result = await getDeviceLostModeDetails(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_device_parameters',
  description: 'Retrieve parameters and their statuses for a specific macOS device. This endpoint is only applicable to macOS clients. Parameter IDs can be correlated at https://github.com/kandji-inc/support/wiki/Devices-API---Parameter-Correlations',
  parameters: z.object({
    device_id: z.string().uuid().describe('Device UUID'),
  }),
  execute: async (params) => {
    const result = await getDeviceParameters(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'get_device_status',
  description: 'Retrieve full status (parameters and library items) for a specific device. Provides comprehensive view of device compliance and configuration.',
  parameters: z.object({
    device_id: z.string().uuid().describe('Device UUID'),
  }),
  execute: async (params) => {
    const result = await getDeviceStatus(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

server.addTool({
  name: 'list_audit_events',
  description: 'List audit log events from the Kandji Activity module. Returns events for blueprint changes, device lifecycle, admin actions, vulnerability management, and more.',
  parameters: z.object({
    limit: z.number().optional().describe('Maximum number of events to return (max 500)'),
    sort_by: z.string().optional().describe('Sort results by field (e.g., -occurred_at for descending)'),
    start_date: z.string().optional().describe('Filter by start date (YYYY-MM-DD or datetime format)'),
    end_date: z.string().optional().describe('Filter by end date (YYYY-MM-DD or datetime format)'),
    cursor: z.string().optional().describe('Cursor for pagination'),
  }),
  execute: async (params) => {
    const result = await listAuditEvents(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

// Start the server
// Note: console.log is disabled to avoid interfering with MCP stdio protocol
// Use console.error for debugging if needed (it writes to stderr)
server.start({
  transportType: 'stdio',
});
