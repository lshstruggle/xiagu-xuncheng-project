#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上传TTS音频到腾讯云存储
"""

import json
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# 配置
OUTPUT_DIR = Path("/Users/lsh/服创代码/tts_output/libai-story")
CLOUD_ENV = "xiagu-miniprogram-d7dbpz54358b2f"
CLOUD_BASE_PATH = f"cloud://{CLOUD_ENV}.636c-{CLOUD_ENV}-1410097615"

def get_all_wav_files():
    """获取所有wav文件"""
    wav_files = []
    for chapter_dir in OUTPUT_DIR.iterdir():
        if chapter_dir.is_dir():
            for wav_file in chapter_dir.glob("*.wav"):
                wav_files.append({
                    "local_path": str(wav_file),
                    "chapter": chapter_dir.name,
                    "filename": wav_file.name,
                    "cloud_path": f"tts/libai-story/{chapter_dir.name}/{wav_file.name}"
                })
    return wav_files

def generate_upload_script():
    """生成上传脚本"""
    wav_files = get_all_wav_files()
    
    print(f"找到 {len(wav_files)} 个音频文件\n")
    
    # 保存上传清单
    list_path = Path("/Users/lsh/服创代码/tts_output/upload-list.json")
    with open(list_path, "w", encoding="utf-8") as f:
        json.dump(wav_files, f, ensure_ascii=False, indent=2)
    
    print(f"上传清单已保存: {list_path}\n")
    
    # 生成微信开发者工具上传命令
    print("=" * 60)
    print("上传方式:")
    print("=" * 60)
    print("\n方法1: 使用微信开发者工具")
    print("  1. 打开微信开发者工具")
    print("  2. 点击'云开发' → '存储'")
    print("  3. 创建文件夹: tts/libai-story/")
    print("  4. 按章节上传音频文件")
    print()
    
    # 生成云函数批量上传代码
    print("方法2: 使用云函数批量上传")
    print("-" * 60)
    
    cloud_function_code = '''
// 云函数: batchUploadTTS
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { fileList } = event
  const results = []
  
  for (const item of fileList) {
    try {
      const result = await cloud.uploadFile({
        cloudPath: item.cloudPath,
        fileContent: Buffer.from(item.buffer, 'base64')
      })
      results.push({
        nodeId: item.nodeId,
        success: true,
        fileID: result.fileID
      })
    } catch (err) {
      results.push({
        nodeId: item.nodeId,
        success: false,
        error: err.message
      })
    }
  }
  
  return { results }
}
'''
    
    print(cloud_function_code)
    
    # 生成客户端上传代码
    print("\n方法3: 客户端批量上传（推荐用于小批量）")
    print("-" * 60)
    
    client_code = '''
// 在小程序中批量上传
async function batchUploadTTS() {
  const uploadList = require('./upload-list.json')
  
  for (const item of uploadList) {
    try {
      // 读取本地文件
      const fs = wx.getFileSystemManager()
      const fileData = fs.readFileSync(item.local_path)
      
      // 上传到云存储
      const result = await wx.cloud.uploadFile({
        cloudPath: item.cloud_path,
        fileContent: fileData
      })
      
      console.log('上传成功:', item.filename, result.fileID)
    } catch (err) {
      console.error('上传失败:', item.filename, err)
    }
  }
}
'''
    
    print(client_code)
    
    # 输出文件结构
    print("\n" + "=" * 60)
    print("云存储文件结构:")
    print("=" * 60)
    print(f"{CLOUD_BASE_PATH}/")
    print("  └── tts/")
    print("      └── libai-story/")
    
    chapters = set()
    for item in wav_files:
        chapters.add(item["chapter"])
    
    for chapter in sorted(chapters):
        count = sum(1 for f in wav_files if f["chapter"] == chapter)
        print(f"          ├── {chapter}/ ({count}个文件)")
    
    print(f"\n总计: {len(wav_files)} 个音频文件")

def generate_node_mapping():
    """生成节点ID到音频文件的映射"""
    wav_files = get_all_wav_files()
    
    mapping = {}
    for item in wav_files:
        # 从文件名中提取nodeId
        # 格式: 001-prologue-start-happy.wav
        parts = item["filename"].split("-")
        if len(parts) >= 3:
            node_id = "-".join(parts[1:-1])  # 去掉序号和emotion
            mapping[node_id] = {
                "fileID": f"{CLOUD_BASE_PATH}/{item['cloud_path']}",
                "chapter": item["chapter"],
                "filename": item["filename"]
            }
    
    # 保存映射
    mapping_path = Path("/Users/lsh/服创代码/tts_output/node-audio-mapping.json")
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    
    print(f"\n节点映射已保存: {mapping_path}")
    print(f"映射条目数: {len(mapping)}")

if __name__ == "__main__":
    generate_upload_script()
    generate_node_mapping()
