#!/bin/bash
#
# Master Test Runner for Kandji MCP Server
# Runs all test suites and generates summary report
#

echo "=========================================="
echo "Kandji MCP Server - Test Suite Runner"
echo "=========================================="
echo ""
echo "Start Time: $(date)"
echo ""

# Track test results
PASSED=0
FAILED=0
TOTAL=0

# Function to run a test suite
run_test() {
  local test_name=$1
  local test_file=$2

  echo ""
  echo "Running: $test_name"
  echo "------------------------------------------"

  if npx tsx "$test_file"; then
    echo "[PASS] $test_name"
    PASSED=$((PASSED + 1))
  else
    echo "[FAIL] $test_name"
    FAILED=$((FAILED + 1))
  fi

  TOTAL=$((TOTAL + 1))
}

# Run all test suites
run_test "Tags Management" "test-tags.ts"
run_test "User Management" "test-users.ts"
run_test "Vulnerability Management" "test-vulnerabilities.ts"
run_test "Threat Detection" "test-threats.ts"
run_test "Comprehensive Suite" "test-all-tools.ts"

# Print summary
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "Total Test Suites: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Success Rate: $(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")%"
echo ""
echo "End Time: $(date)"
echo "=========================================="

# Exit with error code if any tests failed
if [ $FAILED -gt 0 ]; then
  exit 1
fi

exit 0
