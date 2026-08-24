#!/bin/sh
set -eu

cloudbase_script_dir=$(
	CDPATH= cd -- "$(dirname -- "$0")"
	pwd
)
cloudbase_server_dir=$(
	CDPATH= cd -- "${cloudbase_script_dir}/../.."
	pwd
)
cloudbase_output_dir="${cloudbase_server_dir}/dist/cloudbase"
cloudbase_package="${cloudbase_output_dir}/xiagu-api.zip"
cloudbase_binary="${cloudbase_output_dir}/main"
cloudbase_build_version="${XIAGU_BUILD_VERSION:-$(date -u +%Y%m%dT%H%M%SZ)}"

mkdir -p "${cloudbase_output_dir}"

cd "${cloudbase_server_dir}"

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
	-trimpath \
	-ldflags="-s -w -X xiagu-server/internal/app.BuildVersion=${cloudbase_build_version}" \
	-o "${cloudbase_binary}" \
	./cmd/server

cp \
	"${cloudbase_script_dir}/scf_bootstrap" \
	"${cloudbase_output_dir}/scf_bootstrap"

chmod 755 \
	"${cloudbase_binary}" \
	"${cloudbase_output_dir}/scf_bootstrap"

rm -f "${cloudbase_package}"
(
	cd "${cloudbase_output_dir}"
	zip -q "${cloudbase_package}" scf_bootstrap main
)

echo "CloudBase artifacts: ${cloudbase_output_dir}"
echo "CloudBase upload package: ${cloudbase_package}"
echo "CloudBase build version: ${cloudbase_build_version}"
