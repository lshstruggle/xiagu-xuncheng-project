#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
《李白·成都寻梦记》TTS音频批量生成脚本
使用GPT-SoVITS API批量生成故事对话音频

使用方法:
1. 启动GPT-SoVITS API服务
2. 准备参考音频文件 (reference/libai_sample.wav)
3. 运行: python GPT-SoVITS-batch-generate.py

输出:
- output/tts-audio/ 目录下的所有音频文件
- tts-input.json: 生成记录
- audio-urls.json: 小程序代码可用的URL映射
"""

import os
import json
import hashlib
import requests
import concurrent.futures
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

# ==================== 配置区域 ====================

@dataclass
class Config:
    """配置类"""
    # GPT-SoVITS API地址
    TTS_API_URL: str = "http://localhost:9880"
    
    # 参考音频配置（用于声音克隆）
    REFERENCE_AUDIO: str = "reference/libai_sample.wav"
    REFERENCE_TEXT: str = "人生得意须尽欢，莫使金樽空对月。"
    
    # 输出目录
    OUTPUT_DIR: str = "./output/tts-audio"
    
    # 云存储路径前缀（用于小程序）
    CLOUD_PREFIX: str = "cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai"
    
    # 并发数
    CONCURRENT_LIMIT: int = 3
    
    # 请求超时（秒）
    TIMEOUT: int = 60

# 情感参数映射
EMOTION_PARAMS = {
    "normal": {"speed": 1.0, "temperature": 0.7},
    "happy": {"speed": 1.1, "temperature": 0.75},
    "excited": {"speed": 1.15, "temperature": 0.8},
    "thoughtful": {"speed": 0.9, "temperature": 0.65},
    "sad": {"speed": 0.85, "temperature": 0.6}
}

# ==================== 故事对话数据 ====================

STORY_DIALOGUES = [
    # 序章
    {
        "id": "prologue-start",
        "text": "少侠，欢迎来到锦官城！九天开出一成都，万户千门入画图——此城之美，古今闻名。今日李某做东，带你领略这城中诗酒、电竞、羁绊之妙！",
        "emotion": "happy",
        "chapter": "序章"
    },
    {
        "id": "prologue-panda",
        "text": "看那墙上攀爬的黑白剑客，憨态可掬却名扬四海。正如电竞选手，台上十分钟，台下十年功。",
        "emotion": "thoughtful",
        "chapter": "序章"
    },
    {
        "id": "prologue-choice",
        "text": "少侠，今日你我先去何处？是寻诗酒风流，还是问道电竞江湖？",
        "emotion": "normal",
        "chapter": "序章"
    },
    
    # 第一章
    {
        "id": "ch1-temple-dialog1",
        "text": "古刹与繁华只一墙之隔。大慈寺的晨钟暮鼓，与身旁的时尚潮流，奇异地相融。这便如电竞与传统文化，新旧交融，各放异彩。",
        "emotion": "thoughtful",
        "chapter": "第一章"
    },
    {
        "id": "ch1-temple-dialog2",
        "text": "登高而望，自有\"今来一登望，如上九天游\"之感。少侠，你我虽在凡尘，心却可向九天。",
        "emotion": "excited",
        "chapter": "第一章"
    },
    {
        "id": "ch1-park-dialog1",
        "text": "一盏盖碗茶，一把竹椅，看人来人往，听麻将声声——这才是地道的成都安逸！",
        "emotion": "happy",
        "chapter": "第一章"
    },
    {
        "id": "ch1-park-dialog2",
        "text": "人生得意须尽欢，莫使金樽空对月。来，与我共饮此茶，且谈那电竞江湖中的\"老男孩\"追梦之事。",
        "emotion": "excited",
        "chapter": "第一章"
    },
    {
        "id": "ch1-park-story",
        "text": "770与SK，两个\"老男孩\"，26岁重新出发，只为一句承诺。虽最终差一步登顶，却诠释了何为不忘初心。这便如诗中所言：长风破浪会有时，直挂云帆济沧海。",
        "emotion": "thoughtful",
        "chapter": "第一章"
    },
    {
        "id": "ch1-end",
        "text": "茶过三巡，诗酒已尽兴。前方武侯祠，丞相与玄德公正在等候。",
        "emotion": "normal",
        "chapter": "第一章"
    },
    
    # 第二章
    {
        "id": "ch2-wuhou-dialog1",
        "text": "红墙竹影，古木参天。千年前的羽扇纶巾与金戈铁马，仿佛犹在耳畔。丞相与玄德公，君臣相知，肝胆相照。",
        "emotion": "thoughtful",
        "chapter": "第二章"
    },
    {
        "id": "ch2-wuhou-dialog2",
        "text": "这便如Cat与Hurt，\"过命的兄弟\"。从eStar到QG，一起经历低谷与巅峰，彼此信任，肝胆相照。",
        "emotion": "normal",
        "chapter": "第二章"
    },
    {
        "id": "ch2-wuhou-choice",
        "text": "少侠，午间 hungry 否？锦里古街就在隔壁，可要随我去尝尝那地道的成都味道？",
        "emotion": "happy",
        "chapter": "第二章"
    },
    {
        "id": "ch2-jinli-food",
        "text": "夫妻肺片，麻、辣、鲜、香；龙抄手，皮薄馅鲜。这夫妻肺片总店，藏着百年江湖味，最是下酒！",
        "emotion": "excited",
        "chapter": "第二章"
    },
    
    # 第三章
    {
        "id": "ch3-caotang-dialog1",
        "text": "诗圣昔年流寓之所，在此听雨、观竹，写下二百四十余首诗篇。秋来银杏叶黄时，更添几分诗情。",
        "emotion": "thoughtful",
        "chapter": "第三章"
    },
    {
        "id": "ch3-caotang-dialog2",
        "text": "少陵野老，与李某虽未曾谋面，却神交已久。他那\"安得广厦千万间\"的胸怀，令李某敬佩。",
        "emotion": "normal",
        "chapter": "第三章"
    },
    {
        "id": "ch3-wenshu-dialog1",
        "text": "寺内清净，寺外却是人间至味。那宫廷糕点铺，桃酥、拿破仑，香味能飘出半条街。不过李某今日带你来此，是为了寻一份内心的宁静。",
        "emotion": "thoughtful",
        "chapter": "第三章"
    },
    {
        "id": "ch3-wenshu-dialog2",
        "text": "举头望明月，低头思故乡。少侠，行走江湖，莫忘初心。电竞之路漫漫，保持内心的宁静与热爱，方能走得更远。",
        "emotion": "normal",
        "chapter": "第三章"
    },
    
    # 第四章
    {
        "id": "ch4-ag-dialog1",
        "text": "这便是AG超玩会的所在！2024年6月15日启用的专业电竞场馆，西南地区最大的垂直电竞专业场馆之一。",
        "emotion": "excited",
        "chapter": "第四章"
    },
    {
        "id": "ch4-ag-dialog2",
        "text": "近1000个观赛席位，顶尖XR系统、超大曲面立屏...这里承载着无数少年的电竞梦想。",
        "emotion": "excited",
        "chapter": "第四章"
    },
    {
        "id": "ch4-ag-dialog3",
        "text": "说起AG，不得不提神医梦泪与法师老帅——\"初代双子星\"。从队友到战友，共担风雨，同享荣光。",
        "emotion": "normal",
        "chapter": "第四章"
    },
    {
        "id": "ch4-ag-dialog4",
        "text": "如今的AG，一诺从\"激进射手\"成长为\"团队核心\"，那是数千次训练赛的沉淀。Cat转型辅助再夺冠，诠释了何为永不言弃。",
        "emotion": "thoughtful",
        "chapter": "第四章"
    },
    {
        "id": "ch4-ag-dialog5",
        "text": "2017年，QGhappy.Hurt的孙尚香极限守家；2019年，渡劫的李信高地一打四；2024年，重庆狼队让三追四...这些，都是电竞精神的最好诠释。",
        "emotion": "excited",
        "chapter": "第四章"
    },
    {
        "id": "ch4-ag-choice",
        "text": "少侠，电竞之路，你觉得最重要的是什么？",
        "emotion": "normal",
        "chapter": "第四章"
    },
    {
        "id": "ch4-ag-ending-talent",
        "text": "天生我材必有用，千金散尽还复来。天赋确实是起点，但若无勤奋加持，终究难成大器。",
        "emotion": "thoughtful",
        "chapter": "第四章"
    },
    {
        "id": "ch4-ag-ending-effort",
        "text": "正是如此！职业选手平均每天训练超过10小时，全年无休。清融精准的支援背后，是看比赛录像记满的笔记。",
        "emotion": "happy",
        "chapter": "第四章"
    },
    {
        "id": "ch4-ag-ending-team",
        "text": "说得好！我们一起赢，一起上场一起赢。胜利属于整个团队，包括替补、教练、粉丝——大家都是最佳第六人！",
        "emotion": "excited",
        "chapter": "第四章"
    },
    
    # 终章
    {
        "id": "ch5-final-dialog1",
        "text": "安顺廊桥灯火璀璨，倒映在府南河中，如梦似幻。两岸酒馆林立，或有琴声，或有歌声，皆是江湖夜话。",
        "emotion": "thoughtful",
        "chapter": "终章"
    },
    {
        "id": "ch5-final-dialog2",
        "text": "今日与君同游春熙路、太古里、武侯祠、草堂、AG电竞中心，诗酒、文旅、电竞、羁绊，尽在其中。",
        "emotion": "happy",
        "chapter": "终章"
    },
    {
        "id": "ch5-final-dialog3",
        "text": "想听故事，便去那民谣小馆坐坐。李某要吟诵最后一句：长风破浪会有时，直挂云帆济沧海！",
        "emotion": "excited",
        "chapter": "终章"
    }
]

# ==================== 工具函数 ====================

def generate_file_name(text: str, emotion: str) -> str:
    """生成文件名（基于文本哈希）"""
    text_sample = text[:50] if len(text) > 50 else text
    hash_obj = hashlib.md5(text_sample.encode('utf-8'))
    hash_str = hash_obj.hexdigest()[:8]
    return f"libai_{emotion}_{hash_str}.wav"

def ensure_output_dir(output_dir: str) -> Path:
    """确保输出目录存在"""
    path = Path(output_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path

def generate_audio(item: dict, config: Config) -> dict:
    """调用GPT-SoVITS API生成单个音频"""
    file_name = generate_file_name(item["text"], item["emotion"])
    output_path = Path(config.OUTPUT_DIR) / file_name
    
    # 如果已存在，跳过
    if output_path.exists():
        print(f"  ⏭️  已存在，跳过: {file_name}")
        return {
            "id": item["id"],
            "file_name": file_name,
            "success": True,
            "skipped": True,
            "local_path": str(output_path),
            "cloud_path": f"{config.CLOUD_PREFIX}/{file_name}"
        }
    
    try:
        print(f"  🎵 生成中: {item['chapter']} - {item['id']}")
        
        # 构建请求参数
        params = EMOTION_PARAMS.get(item["emotion"], EMOTION_PARAMS["normal"])
        
        # GPT-SoVITS API请求
        # 注意：根据你的GPT-SoVITS版本，API格式可能需要调整
        payload = {
            "refer_wav_path": config.REFERENCE_AUDIO,
            "prompt_text": config.REFERENCE_TEXT,
            "prompt_language": "zh",
            "text": item["text"],
            "text_language": "zh",
            # 可选参数
            "how_to_cut": "凑四句一切",  # 或 "凑50字一切", "按中文句号。切" 等
            "top_k": 20,
            "top_p": 0.6,
            "temperature": params.get("temperature", 0.7),
            "speed": params.get("speed", 1.0),
        }
        
        response = requests.post(
            f"{config.TTS_API_URL}/tts",
            json=payload,
            timeout=config.TIMEOUT
        )
        
        if response.status_code == 200:
            # 保存音频文件
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            print(f"  ✓ 生成成功: {file_name}")
            return {
                "id": item["id"],
                "file_name": file_name,
                "success": True,
                "skipped": False,
                "local_path": str(output_path),
                "cloud_path": f"{config.CLOUD_PREFIX}/{file_name}"
            }
        else:
            print(f"  ✗ API错误: {response.status_code}")
            return {
                "id": item["id"],
                "file_name": file_name,
                "success": False,
                "error": f"API返回 {response.status_code}"
            }
            
    except Exception as e:
        print(f"  ✗ 生成失败: {item['id']} - {str(e)}")
        return {
            "id": item["id"],
            "file_name": file_name,
            "success": False,
            "error": str(e)
        }

def batch_generate(config: Config) -> List[dict]:
    """批量生成音频"""
    print(f"\n🚀 开始批量生成音频，并发数: {config.CONCURRENT_LIMIT}\n")
    
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=config.CONCURRENT_LIMIT) as executor:
        futures = {executor.submit(generate_audio, item, config): item for item in STORY_DIALOGUES}
        
        for i, future in enumerate(concurrent.futures.as_completed(futures)):
            result = future.result()
            results.append(result)
            
            # 显示进度
            progress = (i + 1) / len(STORY_DIALOGUES) * 100
            if (i + 1) % 5 == 0 or (i + 1) == len(STORY_DIALOGUES):
                print(f"  📊 进度: {i + 1}/{len(STORY_DIALOGUES)} ({progress:.1f}%)\n")
    
    return results

def save_results(results: List[dict], config: Config):
    """保存生成结果"""
    output_dir = Path(config.OUTPUT_DIR)
    
    # 1. 生成记录
    with open(output_dir / "generation-results.json", 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    # 2. 小程序可用的URL映射
    url_mapping = {}
    code_snippets = []
    
    for r in results:
        if r.get("success"):
            url_mapping[r["id"]] = r["cloud_path"]
            code_snippets.append(f'  // {r["id"]}\n  ttsAudio: "{r["cloud_path"]}",')
    
    with open(output_dir / "audio-urls.json", 'w', encoding='utf-8') as f:
        json.dump(url_mapping, f, ensure_ascii=False, indent=2)
    
    # 3. 代码片段
    with open(output_dir / "code-snippets.txt", 'w', encoding='utf-8') as f:
        f.write("// 将此代码片段复制到 libai-chengdu.ts 中对应节点\n\n")
        f.write("\n\n".join(code_snippets))
    
    # 4. 生成报告
    success_count = sum(1 for r in results if r.get("success"))
    skipped_count = sum(1 for r in results if r.get("skipped"))
    failed_count = len(results) - success_count
    
    report = {
        "generated_at": str(Path().cwd()),
        "total": len(results),
        "success": success_count,
        "skipped": skipped_count,
        "failed": failed_count,
        "failed_items": [r for r in results if not r.get("success")]
    }
    
    with open(output_dir / "generation-report.json", 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 生成报告:")
    print(f"  总计: {report['total']}")
    print(f"  成功: {report['success']} (其中跳过: {report['skipped']}) ✓")
    print(f"  失败: {report['failed']} ✗")
    
    if report['failed_items']:
        print(f"\n  失败项:")
        for item in report['failed_items']:
            print(f"    - {item['id']}: {item.get('error', 'Unknown error')}")
    
    print(f"\n✓ 结果文件已保存到: {output_dir}")

def generate_csv_for_manual(config: Config):
    """生成CSV文件，用于手动上传到云存储"""
    import csv
    
    output_dir = Path(config.OUTPUT_DIR)
    csv_path = output_dir / "upload-list.csv"
    
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['节点ID', '章节', '文件名', '云存储路径', '文本内容'])
        
        for item in STORY_DIALOGUES:
            file_name = generate_file_name(item["text"], item["emotion"])
            cloud_path = f"{config.CLOUD_PREFIX}/{file_name}"
            writer.writerow([
                item["id"],
                item["chapter"],
                file_name,
                cloud_path,
                item["text"][:50] + "..."
            ])
    
    print(f"✓ 上传清单已生成: {csv_path}")

def main():
    """主函数"""
    print("╔════════════════════════════════════════╗")
    print("║    李白·成都寻梦记 - TTS批量生成工具    ║")
    print("║         Powered by GPT-SoVITS          ║")
    print("╚════════════════════════════════════════╝\n")
    
    config = Config()
    
    # 检查参考音频
    if not Path(config.REFERENCE_AUDIO).exists():
        print(f"⚠️  警告: 参考音频不存在: {config.REFERENCE_AUDIO}")
        print("   请准备参考音频文件，或使用默认配置继续\n")
    
    # 确保输出目录
    ensure_output_dir(config.OUTPUT_DIR)
    print(f"✓ 输出目录: {config.OUTPUT_DIR}\n")
    
    # 批量生成
    results = batch_generate(config)
    
    # 保存结果
    save_results(results, config)
    
    # 生成上传清单
    generate_csv_for_manual(config)
    
    print("\n" + "="*50)
    print("✨ 全部完成！")
    print("="*50)
    print("\n下一步操作:")
    print(f"1. 音频文件已保存到: {config.OUTPUT_DIR}")
    print("2. 将音频文件上传到微信云存储的 tts/libai/ 目录")
    print("3. 复制 code-snippets.txt 中的内容到 libai-chengdu.ts")
    print("4. 在小程序中测试音频播放")
    print("\n提示: 如果某些音频生成失败，可以单独重新运行该条目的生成")

if __name__ == "__main__":
    main()
