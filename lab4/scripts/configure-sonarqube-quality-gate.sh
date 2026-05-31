#!/usr/bin/env bash
set -euo pipefail

SONAR_HOST_URL="${SONAR_HOST_URL:-}"
SONAR_TOKEN="${SONAR_TOKEN:-}"
PROJECT_KEY="${PROJECT_KEY:-marine-toxicity-devops}"
GATE_NAME="${GATE_NAME:-Lab4 Security Gate}"
GATE_NAME_ENCODED="$(jq -nr --arg value "$GATE_NAME" '$value | @uri')"

if [ -z "$SONAR_HOST_URL" ] || [ -z "$SONAR_TOKEN" ]; then
  echo "SONAR_HOST_URL and SONAR_TOKEN are required"
  exit 1
fi

sonar_api() {
  local method="$1"
  local path="$2"
  shift 2
  curl -fsS -u "${SONAR_TOKEN}:" -X "$method" "${SONAR_HOST_URL}${path}" "$@"
}

GATE_ID="$(sonar_api GET "/api/qualitygates/list" \
  | jq -r --arg name "$GATE_NAME" '.qualitygates[] | select(.name == $name) | .id' \
  | head -1)"

if [ -z "$GATE_ID" ]; then
  GATE_ID="$(sonar_api POST "/api/qualitygates/create" --data-urlencode "name=${GATE_NAME}" | jq -r '.id')"
fi

add_condition() {
  local metric="$1"
  local op="$2"
  local error="$3"

  if sonar_api GET "/api/qualitygates/show?name=${GATE_NAME_ENCODED}" \
    | jq -e --arg metric "$metric" '.conditions[]? | select(.metric == $metric)' >/dev/null; then
    return
  fi

  sonar_api POST "/api/qualitygates/create_condition" \
    --data-urlencode "gateId=${GATE_ID}" \
    --data-urlencode "metric=${metric}" \
    --data-urlencode "op=${op}" \
    --data-urlencode "error=${error}" >/dev/null
}

add_condition coverage LT 80
add_condition bugs GT 0
add_condition vulnerabilities GT 0
add_condition reliability_rating GT 1
add_condition security_rating GT 1
add_condition security_hotspots_reviewed LT 100

sonar_api POST "/api/qualitygates/select" \
  --data-urlencode "projectKey=${PROJECT_KEY}" \
  --data-urlencode "gateId=${GATE_ID}" >/dev/null

echo "Quality gate '${GATE_NAME}' is assigned to project '${PROJECT_KEY}'."
