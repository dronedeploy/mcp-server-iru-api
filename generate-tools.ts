#!/usr/bin/env tsx
/**
 * Tool generator script - Creates all remaining MCP tools
 */

import * as fs from 'fs';
import * as path from 'path';

const toolsDir = path.join(process.cwd(), 'src', 'tools');

// Tool definitions
const tools = [
  {
    filename: 'list_users.ts',
    name: 'listUsers',
    description: 'List users from user directory integrations',
    types: 'UserListResponse',
    clientMethod: 'listUsers',
    params: ['email?: string', 'id?: string', 'integration_id?: string', 'archived?: boolean'],
    tableCols: ['Email', 'Name', 'ID', 'Archived'],
    tableRows: `users.results.map(u => ({
          'Email': u.email || 'N/A',
          'Name': u.name || 'N/A',
          'ID': u.id,
          'Archived': u.archived ? 'Yes' : 'No',
        }))`,
    summary: '`Found ${users.results.length} user(s)`',
    cached: false,
  },
  {
    filename: 'get_user.ts',
    name: 'getUser',
    description: 'Get specific user by ID',
    types: 'KandjiUser',
    clientMethod: 'getUser',
    params: ['user_id: string'],
    tableCols: ['Field', 'Value'],
    tableRows: `[
          { 'Field': 'ID', 'Value': user.id },
          { 'Field': 'Email', 'Value': user.email || 'N/A' },
          { 'Field': 'Name', 'Value': user.name || 'N/A' },
          { 'Field': 'Archived', 'Value': user.archived ? 'Yes' : 'No' },
        ]`,
    summary: '`Retrieved user: ${user.email || user.id}`',
    cached: false,
    singleParam: true,
  },
  {
    filename: 'list_vulnerabilities.ts',
    name: 'listVulnerabilities',
    description: 'List all vulnerabilities grouped by CVE',
    types: 'VulnerabilityListResponse',
    clientMethod: 'listVulnerabilities',
    params: ['page?: number', 'size?: number', 'sort_by?: string', 'filter?: string'],
    tableCols: ['CVE ID', 'Severity', 'CVSS Score', 'Device Count', 'Status'],
    tableRows: `vulns.results.map(v => ({
          'CVE ID': v.cve_id,
          'Severity': v.cvss_severity || v.severity || 'N/A',
          'CVSS Score': v.cvss_score?.toString() || 'N/A',
          'Device Count': v.device_count?.toString() || 'N/A',
          'Status': v.status || 'N/A',
        }))`,
    summary: '`Found ${vulns.results.length} vulnerability(ies)`',
    cached: false,
  },
  {
    filename: 'get_vulnerability_details.ts',
    name: 'getVulnerabilityDetails',
    description: 'Get detailed information about a specific CVE',
    types: 'Vulnerability',
    clientMethod: 'getVulnerability',
    params: ['cve_id: string'],
    tableCols: ['Field', 'Value'],
    tableRows: `[
          { 'Field': 'CVE ID', 'Value': vuln.cve_id },
          { 'Field': 'Description', 'Value': vuln.cve_description || 'N/A' },
          { 'Field': 'CVSS Score', 'Value': vuln.cvss_score?.toString() || 'N/A' },
          { 'Field': 'Severity', 'Value': vuln.cvss_severity || vuln.severity || 'N/A' },
          { 'Field': 'Device Count', 'Value': vuln.device_count?.toString() || 'N/A' },
          { 'Field': 'Known Exploit', 'Value': vuln.known_exploit ? 'Yes' : 'No' },
        ]`,
    summary: '`Retrieved details for ${vuln.cve_id}`',
    cached: false,
    singleParam: true,
  },
  {
    filename: 'list_vulnerability_detections.ts',
    name: 'listVulnerabilityDetections',
    description: 'List all vulnerability detections across the device fleet',
    types: 'VulnerabilityDetectionListResponse',
    clientMethod: 'listVulnerabilityDetections',
    params: ['after?: string', 'size?: number', 'filter?: string'],
    tableCols: ['Device', 'CVE ID', 'Software', 'Severity', 'Detection Date'],
    tableRows: `detections.results.map(d => ({
          'Device': d.device_name,
          'CVE ID': d.cve_id,
          'Software': d.name,
          'Severity': d.cvss_severity || 'N/A',
          'Detection Date': d.detection_datetime || 'N/A',
        }))`,
    summary: '`Found ${detections.results.length} detection(s)`',
    cached: false,
  },
  {
    filename: 'list_affected_devices.ts',
    name: 'listAffectedDevices',
    description: 'List devices affected by a specific CVE',
    types: '{ results: AffectedDevice[]; next?: string | null; count?: number }',
    clientMethod: 'listAffectedDevices',
    params: ['cve_id: string', 'page?: number', 'size?: number'],
    tableCols: ['Device Name', 'Serial Number', 'OS Version', 'Software', 'Detection Date'],
    tableRows: `devices.results.map(d => ({
          'Device Name': d.device_name,
          'Serial Number': d.device_serial_number || 'N/A',
          'OS Version': d.device_os_version || 'N/A',
          'Software': d.software_name || 'N/A',
          'Detection Date': d.detection_datetime || 'N/A',
        }))`,
    summary: '`Found ${devices.results.length} affected device(s)`',
    cached: false,
    multiParam: true,
  },
  {
    filename: 'list_affected_software.ts',
    name: 'listAffectedSoftware',
    description: 'List software affected by a specific CVE',
    types: '{ results: AffectedSoftware[]; next?: string | null; count?: number }',
    clientMethod: 'listAffectedSoftware',
    params: ['cve_id: string', 'page?: number', 'size?: number'],
    tableCols: ['Software Name', 'Version', 'Path', 'Device Count'],
    tableRows: `software.results.map(s => ({
          'Software Name': s.name,
          'Version': s.version || 'N/A',
          'Path': s.path || 'N/A',
          'Device Count': s.device_count?.toString() || 'N/A',
        }))`,
    summary: '`Found ${software.results.length} affected software package(s)`',
    cached: false,
    multiParam: true,
  },
  {
    filename: 'list_behavioral_detections.ts',
    name: 'listBehavioralDetections',
    description: 'Get behavioral detections from Kandji threat detection',
    types: 'BehavioralDetection[]',
    clientMethod: 'listBehavioralDetections',
    params: ['threat_id?: string', 'classification?: string', 'status?: string', 'device_id?: string', 'limit?: number'],
    tableCols: ['Threat ID', 'Device', 'Classification', 'Status', 'Detection Date'],
    tableRows: `detections.map(d => ({
          'Threat ID': d.threat_id,
          'Device': d.device_name || 'N/A',
          'Classification': d.classification || 'N/A',
          'Status': d.status || 'N/A',
          'Detection Date': d.detection_date || 'N/A',
        }))`,
    summary: '`Found ${detections.length} behavioral detection(s)`',
    cached: false,
  },
  {
    filename: 'get_threat_details.ts',
    name: 'getThreatDetails',
    description: 'Get detailed threat information',
    types: 'ThreatDetail[]',
    clientMethod: 'getThreatDetails',
    params: ['classification?: string', 'status?: string', 'device_id?: string', 'limit?: number'],
    tableCols: ['Threat Name', 'Device', 'Classification', 'Status', 'Detection Date'],
    tableRows: `threats.map(t => ({
          'Threat Name': t.threat_name,
          'Device': t.device_name || 'N/A',
          'Classification': t.classification,
          'Status': t.status || 'N/A',
          'Detection Date': t.detection_date || 'N/A',
        }))`,
    summary: '`Found ${threats.length} threat(s)`',
    cached: false,
  },
];

// Generate tool file content
function generateToolFile(tool: any): string {
  const varName = tool.name.charAt(0).toLowerCase() + tool.name.slice(1);
  const resultVar = tool.types.includes('[]') ? varName.replace('list', '').replace('get', '') + 's' : varName.replace('get', '');

  let paramsType = '';
  let callParams = '';

  if (tool.singleParam) {
    paramsType = `params: { ${tool.params[0]} }`;
    callParams = 'params.' + tool.params[0].split(':')[0];
  } else if (tool.multiParam) {
    const firstParam = tool.params[0];
    const restParams = tool.params.slice(1);
    paramsType = `params: { ${tool.params.join(', ')} }`;
    callParams = `params.${firstParam.split(':')[0]}, { ${restParams.map((p: string) => p.split(':')[0]).join(', ')} }`;
  } else {
    paramsType = `params: { ${tool.params.join(', ')} }`;
    callParams = 'params';
  }

  return `/**
 * MCP Tool: ${tool.filename.replace('.ts', '')}
 * ${tool.description}
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, ${tool.types.replace(/[{}<>:;]/g, '').split(' ').filter((t: string) => t && !['results', 'next', 'string', 'null', 'number', 'count'].includes(t.toLowerCase())).join(', ')} } from '../utils/types.js';

export async function ${tool.name}(
  client: KandjiClient,
  ${paramsType}
): Promise<MCPResponse<${tool.types}>> {
  const startTime = Date.now();

  try {
    const ${resultVar} = await client.${tool.clientMethod}(${callParams});

    return {
      success: true,
      summary: ${tool.summary},
      table: {
        columns: ${JSON.stringify(tool.tableCols)},
        rows: ${tool.tableRows},
      },
      data: ${resultVar},
      metadata: {
        totalCount: ${tool.types.includes('[]') ? `${resultVar}.length` : tool.types.includes('results') ? `${resultVar}.results.length` : '1'},
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        'Use filters to narrow down results',
        'Check individual items for more details',
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let category: 'validation' | 'auth' | 'rate_limit' | 'network' | 'server' = 'server';
    let recovery: string[] = ['Check Kandji API status'];

    if (errorMessage.includes('Authentication')) {
      category = 'auth';
      recovery = ['Verify KANDJI_API_TOKEN in .env file', 'Regenerate API token in Kandji settings'];
    } else if (errorMessage.includes('Rate limit')) {
      category = 'rate_limit';
      recovery = ['Wait a moment and retry', 'Reduce request frequency'];
    }

    return {
      success: false,
      errors: [{
        category,
        message: errorMessage,
        recovery,
      }],
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
    };
  }
}
`;
}

// Generate all tools
console.log('Generating MCP tool files...\n');

for (const tool of tools) {
  const filePath = path.join(toolsDir, tool.filename);
  const content = generateToolFile(tool);

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Created ${tool.filename}`);
}

console.log(`\n✓ Generated ${tools.length} tool files successfully!`);
