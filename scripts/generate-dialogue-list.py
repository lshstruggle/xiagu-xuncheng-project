#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从libai-chengdu.ts提取对话列表，生成dialogue-list.json
"""

import json
import re
from pathlib import Path

# 读取剧情数据文件
TS_FILE = Path("/Users/lsh/服创代码/首页代码/src/data/stories/libai-chengdu.ts")
OUTPUT_FILE = Path("/Users/lsh/服创代码/tts_output/dialogue-list.json")

def extract_dialogues():
    """从TypeScript文件中提取对话内容"""
    
    with open(TS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    dialogues = []
    
    # 章节映射
    chapter_map = {
        'prologue': '01-序章',
        'ch1': '02-第一章',
        'ch2': '03-第二章',
        'ch3': '04-第三章',
        'ch4': '05-第四章',
        'ch5': '06-终章'
    }
    
    # 使用正则表达式匹配所有节点定义
    # 匹配模式: 'node-id': { ... dialog: { content: '...', emotion: '...' } }
    node_pattern = r"'([^']+)':\s*\{[\s\S]*?dialog:\s*\{[\s\S]*?content:\s*'([^']+)'[\s\S]*?emotion:\s*'([^']+)'"
    
    matches = re.findall(node_pattern, content)
    
    for node_id, text, emotion in matches:
        # 确定章节
        chapter = 'unknown'
        for key, value in chapter_map.items():
            if node_id.startswith(key):
                chapter = value
                break
        
        dialogues.append({
            "nodeId": node_id,
            "chapter": chapter,
            "text": text,
            "emotion": emotion
        })
    
    return dialogues

def main():
    print("正在提取对话列表...")
    
    dialogues = extract_dialogues()
    
    if not dialogues:
        print("未找到对话数据，尝试备用提取方式...")
        # 备用方式：手动定义对话列表
        dialogues = [
            {"nodeId": "prologue-start", "chapter": "01-序章", "text": "少侠，欢迎来到锦官城！九天开出一成都，万户千门入画图——此城之美，古今闻名。今日李某做东，带你领略这城中诗酒、电竞、羁绊之妙！", "emotion": "happy"},
            {"nodeId": "prologue-chunxi-scene", "chapter": "01-序章", "text": "少侠你看，这春熙路果然名不虚传！霓虹闪烁，人潮如织，现代繁华与千年古韵在此交融。那边高楼林立，这边古刹深藏——这太古里与千年古刹大慈寺仅一墙之隔，正是\"闹中取静\"的绝佳写照。", "emotion": "excited"},
            {"nodeId": "prologue-chunxi-fashion", "chapter": "01-序章", "text": "此地不仅有时尚名店、网红美食，更有那量子光电竞中心就在不远处——那里可是KPL西部主场，承载着无数少年电竞梦想的圣地。少侠，你觉得这现代繁华之地，可还入眼？", "emotion": "happy"},
            {"nodeId": "prologue-chunxi-choice", "chapter": "01-序章", "text": "少侠，今日你我先去何处？是寻诗酒风流，还是问道电竞江湖？", "emotion": "normal"},
            {"nodeId": "prologue-chunxi-transition", "chapter": "01-序章", "text": "好！既然是寻诗酒风流，那我们就先去那繁华之地春熙路看看吧！那里霓虹闪烁、人潮如织，是成都最热闹的地方。", "emotion": "excited"},
            {"nodeId": "ch1-temple-start", "chapter": "02-第一章", "text": "少侠，随我来！下一站我们去大慈寺，感受古刹与繁华的交融之美。", "emotion": "excited"},
            {"nodeId": "ch1-temple-dialog1", "chapter": "02-第一章", "text": "古刹与繁华只一墙之隔。大慈寺的晨钟暮鼓，与身旁的时尚潮流，奇异地相融。这便如电竞与传统文化，新旧交融，各放异彩。", "emotion": "thoughtful"},
            {"nodeId": "ch1-temple-dialog2", "chapter": "02-第一章", "text": "登高而望，自有\"今来一登望，如上九天游\"之感。少侠，你我虽在凡尘，心却可向九天。下一站，我们去人民公园，品一盏盖碗茶，感受地道的成都安逸！", "emotion": "excited"},
            {"nodeId": "ch1-park-transition", "chapter": "02-第一章", "text": "少侠，我们到了人民公园鹤鸣茶社！这里是成都慢生活的绝佳写照。", "emotion": "happy"},
            {"nodeId": "ch1-park-dialog1", "chapter": "02-第一章", "text": "一盏盖碗茶，一把竹椅，看人来人往，听麻将声声——这才是地道的成都安逸！", "emotion": "happy"},
            {"nodeId": "ch1-park-dialog2", "chapter": "02-第一章", "text": "人生得意须尽欢，莫使金樽空对月。来，与我共饮此茶，且谈那电竞江湖中的\"老男孩\"追梦之事。", "emotion": "excited"},
            {"nodeId": "ch1-park-story", "chapter": "02-第一章", "text": "770与SK，两个\"老男孩\"，26岁重新出发，只为一句承诺。虽最终差一步登顶，却诠释了何为不忘初心。这便如诗中所言：长风破浪会有时，直挂云帆济沧海。", "emotion": "thoughtful"},
            {"nodeId": "ch1-end", "chapter": "02-第一章", "text": "茶过三巡，诗酒已尽兴。少侠，下一站我们去武侯祠，感受君臣合祀的忠义之情，丞相与玄德公正在那里等候着我们！", "emotion": "excited"},
            {"nodeId": "ch2-wuhou-start", "chapter": "03-第二章", "text": "前方就是武侯祠了，红墙竹影，千年古韵。", "emotion": "thoughtful"},
            {"nodeId": "ch2-wuhou-dialog1", "chapter": "03-第二章", "text": "红墙竹影，古木参天。千年前的羽扇纶巾与金戈铁马，仿佛犹在耳畔。丞相与玄德公，君臣相知，肝胆相照。", "emotion": "thoughtful"},
            {"nodeId": "ch2-wuhou-dialog2", "chapter": "03-第二章", "text": "这便如Cat与Hurt，\"过命的兄弟\"。他们在QG，一起经历低谷与巅峰，彼此信任，肝胆相照。", "emotion": "normal"},
            {"nodeId": "ch2-wuhou-choice", "chapter": "03-第二章", "text": "少侠，午间 hungry 否？锦里古街就在隔壁，可要随我去尝尝那地道的成都味道？", "emotion": "happy"},
            {"nodeId": "ch2-jinli-food", "chapter": "03-第二章", "text": "夫妻肺片，麻、辣、鲜、香；龙抄手，皮薄馅鲜。这夫妻肺片总店，藏着百年江湖味，最是下酒！吃饱喝足后，少侠，下一站我们去杜甫草堂，拜访诗圣的幽居之所。", "emotion": "excited"},
            {"nodeId": "ch3-caotang-start", "chapter": "04-第三章", "text": "少侠，我们到了杜甫草堂！这里可是诗圣杜甫流寓成都时的故居，让我带你感受诗圣当年的情怀。", "emotion": "thoughtful"},
            {"nodeId": "ch3-caotang-dialog1", "chapter": "04-第三章", "text": "诗圣昔年流寓之所，在此听雨、观竹，写下二百四十余首诗篇。秋来银杏叶黄时，更添几分诗情。", "emotion": "thoughtful"},
            {"nodeId": "ch3-caotang-dialog2", "chapter": "04-第三章", "text": "少陵野老，与李某虽未曾谋面，却神交已久。他那\"安得广厦千万间\"的胸怀，令李某敬佩。少侠，下一站我们去文殊院，寻一份内心的宁静。", "emotion": "normal"},
            {"nodeId": "ch3-wenshu-start", "chapter": "04-第三章", "text": "文殊院到了，这里清净庄严，是都市中的一方净土。", "emotion": "thoughtful"},
            {"nodeId": "ch3-wenshu-dialog1", "chapter": "04-第三章", "text": "寺内清净，寺外却是人间至味。那宫廷糕点铺，桃酥、拿破仑，香味能飘出半条街。不过李某今日带你来此，是为了寻一份内心的宁静。", "emotion": "thoughtful"},
            {"nodeId": "ch3-wenshu-dialog2", "chapter": "04-第三章", "text": "举头望明月，低头思故乡。少侠，行走江湖，莫忘初心。电竞之路漫漫，保持内心的宁静与热爱，方能走得更远。接下来，让我们去AG电竞中心，感受电竞的热血与激情！", "emotion": "normal"},
            {"nodeId": "ch4-ag-start", "chapter": "05-第四章", "text": "前方就是AG电竞中心，少侠，准备好感受电竞的热血了吗？", "emotion": "excited"},
            {"nodeId": "ch4-ag-dialog1", "chapter": "05-第四章", "text": "这便是AG超玩会的所在！2024年6月15日启用的专业电竞场馆，西南地区最大的垂直电竞专业场馆之一。", "emotion": "excited"},
            {"nodeId": "ch4-ag-dialog2", "chapter": "05-第四章", "text": "近1000个观赛席位，顶尖XR系统、超大曲面立屏...这里承载着无数少年的电竞梦想。少侠，接下来我们去凤凰山体育公园，那里有着AG最辉煌的时刻！", "emotion": "excited"},
            {"nodeId": "ch4-phoenix-start", "chapter": "05-第四章", "text": "少侠，我们到了凤凰山体育公园！这里是2023年王者荣耀世界冠军杯总决赛的举办地，也是AG超玩会捧起冠军奖杯的荣耀之地！", "emotion": "excited"},
            {"nodeId": "ch4-phoenix-memory", "chapter": "05-第四章", "text": "2023年12月30日，那个寒冷的冬夜，AG超玩会在这里以4:2击败北京WB，时隔1477天再次捧起顶级赛事奖杯！全场金色雨落下，欢呼声震耳欲聋。", "emotion": "excited"},
            {"nodeId": "ch4-phoenix-story", "chapter": "05-第四章", "text": "一诺成为了王者荣耀顶级赛事史上首位发育路FMVP。从\"天才少年\"到\"团队核心\"，他用七年时间证明了自己。这里的每一块砖石，都铭记着那群少年的热血与荣光。", "emotion": "thoughtful"},
            {"nodeId": "ch4-ag-dialog3", "chapter": "05-第四章", "text": "说起AG，不得不提神医梦泪与法师老帅——\"初代双子星\"。从队友到战友，共担风雨，同享荣光。", "emotion": "excited"},
            {"nodeId": "ch4-ag-dialog4", "chapter": "05-第四章", "text": "如今的AG，一诺从\"激进射手\"成长为\"团队核心\"，那是数千次训练赛的沉淀。Cat转型辅助再夺冠，诠释了何为永不言弃。", "emotion": "thoughtful"},
            {"nodeId": "ch4-ag-dialog5", "chapter": "05-第四章", "text": "2017年，QGhappy.Hurt的孙尚香极限守家；2019年，渡劫的李信高地一打四；2024年，重庆狼队让三追四...这些，都是电竞精神的最好诠释。", "emotion": "excited"},
            {"nodeId": "ch4-ag-choice", "chapter": "05-第四章", "text": "少侠，电竞之路，你觉得最重要的是什么？", "emotion": "normal"},
            {"nodeId": "ch4-ag-ending-talent", "chapter": "05-第四章", "text": "天生我材必有用，千金散尽还复来。天赋确实是起点，但若无勤奋加持，终究难成大器。少侠，接下来我们去九眼桥，在灯火璀璨中结束今日的旅程！", "emotion": "thoughtful"},
            {"nodeId": "ch4-ag-ending-effort", "chapter": "05-第四章", "text": "正是如此！职业选手平均每天训练超过10小时，全年无休。Cat精准的支援背后，是看比赛录像记满的笔记。少侠，接下来我们去九眼桥，在灯火璀璨中结束今日的旅程！", "emotion": "happy"},
            {"nodeId": "ch4-ag-ending-team", "chapter": "05-第四章", "text": "说得好！我们一起赢，一起上场一起赢。胜利属于整个团队，包括替补、教练、粉丝——大家都是最佳第六人！少侠，接下来我们去九眼桥，在灯火璀璨中结束今日的旅程！", "emotion": "excited"},
            {"nodeId": "ch5-final-start", "chapter": "06-终章", "text": "少侠，我们到了九眼桥！这里是成都夜生活的代表，灯火璀璨，如梦似幻。让我们在此为今日的旅程画上圆满的句号。", "emotion": "happy"},
            {"nodeId": "ch5-final-dialog1", "chapter": "06-终章", "text": "安顺廊桥灯火璀璨，倒映在府南河中，如梦似幻。两岸酒馆林立，或有琴声，或有歌声，皆是江湖夜话。", "emotion": "thoughtful"},
            {"nodeId": "ch5-final-dialog2", "chapter": "06-终章", "text": "今日与君同游春熙路、太古里、武侯祠、草堂、AG电竞中心，诗酒、文旅、电竞、羁绊，尽在其中。", "emotion": "happy"},
            {"nodeId": "ch5-final-dialog3", "chapter": "06-终章", "text": "想听故事，便去那民谣小馆坐坐。李某要吟诵最后一句：长风破浪会有时，直挂云帆济沧海！", "emotion": "excited"},
            {"nodeId": "ch5-ending", "chapter": "06-终章", "text": "你已完成《李白·成都寻梦记》全部旅程。诗酒趁年华，电竞永不弃，愿你如KPL选手一般，无论顺境逆境，永远保持热爱与信念！", "emotion": "happy"},
        ]
    
    # 确保输出目录存在
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # 写入JSON文件
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dialogues, f, ensure_ascii=False, indent=2)
    
    print(f"✓ 共提取 {len(dialogues)} 条对话")
    print(f"✓ 已保存到: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
