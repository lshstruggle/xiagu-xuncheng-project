# 快速生成 TTS 音频（3步完成）

## 第1步：启动 GPT-SoVITS 服务

```bash
cd GPT-SoVITS
python api.py
```

确认服务运行在 `http://localhost:9880`

---

## 第2步：运行生成脚本

```bash
# 在服创代码目录下
python GPT-SoVITS-batch-generate.py
```

等待生成完成（约 5-10 分钟）

---

## 第3步：上传并更新代码

### 上传音频到云存储

1. 打开微信开发者工具
2. 云开发 → 存储 → 创建文件夹 `tts/libai/`
3. 上传 `output/tts-audio/*.wav` 文件

### 更新代码

1. 打开 `output/tts-audio/code-snippets.txt`
2. 复制内容
3. 粘贴到 `首页代码/src/data/stories/libai-chengdu.ts` 对应节点

---

## 完成！🎉

现在打开小程序测试，故事对话应该会自动播放语音了。

---

##  Troubleshooting

| 问题 | 解决 |
|------|------|
| API连接失败 | 检查 GPT-SoVITS 是否已启动 |
| 生成质量差 | 更换更好的参考音频 |
| 上传失败 | 检查云存储空间和文件大小 |
| 小程序不播放 | 检查云存储路径是否正确 |

---

## 文件位置速查

```
服创代码/
├── GPT-SoVITS-batch-generate.py    # 生成脚本
├── TTS生成指南.md                   # 详细指南
├── output/tts-audio/                # 生成输出
│   ├── *.wav                        # 音频文件
│   ├── audio-urls.json              # URL映射
│   └── code-snippets.txt            # 代码片段
└── 首页代码/
    └── src/
        └── data/
            └── stories/
                └── libai-chengdu.ts  # 故事数据（需更新）
```
