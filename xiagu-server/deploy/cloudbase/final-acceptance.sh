#!/bin/sh
set -eu

: "${API_BASE:?API_BASE is required}"
: "${TOKEN_A:?TOKEN_A is required}"
: "${ADMIN_USERNAME:?ADMIN_USERNAME is required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"

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

user_request() {
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

admin_request() {
	path=$1
	curl -sS "$API_BASE$path" \
		-H "Authorization: Bearer $admin_token"
}

health=$(curl -sS "$API_BASE/health")
ready=$(curl -sS "$API_BASE/ready")
assert_json "health" "$health" '.status == "ok"'
assert_json "readiness" "$ready" \
	'.status == "ready" and .database == "ok"'

# Invalid contact data must be rejected before any database write.
invalid_merch=$(user_request POST "/api/v1/merch/order" \
	'{"hero_id":"libai","name":"李","phone":"123456","address":"短地址"}')
assert_json "invalid merchandise contact" "$invalid_merch" '.code == 400'

# A deliberately nonexistent hero can never be eligible, so this safely checks
# the CloudBase user lookup and eligibility path without creating an order.
ineligible_merch=$(user_request POST "/api/v1/merch/order" \
	'{"hero_id":"acceptance_no_hero","name":"验收用户","phone":"13800138000","address":"四川省成都市验收地址一号"}')
assert_json "ineligible merchandise claim" "$ineligible_merch" '.code == 409'

unauthorized_admin=$(curl -sS "$API_BASE/api/v1/admin/profile")
assert_json "admin authentication required" "$unauthorized_admin" '.code == 401'

admin_login=$(jq -nc \
	--arg username "$ADMIN_USERNAME" \
	--arg password "$ADMIN_PASSWORD" \
	'{username:$username,password:$password,remember:false}' | \
	curl -sS -X POST "$API_BASE/api/v1/admin/login" \
		-H "Content-Type: application/json" \
		--data-binary @-)
assert_json "admin login" "$admin_login" \
	'.code == 0 and (.data.token | type == "string" and length > 0)'
admin_token=$(printf '%s' "$admin_login" | jq -r '.data.token')

admin_profile=$(admin_request "/api/v1/admin/profile")
admin_pois=$(admin_request "/api/v1/admin/pois?page=1&page_size=10")
admin_routes=$(admin_request "/api/v1/admin/routes?page=1&page_size=10")
assert_json "admin profile" "$admin_profile" \
	'.code == 0 and (.data.username | length) > 0'
assert_json "admin POI list" "$admin_pois" \
	'.code == 0 and .data.total >= 32 and (.data.list | type == "array")'
assert_json "admin route list" "$admin_routes" \
	'.code == 0 and .data.total >= 3 and (.data.list | type == "array")'

jq -n \
	--arg admin_username "$(printf '%s' "$admin_profile" | jq -r '.data.username')" \
	--argjson poi_total "$(printf '%s' "$admin_pois" | jq -r '.data.total')" \
	--argjson route_total "$(printf '%s' "$admin_routes" | jq -r '.data.total')" \
	'{
		result:"PASS",
		merchandise:{
			invalid_contact_code:400,
			ineligible_claim_code:409,
			order_created:false
		},
		admin:{
			unauthorized_code:401,
			login:"PASS",
			profile:"PASS",
			username:$admin_username,
			poi_total:$poi_total,
			route_total:$route_total
		}
	}'
