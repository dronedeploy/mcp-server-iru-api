#!/usr/bin/env node
/**
 * Kandji MCP Server
 * AI-driven device management through Model Context Protocol
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
  name: 'execute_device_action',
  description: 'Execute device actions (lock, restart, shutdown, erase). REQUIRES explicit confirmation (confirm=true) for all actions. Erase action is DESTRUCTIVE and will wipe the device.',
  parameters: DeviceActionSchema,
  execute: async (params) => {
    const result = await executeDeviceAction(kandjiClient, params);
    return JSON.stringify(result, null, 2);
  },
});

// Start the server
console.log('Kandji MCP Server starting...');
console.log(`Region: ${process.env.KANDJI_REGION || 'us'}`);
console.log(`PII Redaction: ${process.env.ENABLE_PII_REDACTION === 'true' ? 'Enabled' : 'Disabled'}`);
console.log('Ready to accept requests from Claude Desktop');

server.start({
  transportType: 'stdio',
});
