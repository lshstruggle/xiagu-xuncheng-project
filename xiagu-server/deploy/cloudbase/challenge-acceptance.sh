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

profile_before=$(api_request GET "/api/v1/user/profile")
assets_before=$(api_request GET "/api/v1/user/assets")
assert_json "profile before" "$profile_before" '.code == 0 and (.data.id | length) > 0'
assert_json "assets before" "$assets_before" '.code == 0'

user_id=$(printf '%s' "$profile_before" | jq -r '.data.id')
hero_before=$(printf '%s' "$assets_before" | jq -r '.data.hero_fragments')
skin_before=$(printf '%s' "$assets_before" | jq -r '.data.skin_fragments')
bond_before=$(printf '%s' "$profile_before" | jq -r '.data.hero_bonds.libai.bond_value // 0')
posters_before=$(printf '%s' "$profile_before" | jq -c '.data.boss_posters // []')
progress_id="${user_id}:boss:zhuzai"
users_collection="${collection_prefix}users"
progress_collection="${collection_prefix}challenge_progress"

restore_test_data() {
	restore_body=$(jq -nc \
		--arg users "$users_collection" \
		--arg progress "$progress_collection" \
		--arg oid "$user_id" \
		--arg progress_id "$progress_id" \
		--arg hero "$hero_before" \
		--arg skin "$skin_before" \
		--arg bond "$bond_before" \
		--argjson posters "$posters_before" \
		'{commands:[
			{update:$users, updates:[{
				q:{_id:{"$oid":$oid}},
				u:{"$set":{
					hero_fragments:{"$numberInt":$hero},
					skin_fragments:{"$numberInt":$skin},
					"hero_bonds.libai.bond_value":{"$numberInt":$bond},
					boss_posters:$posters
				}},
				upsert:false,
				multi:false
			}]},
			{delete:$progress,deletes:[{q:{_id:$progress_id},limit:1}]}
		]}')
	database_commands "$restore_body" >/dev/null || true
}

cleanup_required=1
trap 'if [ "$cleanup_required" = 1 ]; then restore_test_data; fi' EXIT HUP INT TERM

far_response=$(api_request POST "/api/v1/challenge/boss/complete" \
	'{"boss_id":"zhuzai","mode":"quiz","score":4,"hero_id":"libai","user_lat":31,"user_lng":105}')
assert_json "boss distance" "$far_response" '.code == 400'

unfinished_response=$(api_request POST "/api/v1/challenge/boss/complete" \
	'{"boss_id":"zhuzai","mode":"quiz","score":3,"hero_id":"libai","user_lat":30.669,"user_lng":104.054}')
assert_json "boss completion threshold" "$unfinished_response" '.code == 409'

complete_response=$(api_request POST "/api/v1/challenge/boss/complete" \
	'{"boss_id":"zhuzai","mode":"quiz","score":4,"hero_id":"libai","user_lat":30.669,"user_lng":104.054}')
assert_json "boss completion" "$complete_response" \
	'.code == 0 and .data.success == true and
	 .data.reward.hero_fragments == 5 and
	 .data.reward.skin_fragments == 3 and
	 .data.reward.bond_value == 30 and
	 .data.reward.poster_id == "boss_zhuzai_poster"'

profile_after=$(api_request GET "/api/v1/user/profile")
assets_after=$(api_request GET "/api/v1/user/assets")
assert_json "boss asset reward" "$assets_after" \
	'.code == 0 and .data.hero_fragments == '"$((hero_before + 5))"' and .data.skin_fragments == '"$((skin_before + 3))"
assert_json "boss bond and poster reward" "$profile_after" \
	'.code == 0 and .data.hero_bonds.libai.bond_value == '"$((bond_before + 30))"' and
	 ((.data.boss_posters // []) | index("boss_zhuzai_poster") != null)'

progress=$(api_request GET "/api/v1/challenge/progress")
assert_json "challenge progress" "$progress" \
	'.code == 0 and ([.data[] | select(.challenge_id == "zhuzai" and .completed_count == 1)] | length) == 1'

duplicate_response=$(api_request POST "/api/v1/challenge/boss/complete" \
	'{"boss_id":"zhuzai","mode":"quiz","score":4,"hero_id":"libai","user_lat":30.669,"user_lng":104.054}')
assert_json "boss cooldown" "$duplicate_response" '.code == 409'

assets_after_duplicate=$(api_request GET "/api/v1/user/assets")
if [ "$assets_after" != "$assets_after_duplicate" ]; then
	printf '\n[boss duplicate reward] assets changed during cooldown\n' >&2
	exit 1
fi

restore_test_data
cleanup_required=0
trap - EXIT HUP INT TERM

profile_restored=$(api_request GET "/api/v1/user/profile")
assets_restored=$(api_request GET "/api/v1/user/assets")
assert_json "restored assets" "$assets_restored" \
	'.code == 0 and .data.hero_fragments == '"$hero_before"' and .data.skin_fragments == '"$skin_before"
assert_json "restored bond and posters" "$profile_restored" \
	'.code == 0 and .data.hero_bonds.libai.bond_value == '"$bond_before"' and .data.boss_posters == '"$posters_before"

jq -n \
	--argjson hero_before "$hero_before" \
	--argjson skin_before "$skin_before" \
	--argjson bond_before "$bond_before" \
	'{
		result:"PASS",
		challenge:{
			distance_rejection:400,
			unfinished_rejection:409,
			completion:"PASS",
			cooldown_rejection:409,
			atomic_reward:"PASS",
			progress_persisted:"PASS",
			test_data_restored:true
		},
		restored:{
			hero_fragments:$hero_before,
			skin_fragments:$skin_before,
			libai_bond:$bond_before
		}
	}'
