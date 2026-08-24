#!/bin/sh
set -eu

: "${API_BASE:?API_BASE is required}"
: "${TOKEN_A:?TOKEN_A is required}"
: "${CLOUDBASE_ENV_ID:?CLOUDBASE_ENV_ID is required}"
: "${CLOUDBASE_API_KEY:?CLOUDBASE_API_KEY is required}"

collection_prefix=${CLOUDBASE_COLLECTION_PREFIX:-test_}
database_instance=${CLOUDBASE_DATABASE_INSTANCE:-\(default\)}
database_name=${CLOUDBASE_DATABASE_NAME:-\(default\)}
database_url="https://${CLOUDBASE_ENV_ID}.api.tcloudbasegateway.com/v1/database/instances/${database_instance}/databases/${database_name}/commands"

api_request() {
	method=$1
	path=$2
	body=${3-}
	if [ -n "$body" ]; then
		curl -sS -X "$method" "$API_BASE$path" \
			-H "Authorization: Bearer $TOKEN_A" \
			-H "Content-Type: application/json" \
			--data-binary "$body"
	else
		curl -sS -X "$method" "$API_BASE$path" \
			-H "Authorization: Bearer $TOKEN_A"
	fi
}

database_commands() {
	curl -sS -X POST "$database_url" \
		-H "Authorization: Bearer $CLOUDBASE_API_KEY" \
		-H "Content-Type: application/json" \
		--data-binary "$1"
}

assert_json() {
	label=$1
	response=$2
	condition=$3
	if ! printf '%s' "$response" | jq -e "$condition" >/dev/null; then
		printf '\n[%s] failed\n' "$label" >&2
		printf '%s\n' "$response" | jq . >&2
		exit 1
	fi
}

profile=$(api_request GET "/api/v1/user/profile")
assets_before=$(api_request GET "/api/v1/user/assets")
items_before=$(api_request GET "/api/v1/shop/items")
assert_json "profile" "$profile" '.code == 0 and (.data.id | length) > 0'
assert_json "assets before" "$assets_before" '.code == 0'
assert_json "shop items" "$items_before" \
	'.code == 0 and ([.data[] | select(.is_owned == false)] | length) > 0'

user_id=$(printf '%s' "$profile" | jq -r '.data.id')
hero_before=$(printf '%s' "$assets_before" | jq -r '.data.hero_fragments')
skin_before=$(printf '%s' "$assets_before" | jq -r '.data.skin_fragments')
item_id=$(printf '%s' "$items_before" | jq -r \
	'[.data[] | select(.is_owned == false)][0].id')
item_cost=$(printf '%s' "$items_before" | jq -r \
	'[.data[] | select(.is_owned == false)][0].cost')
inventory_id="${user_id}:${item_id}"
users_collection="${collection_prefix}users"
inventory_collection="${collection_prefix}user_inventory"

restore_test_data() {
	restore_body=$(jq -nc \
		--arg users "$users_collection" \
		--arg inventory "$inventory_collection" \
		--arg oid "$user_id" \
		--arg inventory_id "$inventory_id" \
		--arg hero "$hero_before" \
		--arg skin "$skin_before" \
		'{commands:[
			{update:$users, updates:[{
				q:{_id:{"$oid":$oid}},
				u:{"$set":{
					hero_fragments:{"$numberInt":$hero},
					skin_fragments:{"$numberInt":$skin}
				}},
				upsert:false,
				multi:false
			}]},
			{delete:$inventory, deletes:[{q:{_id:$inventory_id},limit:1}]}
		]}')
	database_commands "$restore_body" >/dev/null || true
}

cleanup_required=1
trap 'if [ "$cleanup_required" = 1 ]; then restore_test_data; fi' EXIT HUP INT TERM

grant_body=$(jq -nc \
	--arg collection "$users_collection" \
	--arg oid "$user_id" \
	--arg hero "$((hero_before + item_cost))" \
	--arg skin "$((skin_before + item_cost))" \
	'{commands:[{update:$collection, updates:[{
		q:{_id:{"$oid":$oid}},
		u:{"$set":{
			hero_fragments:{"$numberInt":$hero},
			skin_fragments:{"$numberInt":$skin}
		}},
		upsert:false,
		multi:false
	}]}]}')
grant_response=$(database_commands "$grant_body")
assert_json "temporary shop balance" "$grant_response" \
	'(.code == null) and .list[0][0].nModified."$numberInt" == "1"'

exchange=$(api_request POST "/api/v1/shop/exchange" \
	"$(jq -nc --arg item_id "$item_id" '{item_id:$item_id}')")
assert_json "shop exchange" "$exchange" \
	'.code == 0 and .data.success == true'

assets_after_exchange=$(api_request GET "/api/v1/user/assets")
assert_json "shop committed balance" "$assets_after_exchange" \
	'.code == 0 and .data.hero_fragments >= 0 and .data.skin_fragments >= 0'

duplicate_exchange=$(api_request POST "/api/v1/shop/exchange" \
	"$(jq -nc --arg item_id "$item_id" '{item_id:$item_id}')")
assert_json "duplicate shop exchange" "$duplicate_exchange" '.code == 409'
assets_after_duplicate=$(api_request GET "/api/v1/user/assets")
if [ "$assets_after_exchange" != "$assets_after_duplicate" ]; then
	printf '\n[duplicate shop balance] failed\n' >&2
	exit 1
fi

restore_test_data
cleanup_required=0
trap - EXIT HUP INT TERM

assets_restored=$(api_request GET "/api/v1/user/assets")
assert_json "restored shop balance" "$assets_restored" \
	'.code == 0 and .data.hero_fragments == '"$hero_before"' and .data.skin_fragments == '"$skin_before"

# Six simultaneous calls exercise the atomic 5-per-minute limiter without
# depending on transactional reads. Use a unique mode so the session is
# isolated and will be removed later by its TTL index.
acceptance_mode="acceptance-$(date -u +%Y%m%d%H%M%S)"
response_dir=$(mktemp -d "${TMPDIR:-/tmp}/xiagu-ai-acceptance.XXXXXX")
cleanup_responses() {
	find "$response_dir" -type f -delete 2>/dev/null || true
	rmdir "$response_dir" 2>/dev/null || true
}
trap cleanup_responses EXIT HUP INT TERM

request_number=1
while [ "$request_number" -le 6 ]; do
	body=$(jq -nc \
		--arg mode "$acceptance_mode" \
		--arg message "云端验收请求 ${request_number}" \
		'{hero_id:"libai",message:$message,mode:$mode,city_code:"CD",need_tts:false}')
	(
		api_request POST "/api/v1/ai/chat" "$body" >"$response_dir/$request_number.json"
	) &
	request_number=$((request_number + 1))
done
wait

success_count=0
limited_count=0
request_number=1
while [ "$request_number" -le 6 ]; do
	response=$(cat "$response_dir/$request_number.json")
	code=$(printf '%s' "$response" | jq -r '.code')
	case "$code" in
	0)
		assert_json "AI text response $request_number" "$response" \
			'.data.reply | type == "string" and length > 0'
		assert_json "AI TTS disabled $request_number" "$response" \
			'.data.audio_ready == false and (.data.audio_base64 == null)'
		success_count=$((success_count + 1))
		;;
	429)
		limited_count=$((limited_count + 1))
		;;
	*)
		printf '\n[AI request %s] unexpected response\n' "$request_number" >&2
		printf '%s\n' "$response" | jq . >&2
		exit 1
		;;
	esac
	request_number=$((request_number + 1))
done

if [ "$success_count" -ne 5 ] || [ "$limited_count" -ne 1 ]; then
	printf '\n[AI rate limit] expected 5 successes and 1 limit; got %s and %s\n' \
		"$success_count" "$limited_count" >&2
	exit 1
fi

cleanup_responses
trap - EXIT HUP INT TERM

jq -n \
	--arg item_id "$item_id" \
	--argjson hero_before "$hero_before" \
	--argjson skin_before "$skin_before" \
	--argjson ai_successes "$success_count" \
	--argjson ai_limited "$limited_count" \
	'{
		result:"PASS",
		shop:{
			item_id:$item_id,
			exchange:"PASS",
			duplicate_exchange_code:409,
			test_data_restored:true,
			assets:{hero_fragments:$hero_before,skin_fragments:$skin_before}
		},
		ai:{
			text_only:"PASS",
			concurrent_successes:$ai_successes,
			rate_limited:$ai_limited,
			minute_limit:"PASS"
		}
	}'
