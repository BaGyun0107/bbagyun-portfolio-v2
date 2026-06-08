#!/usr/bin/env bash
# Filter passing test noise while keeping failures, summaries, and diagnostics.
# Pipe usage: test_command 2>&1 | bash .harness/hooks/filter-test-output.sh
# Bypass: CODI_TEST_FILTER=0

if [[ "${CODI_TEST_FILTER:-1}" == "0" ]]; then
  cat
  exit 0
fi

awk '
  /^[[:space:]]*[✓√✔][[:space:]]/ { next }
  /^[[:space:]]*PASS[[:space:]]/ { next }
  /^--- PASS:/ { next }
  /^[[:space:]]*ok[[:space:]]+[a-zA-Z]/ { next }
  /PASSED[[:space:]]*$/ { next }
  /^test .+ \.\.\. ok$/ { next }
  /^[0-9][0-9]:[0-9][0-9] \+[0-9]+: / && !/\-[0-9]+/ && !/All tests/ { next }
  /Test Case .* passed/ { next }
  /^[[:space:]]*Passed[[:space:]]/ && !/Passed!/ { next }
  /^[[:space:]]*Tests run:.*Failures: 0.*Errors: 0/ { next }
  /^[.]+$/ { next }
  /^[.]+[[:space:]]*$/ { next }
  { print }
'
