# 《李白·成都寻梦记》TTS音频生成指南

本指南介绍如何使用 GPT-SoVITS 批量生成故事中所有对话的语音。

## 📋 前置准备

### 1. 部署 GPT-SoVITS

首先需要在本地或服务器部署 GPT-SoVITS：

```bash
# 克隆仓库
git clone https://github.com/RVC-Boss/GPT-SoVITS.git
cd GPT-SoVITS

# 安装依赖
pip install -r requirements.txt

# 下载预训练模型（按照官方文档）
```

### 2. 准备参考音频

需要准备一段李白的参考音频（约5-10秒）：
- 格式：WAV
- 采样率：22050Hz 或 24000Hz
- 内容：清晰的李白风格朗读
- 命名：`reference/libai_sample.wav`

**建议文本**：
> "人生得意须尽欢，莫使金樽空对月。"

## 🚀 使用方法

### 方法一：Python 脚本（推荐）

#### 1. 启动 GPT-SoVITS API 服务

```bash
cd GPT-SoVITS
python api.py
```

服务默认启动在 `http://localhost:9880`

#### 2. 运行生成脚本

```bash
cd /Users/lsh/服创代码
python GPT-SoVITS-batch-generate.py
```

#### 3. 查看输出

脚本会在 `output/tts-audio/` 目录下生成：
- `*.wav` - 音频文件（共33个）
- `generation-results.json` - 生成记录
- `audio-urls.json` - 小程序代码可用的URL映射
- `code-snippets.txt` - 可直接复制的代码片段
- `upload-list.csv` - 云存储上传清单

### 方法二：TypeScript 脚本

如果你更熟悉 Node.js：

```bash
cd 首页代码
npm install axios fs-extra
npx ts-node scripts/generate-story-tts.ts
```

## 📤 上传到微信云存储

### 方法一：微信开发者工具（推荐）

1. 打开微信开发者工具
2. 点击"云开发" → "存储"
3. 创建目录：`tts/libai/`
4. 批量上传 `output/tts-audio/` 中的所有 `.wav` 文件

### 方法二：命令行上传

```bash
# 使用微信 CLI 工具（需先安装）
wxcloud storage:upload ./output/tts-audio/*.wav tts/libai/
```

### 方法三：小程序端上传

如果音频文件较多，可以编写一个小程序上传工具页面。

## 🔧 更新故事代码

生成并上传完成后，需要更新故事数据文件：

1. 打开 `code-snippets.txt`
2. 复制其中的代码片段
3. 粘贴到 `src/data/stories/libai-chengdu.ts` 中对应节点的 `ttsAudio` 字段

示例：
```typescript
'prologue-start': {
  id: 'prologue-start',
  type: 'dialog',
  dialog: {
    speaker: '李白',
    content: '少侠，欢迎来到锦官城！...',
    emotion: 'happy',
    ttsAudio: 'cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai/libai_happy_8f3a2b1c.wav'
  },
  // ...
}
```

## 🎵 音频参数说明

每个音频文件命名格式：`libai_{情感}_{哈希}.wav`

| 情感 | 速度 | 温度 | 适用场景 |
|------|------|------|----------|
| normal | 1.0 | 0.7 | 普通对话 |
| happy | 1.1 | 0.75 | 愉快、欢迎 |
| excited | 1.15 | 0.8 | 激动、热血 |
| thoughtful | 0.9 | 0.65 | 沉思、感慨 |
| sad | 0.85 | 0.6 | 悲伤、遗憾 |

## 🔧 自定义配置

编辑脚本顶部的 `Config` 类：

```python
@dataclass
class Config:
    # GPT-SoVITS API 地址
    TTS_API_URL: str = "http://localhost:9880"
    
    # 参考音频路径
    REFERENCE_AUDIO: str = "reference/libai_sample.wav"
    
    # 参考音频对应的文本
    REFERENCE_TEXT: str = "人生得意须尽欢，莫使金樽空对月。"
    
    # 输出目录
    OUTPUT_DIR: str = "./output/tts-audio"
    
    # 并发数（根据你的GPU性能调整）
    CONCURRENT_LIMIT: int = 3
```

## 🐛 常见问题

### 1. API 连接失败

**问题**：`Connection refused` 或 `Connection timeout`

**解决**：
- 确认 GPT-SoVITS API 服务已启动
- 检查 `TTS_API_URL` 配置是否正确
- 检查防火墙设置

### 2. 生成音频质量不佳

**解决**：
- 更换更好的参考音频
- 调整情感参数（速度、温度）
- 确保参考音频与目标文本风格一致

### 3. 某些文本生成失败

**解决**：
- 检查文本长度（建议不超过100字）
- 检查是否包含特殊字符
- 手动重新生成失败的条目

### 4. 上传到云存储失败

**解决**：
- 确认云存储空间充足
- 检查文件大小（单个文件不超过 50MB）
- 使用微信开发者工具手动上传

## 📊 生成统计

《李白·成都寻梦记》共包含：
- **33** 条对话
- **5** 个章节
- **5** 种情感类型
- 预计总音频时长：**~8-10 分钟**
- 预计总文件大小：**~15-20 MB**

## 🔗 相关文件

- 故事数据：`src/data/stories/libai-chengdu.ts`
- TTS服务：`src/services/story-tts.ts`
- 对话组件：`src/components/story-dialog/`
- Python脚本：`GPT-SoVITS-batch-generate.py`
- TS脚本：`首页代码/scripts/generate-story-tts.ts`

## 📞 技术支持

- GPT-SoVITS 官方文档：https://github.com/RVC-Boss/GPT-SoVITS
- 微信小程序云存储文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/storage.html
