# CloudStudio 李白 TTS 部署与验收

本目录只包含网关配置；模型、缓存、密钥均不提交仓库。CloudStudio 的工作空间休眠时，CloudBase 自动返回文字模式，不需要回滚小程序。

## 1. 打包并上传（在本机执行）

```bash
cd /Users/lsh
tar -czf /tmp/xiagu-tts-deploy.tar.gz xiagu-xuncheng-project/tts_server.py xiagu-xuncheng-project/tts-deploy
# 用 CloudStudio 的文件上传功能上传 /tmp/xiagu-tts-deploy.tar.gz，或替换为你的 SSH 主机：
scp /tmp/xiagu-tts-deploy.tar.gz <cloudstudio-user>@<cloudstudio-host>:/workspace/
```

## 2. 在 CloudStudio 解包并配置（不把密钥保存进 Git）

```bash
cd /workspace
tar -xzf xiagu-tts-deploy.tar.gz
mkdir -p /workspace/.data/{tts-cache,logs}
python3 -m venv /workspace/venv
/workspace/venv/bin/pip install -r /workspace/xiagu-xuncheng-project/tts-deploy/requirements.txt
openssl rand -base64 48
cp /workspace/xiagu-xuncheng-project/tts-deploy/xiagu-tts.env.example /workspace/.data/xiagu-tts.env
chmod 600 /workspace/.data/xiagu-tts.env
```

将随机命令的输出同时填入 `/workspace/.data/xiagu-tts.env` 和 CloudBase 的 `TTS_SHARED_SECRET`。该环境文件至少设置：

```text
GPT_SOVITS_ROOT=/workspace/GPT-SoVITS
TTS_MODEL_DIR=/workspace/models/libai
TTS_CACHE_DIR=/workspace/.data/tts-cache
TTS_SHARED_SECRET=<随机密钥>
TTS_DEVICE=cuda
TTS_HALF=true
TTS_MODEL_VERSION=libai-v3
```

如果工作空间路径不同，只改环境变量，不改 Python 源码。

## 3. 启动 Nginx 和 Supervisor

```bash
sudo cp /workspace/xiagu-xuncheng-project/tts-deploy/supervisor.conf /etc/supervisor/conf.d/xiagu-tts.conf
sudo cp /workspace/xiagu-xuncheng-project/tts-deploy/nginx.conf /etc/nginx/conf.d/xiagu-tts.conf
sudo nginx -t && sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl status xiagu-tts
```

将 CloudStudio 的公开 HTTPS 端口指向 Nginx 的 80 端口。只暴露 `/health`、`/ready`、`/tts`；不要公开 Gunicorn 的 9881 端口。

## 4. 先验证服务，再配置 CloudBase

```bash
export TTS_URL='https://<你的-cloudstudio-tts-https-入口>'
export TTS_SHARED_SECRET='<刚生成的随机密钥>'
curl -fsS "$TTS_URL/health"
curl -fsS "$TTS_URL/ready"
curl -fsS -X POST "$TTS_URL/tts" \
  -H "Authorization: Bearer $TTS_SHARED_SECRET" \
  -H 'Content-Type: application/json' \
  --data '{"text":"大河之剑，天上来。"}' \
  -o /tmp/libai-smoke.wav
file /tmp/libai-smoke.wav
unset TTS_SHARED_SECRET
```

`/ready` 返回 200 后，才在 CloudBase 环境变量中设置：

```text
TTS_ENABLED=true
TTS_BASE_URL=https://<你的-cloudstudio-tts-https-入口>
TTS_SHARED_SECRET=<相同随机密钥>
TTS_TIMEOUT=90s
TTS_MAX_SEGMENT_RUNES=35
```

关闭 `TTS_ENABLED` 并重新部署 CloudBase 函数即可回滚到纯文字。
