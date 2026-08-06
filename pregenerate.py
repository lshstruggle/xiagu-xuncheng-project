#!/usr/bin/env python3
# /Users/lsh/服创代码/pregenerate.py
# 预生成所有固定文案的李白语音

import requests
import time
import json

TTS_URL = "http://127.0.0.1:9881"

# ===== 所有需要预生成的固定文案 =====
FIXED_TEXTS = [
    # === 英雄上线招呼 ===
    "十步杀一人，千里不留行。客官，今日这锦官城，便是你我的江湖。出发！",
    
    # === 蓝Buff打卡 ===
    "且记住这段历史，日后定有用处！",
    "此处文墨飘香，颇合我意！",
    
    # === 红Buff打卡 ===
    "红buff已拿，锅沸如黄河之水，正宜痛快一番！",
    "哈哈，好酒好肉，人间值得！",
    
    # === 防御塔攻克 ===
    "推塔！成都的高地，已被你我征服！此情此景，当浮一大白！",
    "哈哈哈，又下一塔！客官好身手！",
    
    # === 荣耀灯塔（赛事精神）===
    "前方那座建筑，两年前的秋天，总决赛就在这里上演。年轻的射手在最后一波选择了孤注一掷的切入，赌上了一切。他赢了。",
    "你今天走了这么远也没放弃，和那个年轻人一样，挺好的。",
    
    # === 选手羁绊（回忆模式）===
    "这一带啊，我听说过一个故事。几年前，有五个少年挤在这附近的一间小屋子里，每天训练十几个小时。没有粉丝，没有灯光，只有彼此。",
    "你尝尝这家店的担担面，据说他们以前常来。",
    
    # === 战报结算 ===
    "今日战绩辉煌，斩获Buff，连下防御塔，颇有银河战舰之风！",
    "客官今日步履不停，好生佩服！改日再战！",
    
    # === 通用鼓励 ===
    "峡谷赛事正酣，赛场之上无畏拼搏，这人间巷陌的探索，亦是属于你的征程，只管大步向前！",
    "且行且歌，人生快意事，莫过于此！",
    
    # === AI降级回复 ===
    "哈哈，峡谷信号不太好，容我饮一杯再与你细说！",
    "且等等，容我想想再告诉你。",
    
    # === POI导览 ===
    "客官，这宽窄巷子颇有峡谷草丛之妙！",
    "且去武侯祠。遥想诸葛丞相，运筹帷幄，何异于峡谷军师？",
    "此地古色古香，正宜饮酒赏景。",
]

def main():
    # 先检查服务是否在线
    try:
        r = requests.get(f"{TTS_URL}/health", timeout=5)
        print(f"TTS服务状态: {r.json()}")
    except:
        print("❌ TTS服务未启动！请先运行 tts_server.py")
        return
    
    print(f"\n开始预生成 {len(FIXED_TEXTS)} 条音频...")
    print("=" * 60)
    
    success = 0
    failed = 0
    
    for i, text in enumerate(FIXED_TEXTS):
        try:
            short = text[:25] + "..." if len(text) > 25 else text
            print(f"[{i+1}/{len(FIXED_TEXTS)}] {short}", end=" ", flush=True)
            
            start = time.time()
            r = requests.post(
                f"{TTS_URL}/tts",
                json={"text": text},
                timeout=60
            )
            elapsed = time.time() - start
            
            if r.status_code == 200:
                size_kb = len(r.content) / 1024
                print(f"✅ {elapsed:.1f}s {size_kb:.0f}KB")
                success += 1
            else:
                print(f"❌ HTTP {r.status_code}")
                failed += 1
        except Exception as e:
            print(f"❌ {e}")
            failed += 1
        
        time.sleep(1)  # 间隔1秒防过热
    
    print("=" * 60)
    print(f"完成！成功: {success}, 失败: {failed}")
    
    # 查看缓存状态
    r = requests.get(f"{TTS_URL}/tts/cache/status")
    status = r.json()
    print(f"缓存文件: {status['count']} 个, 总大小: {status['total_size_mb']} MB")

if __name__ == '__main__':
    main()