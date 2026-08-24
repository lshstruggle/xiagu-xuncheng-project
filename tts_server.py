#!/usr/bin/env python3
"""李白 GPT-SoVITS 的受保护单句 TTS 网关。

此进程只在 CloudStudio 节点运行。它不接受模型路径或任意推理参数，
并由单个 Gunicorn worker 承载，避免同一张 GPU 重复加载模型。
"""

from __future__ import annotations

import hashlib
import io
import json
import logging
import os
import shutil
import sys
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from pathlib import Path
from typing import Any

import numpy as np
import soundfile as sf
from flask import Flask, Response, jsonify, request


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


GPT_SOVITS_ROOT = Path(env("GPT_SOVITS_ROOT", "/workspace/GPT-SoVITS")).resolve()
MODEL_DIR = Path(env("TTS_MODEL_DIR", "/workspace/models/libai")).resolve()
CACHE_DIR = Path(env("TTS_CACHE_DIR", "/workspace/.data/tts-cache")).resolve()
GPT_MODEL_PATH = Path(env("TTS_GPT_MODEL_PATH", str(MODEL_DIR / "gpt_v4.ckpt")))
SOVITS_MODEL_PATH = Path(env("TTS_SOVITS_MODEL_PATH", str(MODEL_DIR / "sovits_v3.pth")))
REF_AUDIO_PATH = Path(env("TTS_REFERENCE_AUDIO", str(MODEL_DIR / "reference.wav")))
REF_TEXT_PATH = Path(env("TTS_REFERENCE_TEXT_FILE", str(MODEL_DIR / "reference_text.txt")))
SHARED_SECRET = env("TTS_SHARED_SECRET")
MODEL_VERSION = env("TTS_MODEL_VERSION", "libai-v3")
MAX_RUNES = int(env("TTS_MAX_SEGMENT_RUNES", "35"))
MAX_CACHE_BYTES = int(env("TTS_CACHE_MAX_BYTES", str(2 * 1024 * 1024 * 1024)))
INFERENCE_TIMEOUT_SECONDS = float(env("TTS_INFERENCE_TIMEOUT_SECONDS", "60"))

logging.basicConfig(
    level=os.environ.get("TTS_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("xiagu.tts")


class TTSManager:
    """Single-model inference and persistent cache manager.

    Three semaphore slots means one active inference and at most two requests
    waiting in the in-process executor. A timed-out task keeps its slot until
    the underlying GPU work actually exits, so timeout cannot overbook a GPU.
    """

    def __init__(self) -> None:
        self.pipeline: Any | None = None
        self.reference_text = "仰天大笑出门去"
        self.ready = False
        self.load_error: str | None = None
        self._slots = threading.BoundedSemaphore(3)
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="tts-inference")
        self._load_lock = threading.Lock()
        self._cache_lock = threading.Lock()

    def start_loading(self) -> None:
        threading.Thread(target=self._load_once, name="tts-model-loader", daemon=True).start()

    def _load_once(self) -> None:
        with self._load_lock:
            if self.ready or self.load_error:
                return
            try:
                for path in (GPT_MODEL_PATH, SOVITS_MODEL_PATH, REF_AUDIO_PATH):
                    if not path.is_file():
                        raise RuntimeError(f"required model asset is missing: {path.name}")
                if not GPT_SOVITS_ROOT.is_dir():
                    raise RuntimeError("GPT_SOVITS_ROOT is not available")

                sys.path.insert(0, str(GPT_SOVITS_ROOT))
                sys.path.insert(0, str(GPT_SOVITS_ROOT / "GPT_SoVITS"))
                os.chdir(GPT_SOVITS_ROOT)
                from GPT_SoVITS.TTS_infer_pack.TTS import TTS, TTS_Config

                config_path = GPT_SOVITS_ROOT / "GPT_SoVITS" / "configs" / "tts_infer.yaml"
                config = TTS_Config(str(config_path) if config_path.is_file() else "")
                config.device = env("TTS_DEVICE", "cuda")
                config.is_half = env("TTS_HALF", "true").lower() == "true"
                config.t2s_weights_path = str(GPT_MODEL_PATH)
                config.vits_weights_path = str(SOVITS_MODEL_PATH)
                if REF_TEXT_PATH.is_file():
                    text = REF_TEXT_PATH.read_text(encoding="utf-8").strip()
                    if text:
                        self.reference_text = text
                self.pipeline = TTS(config)
                # Warm-up validates the complete inference path before /ready is true.
                self._synthesize("你好。")
                self.ready = True
                logger.info("model_ready model_version=%s", MODEL_VERSION)
            except Exception as exc:  # never expose internals through HTTP
                self.load_error = type(exc).__name__
                logger.exception("model_load_failed error_type=%s", self.load_error)

    def _params(self) -> dict[str, Any]:
        return {
            "speed": float(env("TTS_SPEED", "1.0")),
            "top_k": int(env("TTS_TOP_K", "20")),
            "top_p": float(env("TTS_TOP_P", "0.75")),
            "temperature": float(env("TTS_TEMPERATURE", "0.7")),
            "batch_size": int(env("TTS_BATCH_SIZE", "1")),
            "sample_steps": int(env("TTS_SAMPLE_STEPS", "16")),
            "split_interval": float(env("TTS_SPLIT_INTERVAL", "0.3")),
            "repetition_penalty": float(env("TTS_REPETITION_PENALTY", "1.35")),
        }

    def _synthesize(self, text: str) -> bytes:
        if self.pipeline is None:
            raise RuntimeError("model is not loaded")
        params = self._params()
        result = self.pipeline.run({
            "text": text,
            "text_lang": "zh",
            "ref_audio_path": str(REF_AUDIO_PATH),
            "prompt_text": self.reference_text,
            "prompt_lang": "zh",
            "text_split_method": "cut0",
            "speed_factor": params["speed"],
            "top_k": params["top_k"], "top_p": params["top_p"],
            "temperature": params["temperature"], "batch_size": params["batch_size"],
            "sample_steps": params["sample_steps"],
            "fragment_interval": params["split_interval"],
            "repetition_penalty": params["repetition_penalty"],
            "parallel_infer": False, "seed": -1, "media_type": "wav",
        })
        chunks: list[np.ndarray] = []
        sample_rate = 32000
        for sample_rate, audio in result:
            chunks.append(audio)
        if not chunks:
            raise RuntimeError("model returned no audio")
        out = io.BytesIO()
        sf.write(out, np.concatenate(chunks), sample_rate, format="WAV")
        return out.getvalue()

    def _cache_path(self, text: str) -> Path:
        material = json.dumps(
            {"model": MODEL_VERSION, "text": text, "params": self._params()},
            ensure_ascii=False, sort_keys=True, separators=(",", ":"),
        ).encode()
        return CACHE_DIR / f"{hashlib.sha256(material).hexdigest()}.wav"

    def _evict_cache(self) -> None:
        files = [p for p in CACHE_DIR.glob("*.wav") if p.is_file()]
        total = sum(p.stat().st_size for p in files)
        for path in sorted(files, key=lambda p: p.stat().st_atime):
            if total <= MAX_CACHE_BYTES:
                break
            size = path.stat().st_size
            path.unlink(missing_ok=True)
            total -= size

    def synthesize(self, text: str) -> tuple[bytes, bool, float, float]:
        path = self._cache_path(text)
        try:
            data = path.read_bytes()
            os.utime(path, None)
            return data, True, 0.0, 0.0
        except FileNotFoundError:
            pass

        queued_at = time.monotonic()
        if not self._slots.acquire(blocking=False):
            raise OverflowError("queue_full")
        def run_inference() -> tuple[bytes, float, float]:
            queue_seconds = time.monotonic() - queued_at
            started = time.monotonic()
            return self._synthesize(text), queue_seconds, time.monotonic() - started

        future = self._executor.submit(run_inference)
        released = False
        try:
            data, queue_seconds, inference_seconds = future.result(timeout=INFERENCE_TIMEOUT_SECONDS)
            with self._cache_lock:
                CACHE_DIR.mkdir(parents=True, exist_ok=True)
                with tempfile.NamedTemporaryFile(dir=CACHE_DIR, delete=False) as temp:
                    temp.write(data)
                    temp_path = Path(temp.name)
                temp_path.replace(path)
                self._evict_cache()
            self._slots.release()
            released = True
            return data, False, queue_seconds, inference_seconds
        except FutureTimeout:
            # Keep capacity occupied until the non-interruptible model call leaves GPU.
            future.add_done_callback(lambda _: self._slots.release())
            released = True
            raise TimeoutError("inference_timeout")
        finally:
            if not released:
                self._slots.release()


manager = TTSManager()


def error(status: int, code: str) -> tuple[Response, int]:
    return jsonify({"code": code, "message": "语音服务暂时不可用"}), status


def create_app() -> Flask:
    app = Flask(__name__)
    manager.start_loading()

    @app.get("/health")
    def health() -> Response:
        return jsonify({"status": "ok", "service": "xiagu-tts"})

    @app.get("/ready")
    def ready() -> tuple[Response, int] | Response:
        if manager.ready:
            return jsonify({"status": "ready", "model_version": MODEL_VERSION})
        return jsonify({"status": "unavailable"}), 503

    @app.post("/tts")
    def tts() -> tuple[Response, int] | Response:
        token = request.headers.get("Authorization", "")
        if not SHARED_SECRET or token != f"Bearer {SHARED_SECRET}":
            return error(401, "unauthorized")
        if not manager.ready:
            return error(503, "not_ready")
        data = request.get_json(silent=True) or {}
        text = data.get("text")
        if not isinstance(text, str) or not text.strip():
            return error(400, "invalid_text")
        text = text.strip()
        if len(text) > MAX_RUNES:
            return error(400, "text_too_long")
        text_hash = hashlib.sha256(text.encode()).hexdigest()[:12]
        try:
            audio, hit, queued, inference = manager.synthesize(text)
            logger.info("tts text_hash=%s cache=%s queue_ms=%d inference_ms=%d bytes=%d",
                        text_hash, "HIT" if hit else "MISS", int(queued * 1000),
                        int(inference * 1000), len(audio))
            response = Response(audio, mimetype="audio/wav")
            response.headers["X-TTS-Cache"] = "HIT" if hit else "MISS"
            return response
        except OverflowError:
            response, status = error(429, "queue_full")
            response.headers["Retry-After"] = "2"
            return response, status
        except TimeoutError:
            return error(504, "timeout")
        except Exception as exc:
            logger.exception("tts_failed text_hash=%s error_type=%s", text_hash, type(exc).__name__)
            return error(503, "synthesis_failed")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(env("PORT", "9881")), threaded=True)
