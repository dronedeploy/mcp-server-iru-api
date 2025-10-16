#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';

const toolsDir = path.join(process.cwd(), 'src', 'tools');

// Fix patterns for each file
const fixes: Record<string, Array<[string | RegExp, string]>> = {
  'list_users.ts': [
    [/const \w*UserListResponses? = await/, 'const usersResponse = await'],
    [/users\.results/g, 'usersResponse.results'],
    [/data: users,/g, 'data: usersResponse,'],
  ],
  'get_vulnerability_details.ts': [
    [/const Vulnerability = await/, 'const vulnerability = await'],
    [/\${vuln\./g, '${vulnerability.'],
    [/: vuln\./g, ': vulnerability.'],
    [/data: vuln,/g, 'data: vulnerability,'],
  ],
  'list_vulnerabilities.ts': [
    [/const \w*VulnerabilityListResponses? = await/, 'const vulnerabilities = await'],
    [/vulns\.results/g, 'vulnerabilities.results'],
    [/data: vulns,/g, 'data: vulnerabilities,'],
  ],
  'list_vulnerability_detections.ts': [
    [/const \w*VulnerabilityDetectionListResponses? = await/, 'const detectionsResponse = await'],
    [/detections\.results/g, 'detectionsResponse.results'],
    [/data: detections,/g, 'data: detectionsResponse,'],
  ],
};

Object.entries(fixes).forEach(([filename, patterns]) => {
  const filePath = path.join(toolsDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠ Skipping ${filename} (not found)`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  patterns.forEach(([search, replace]) => {
    if (typeof search === 'string') {
      content = content.replace(search, replace);
    } else {
      content = content.replace(search, replace);
    }
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Fixed ${filename}`);
});

console.log('\n✓ All fixes applied!');
