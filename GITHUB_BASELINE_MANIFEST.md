# GitHub 基线版本说明

本仓库基线包含项目源码、说明文档、数据库初始化数据和常规静态素材。

为避免泄露密钥以及超过 GitHub 常规仓库限制，以下本地资源不进入 Git：

- `xiagu-server/configs/config.yaml` 与小程序私有配置；请从 `config.example.yaml` 创建本地配置。
- `GPT-SoVITS/`、`models/` 以及 `.ckpt`、`.pth`、`.onnx` 等模型权重和运行时文件。
- `node_modules/`、构建产物、Python 缓存、日志、TTS 缓存和批量生成输出。
- 大型原始视频和压缩包。

这些资源继续保存在开发机器上。模型与大型媒体如需异地备份，应使用对象存储、发布附件或独立的 Git LFS 仓库，不应直接提交到源码仓库。
