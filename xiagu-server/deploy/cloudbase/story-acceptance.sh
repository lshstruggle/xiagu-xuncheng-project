#!/bin/sh
set -eu

: "${API_BASE:?API_BASE is required}"
: "${TOKEN_A:?TOKEN_A is required}"

STORY_ID="${STORY_ID:-libai-chengdu}"
MODE="${STORY_MODE:-explore}"

request() {
	method=$1
	path=$2
	body=${3-}

	if [ -n "$body" ]; then
		curl -sS \
			-X "$method" "$API_BASE$path" \
			-H "Authorization: Bearer $TOKEN_A" \
			-H "Content-Type: application/json" \
			--data-binary "$body"
	else
		curl -sS \
			-X "$method" "$API_BASE$path" \
			-H "Authorization: Bearer $TOKEN_A"
	fi
}

assert_jq() {
	label=$1
	response=$2
	condition=$3
	if ! printf '%s' "$response" | jq -e "$condition" >/dev/null; then
		printf '\n[%s] failed\n' "$label" >&2
		printf '%s\n' "$response" | jq . >&2
		exit 1
	fi
}

progress=$(request GET "/api/v1/story/$STORY_ID/progress?mode=$MODE")
assert_jq "load progress" "$progress" \
	'.code == 0 and .data.status == "ongoing" and .data.revision >= 1'
initial_revision=$(printf '%s' "$progress" | jq -r '.data.revision')
initial_node=$(printf '%s' "$progress" | jq -r '.data.current_node_id')

pause_body=$(jq -nc --arg mode "$MODE" --argjson revision "$initial_revision" \
	'{mode:$mode, revision:$revision}')
paused=$(request POST "/api/v1/story/$STORY_ID/pause" "$pause_body")
assert_jq "pause" "$paused" \
	'.code == 0 and .data.status == "paused" and .data.revision == ('"$initial_revision"' + 1)'
paused_revision=$(printf '%s' "$paused" | jq -r '.data.revision')

stale_resume_body=$(jq -nc --arg mode "$MODE" --argjson revision "$initial_revision" \
	'{mode:$mode, revision:$revision}')
stale_resume=$(request POST "/api/v1/story/$STORY_ID/resume" "$stale_resume_body")
assert_jq "stale resume conflict" "$stale_resume" '.code == 409'

resume_body=$(jq -nc --arg mode "$MODE" --argjson revision "$paused_revision" \
	'{mode:$mode, revision:$revision}')
resumed=$(request POST "/api/v1/story/$STORY_ID/resume" "$resume_body")
assert_jq "resume" "$resumed" \
	'.code == 0 and .data.status == "ongoing" and .data.revision == ('"$paused_revision"' + 1)'
resumed_revision=$(printf '%s' "$resumed" | jq -r '.data.revision')

advance_body=$(jq -nc --arg mode "$MODE" --argjson revision "$resumed_revision" \
	'{mode:$mode, revision:$revision}')
advanced=$(request POST "/api/v1/story/$STORY_ID/advance" "$advance_body")
assert_jq "advance" "$advanced" \
	'.code == 0 and .data.status == "ongoing" and .data.revision == ('"$resumed_revision"' + 1) and .data.current_node_id != "'"$initial_node"'"'
advanced_revision=$(printf '%s' "$advanced" | jq -r '.data.revision')
advanced_node=$(printf '%s' "$advanced" | jq -r '.data.current_node_id')

stale_advance=$(request POST "/api/v1/story/$STORY_ID/advance" "$advance_body")
assert_jq "stale advance conflict" "$stale_advance" '.code == 409'

idempotent_start=$(request POST "/api/v1/story/$STORY_ID/start" \
	"$(jq -nc --arg mode "$MODE" '{hero_id:"libai", mode:$mode}')")
assert_jq "idempotent start" "$idempotent_start" \
	'.code == 0 and .data.revision == '"$advanced_revision"' and .data.current_node_id == "'"$advanced_node"'"'

jq -n \
	--arg story_id "$STORY_ID" \
	--arg initial_node "$initial_node" \
	--arg advanced_node "$advanced_node" \
	--argjson initial_revision "$initial_revision" \
	--argjson final_revision "$advanced_revision" \
	--argjson stale_resume_code "$(printf '%s' "$stale_resume" | jq -r '.code')" \
	--argjson stale_advance_code "$(printf '%s' "$stale_advance" | jq -r '.code')" \
	'{
		result: "PASS",
		story_id: $story_id,
		progress: {
			initial_node: $initial_node,
			advanced_node: $advanced_node,
			initial_revision: $initial_revision,
			final_revision: $final_revision
		},
		checks: {
			pause_resume: "PASS",
			stale_resume_code: $stale_resume_code,
			advance: "PASS",
			stale_advance_code: $stale_advance_code,
			start_idempotency: "PASS"
		}
	}'
