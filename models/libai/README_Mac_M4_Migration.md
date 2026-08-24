# 峡谷寻城记 - 李白 TTS 模型迁移指南 (Windows -> Mac M4)

这份指南将帮助你在搭载 Apple Silicon (M4) 芯片的 Mac 上部署已训练好的李白语音模型。

## 1. 准备文件

你需要将以下文件从 Windows 电脑复制到 Mac：

1.  **模型文件夹**: `D:\音频素材\models\libai` 整个文件夹复制过去。
    *   里面应包含 `gpt.ckpt`, `sovits.pth`, `reference.wav`, `reference_text.txt` 以及 `api_usage_mac.py`。
2.  **推理脚本 (Web界面)**: `D:\音频素材\run_libai.py` 复制过去 (可选)。
3.  **GPT-SoVITS 核心代码**: `D:\音频素材\GPT-SoVITS` 整个文件夹复制过去。
    *   *提示*: 如果觉得太大，也可以只复制 `GPT_SoVITS` 子目录和 `tools` 目录，或者直接在 Mac 上重新克隆官方仓库 `git clone https://github.com/RVC-Boss/GPT-SoVITS.git`。

---

## 2. Mac 环境搭建

在 Mac 终端 (Terminal) 中执行以下步骤：

### 2.1 安装 Miniconda (推荐)
如果你还没有 Conda，去官网下载 Miniconda for macOS (Apple Silicon)。

### 2.2 创建虚拟环境
```bash
conda create -n sovits python=3.10
conda activate sovits
```

### 2.3 安装 PyTorch (支持 MPS 加速)
Mac M4 使用 MPS (Metal) 进行硬件加速，而不是 CUDA。
```bash
pip install torch torchaudio torchvision
```
*验证安装*: `python -c "import torch; print(torch.backends.mps.is_available())"` 应输出 `True`。

### 2.4 安装依赖库
在 `GPT-SoVITS` 目录下运行：
```bash
pip install -r requirements.txt
```
如果遇到问题，可以尝试手动安装核心依赖：
```bash
pip install gradio==3.50.2 librosa numpy soundfile cnhubert transformers cn2an pypinyin jieba_fast
```
*注意*: `gradio` 推荐版本 `3.50.2`，新版 v4 API 变动较大可能报错。

---

## 3. 修改代码适配 Mac (重要！)

在 Mac 上打开 `run_libai.py`，找到下面这段代码（大约第 50-60 行）：

```python
if torch.cuda.is_available():
    torch.cuda.empty_cache() # Clean up VRAM before loading
    tts_config.device = "cuda"
    tts_config.is_half = True
    print(f"Device: CUDA ({torch.cuda.get_device_name(0)}) - VRAM Cleaned")
else:
    tts_config.device = "cpu"
    tts_config.is_half = False
    print("Device: CPU")
```

**修改为支持 Mac MPS 的版本：**

```python
import sys

# ... (前面的代码保持不变)

# 自动检测设备 (CUDA / MPS / CPU)
if torch.cuda.is_available():
    tts_config.device = "cuda"
    tts_config.is_half = True
    print("Device: CUDA")
elif torch.backends.mps.is_available():
    tts_config.device = "mps"
    tts_config.is_half = False  # MPS 目前对 fp16 支持不完善，建议用 fp32
    print("Device: MPS (Apple Silicon)")
    # 修复 Mac 上可能出现的环境变量问题
    os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
else:
    tts_config.device = "cpu"
    tts_config.is_half = False
    print("Device: CPU")
```

---

## 4. 运行模型 (Web 界面)

在 Mac 终端中运行：

```bash
python run_libai.py
```

访问浏览器地址 `http://127.0.0.1:9881` 即可使用。

---

## 5. 开发者直接调用 (Python API)

如果你不需要 Web 界面，可以直接使用我为你准备的 Python 脚本 `api_usage_mac.py`。

1.  确保 `api_usage_mac.py` 和模型文件 (`gpt.ckpt`, `sovits.pth`) 在同一个文件夹。
2.  确保你的 GPT-SoVITS 核心代码库正确下载。
3.  编辑 `api_usage_mac.py`，修改 `GPT_SOVITS_ROOT` 变量指向你的代码库根目录。
4.  运行脚本：

```bash
python api_usage_mac.py
```

该脚本会自动加载模型，使用 MPS 加速，生成几个示例音频文件 (`libai_output_1.wav` 等)。你可以参照代码中的 `load_model` 和 `run_tts` 函数将其集成到你自己的 Mac 应用中。
