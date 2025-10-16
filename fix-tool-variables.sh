#!/bin/bash
# Quick fix script for variable naming issues in generated tools

cd src/tools

# Fix get_user.ts
sed -i '' 's/const Kand/const /g' get_user.ts
sed -i '' 's/const user = await/const userData = await/g' get_user.ts
sed -i '' 's/user\./userData./g' get_user.ts
sed -i '' 's/data: user/data: userData/g' get_user.ts

# Fix get_vulnerability_details.ts
sed -i '' 's/const Vulnerability = await/const vulnerability = await/g' get_vulnerability_details.ts
sed -i '' 's/vuln\./vulnerability./g' get_vulnerability_details.ts
sed -i '' 's/data: vuln/data: vulnerability/g' get_vulnerability_details.ts

# Fix list_users.ts
sed -i '' 's/const UserListResponses = await/const usersResponse = await/g' list_users.ts
sed -i '' 's/users\./usersResponse./g' list_users.ts
sed -i '' 's/data: users/data: usersResponse/g' list_users.ts

# Fix list_vulnerabilities.ts
sed -i '' 's/const VulnerabilityListResponses = await/const vulnerabilities = await/g' list_vulnerabilities.ts
sed -i '' 's/vulns\./vulnerabilities./g' list_vulnerabilities.ts
sed -i '' 's/data: vulns/data: vulnerabilities/g' list_vulnerabilities.ts

# Fix list_vulnerability_detections.ts
sed -i '' 's/const VulnerabilityDetectionListResponses = await/const detectionsResponse = await/g' list_vulnerability_detections.ts
sed -i '' 's/detections\./detectionsResponse./g' list_vulnerability_detections.ts
sed -i '' 's/data: detections/data: detectionsResponse/g' list_vulnerability_detections.ts

echo "Fixed all variable naming issues!"
