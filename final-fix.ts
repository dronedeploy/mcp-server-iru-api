#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

const toolsDir = path.join(process.cwd(), 'src', 'tools');

// Fix list_users.ts
const listUsersPath = path.join(toolsDir, 'list_users.ts');
let listUsers = fs.readFileSync(listUsersPath, 'utf-8');
listUsers = listUsers.replace(/const \w+ = await client\.listUsers/, 'const usersResponse = await client.listUsers');
listUsers = listUsers.replace(/Found \$\{[^}]+\.results\.length\}/, 'Found ${usersResponse.results.length}');
listUsers = listUsers.replace(/usersResponse\.results\.map\(u =>/g, 'usersResponse.results.map((u: any) =>');
listUsers = listUsers.replace(/data: [^,]+,\s*metadata/s, 'data: usersResponse,\n      metadata');
fs.writeFileSync(listUsersPath, listUsers, 'utf-8');
console.log('✓ Fixed list_users.ts');

// Fix get_vulnerability_details.ts
const getVulnPath = path.join(toolsDir, 'get_vulnerability_details.ts');
let getVuln = fs.readFileSync(getVulnPath, 'utf-8');
getVuln = getVuln.replace(/const \w+ = await client\.getVulnerability/, 'const vulnerability = await client.getVulnerability');
getVuln = getVuln.replace(/Retrieved details for \$\{[^}]+\}/g, 'Retrieved details for ${vulnerability.cve_id}');
getVuln = getVuln.replace(/'Value':[^\n]+cve_id[^\n]+/g, "'Value': vulnerability.cve_id");
getVuln = getVuln.replace(/'Value':[^\n]+cve_description[^\n]+/g, "'Value': vulnerability.cve_description || 'N/A'");
getVuln = getVuln.replace(/'Value':[^\n]+cvss_score[^\n]+/g, "'Value': vulnerability.cvss_score?.toString() || 'N/A'");
getVuln = getVuln.replace(/'Value':[^\n]+cvss_severity[^\n]+/g, "'Value': vulnerability.cvss_severity || vulnerability.severity || 'N/A'");
getVuln = getVuln.replace(/'Value':[^\n]+device_count[^\n]+/g, "'Value': vulnerability.device_count?.toString() || 'N/A'");
getVuln = getVuln.replace(/'Value':[^\n]+known_exploit[^\n]+/g, "'Value': vulnerability.known_exploit ? 'Yes' : 'No'");
getVuln = getVuln.replace(/data: [^,]+,\s*metadata/s, 'data: vulnerability,\n      metadata');
fs.writeFileSync(getVulnPath, getVuln, 'utf-8');
console.log('✓ Fixed get_vulnerability_details.ts');

// Fix list_vulnerabilities.ts
const listVulnPath = path.join(toolsDir, 'list_vulnerabilities.ts');
let listVuln = fs.readFileSync(listVulnPath, 'utf-8');
listVuln = listVuln.replace(/const \w+ = await client\.listVulnerabilities/, 'const vulnerabilities = await client.listVulnerabilities');
listVuln = listVuln.replace(/Found \$\{[^}]+\.results\.length\}/, 'Found ${vulnerabilities.results.length}');
listVuln = listVuln.replace(/vulnerabilities\.results\.map\(v =>/g, 'vulnerabilities.results.map((v: any) =>');
listVuln = listVuln.replace(/data: [^,]+,\s*metadata/s, 'data: vulnerabilities,\n      metadata');
fs.writeFileSync(listVulnPath, listVuln, 'utf-8');
console.log('✓ Fixed list_vulnerabilities.ts');

// Fix list_vulnerability_detections.ts
const listDetPath = path.join(toolsDir, 'list_vulnerability_detections.ts');
let listDet = fs.readFileSync(listDetPath, 'utf-8');
listDet = listDet.replace(/const \w+ = await client\.listVulnerabilityDetections/, 'const detectionsResponse = await client.listVulnerabilityDetections');
listDet = listDet.replace(/Found \$\{[^}]+\.results\.length\}/, 'Found ${detectionsResponse.results.length}');
listDet = listDet.replace(/detectionsResponse\.results\.map\(d =>/g, 'detectionsResponse.results.map((d: any) =>');
listDet = listDet.replace(/data: [^,]+,\s*metadata/s, 'data: detectionsResponse,\n      metadata');
fs.writeFileSync(listDetPath, listDet, 'utf-8');
console.log('✓ Fixed list_vulnerability_detections.ts');

// Fix client.ts unused import
const clientPath = path.join(process.cwd(), 'src', 'utils', 'client.ts');
let client = fs.readFileSync(clientPath, 'utf-8');
client = client.replace(/  VulnerabilityDetection,\n/g, '');
fs.writeFileSync(clientPath, client, 'utf-8');
console.log('✓ Fixed client.ts');

console.log('\n✓ All final fixes applied!');
