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

mkdir -p "${cloudbase_output_dir}"

cd "${cloudbase_server_dir}"

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
	-trimpath \
	-ldflags="-s -w" \
	-o "${cloudbase_output_dir}/xiagu-server" \
	./cmd/server

cp \
	"${cloudbase_script_dir}/scf_bootstrap" \
	"${cloudbase_output_dir}/scf_bootstrap"

chmod 755 \
	"${cloudbase_output_dir}/xiagu-server" \
	"${cloudbase_output_dir}/scf_bootstrap"

echo "CloudBase artifacts: ${cloudbase_output_dir}"