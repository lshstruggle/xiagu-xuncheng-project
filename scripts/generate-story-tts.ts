/**
 * 故事TTS音频批量生成脚本
 * 
 * 使用方法:
 * 1. 确保已安装依赖: npm install axios fs-extra
 * 2. 配置GPT-SoVITS API地址
 * 3. 运行: npx ts-node scripts/generate-story-tts.ts
 * 
 * 输出:
 * - output/tts-input.json: GPT-SoVITS输入文件
 * - output/audio-urls.json: 生成的音频URL映射
 */

import * as fs from 'fs-extra'
import * as path from 'path'
import axios from 'axios'

// ==================== 配置区域 ====================

const CONFIG = {
  // GPT-SoVITS API配置
  TTS_API_URL: process.env.TTS_API_URL || 'http://localhost:9880',
  
  // 参考音频配置（用于声音克隆）
  REFERENCE_AUDIO: 'reference/libai_sample.wav',  // 李白参考音频路径
  REFERENCE_TEXT: '人生得意须尽欢，莫使金樽空对月。',  // 参考音频对应的文本
  
  // 输出配置
  OUTPUT_DIR: './output/tts-audio',
  
  // 情感参数映射
  EMOTION_PARAMS: {
    normal: { speed: 1.0, pitch: 0 },
    happy: { speed: 1.1, pitch: 0.05 },
    excited: { speed: 1.15, pitch: 0.1 },
    thoughtful: { speed: 0.9, pitch: -0.05 },
    sad: { speed: 0.85, pitch: -0.1 }
  },
  
  // 并发数
  CONCURRENT_LIMIT: 3
}

// ==================== 故事数据 ====================

// 《李白·成都寻梦记》完整对话文本
const STORY_DIALOGUES = [
  // 序章
  {
    id: 'prologue-start',
    text: '少侠，欢迎来到锦官城！九天开出一成都，万户千门入画图——此城之美，古今闻名。今日李某做东，带你领略这城中诗酒、电竞、羁绊之妙！',
    emotion: 'happy',
    chapter: '序章'
  },
  {
    id: 'prologue-panda',
    text: '看那墙上攀爬的黑白剑客，憨态可掬却名扬四海。正如电竞选手，台上十分钟，台下十年功。',
    emotion: 'thoughtful',
    chapter: '序章'
  },
  {
    id: 'prologue-choice',
    text: '少侠，今日你我先去何处？是寻诗酒风流，还是问道电竞江湖？',
    emotion: 'normal',
    chapter: '序章'
  },
  
  // 第一章
  {
    id: 'ch1-temple-dialog1',
    text: '古刹与繁华只一墙之隔。大慈寺的晨钟暮鼓，与身旁的时尚潮流，奇异地相融。这便如电竞与传统文化，新旧交融，各放异彩。',
    emotion: 'thoughtful',
    chapter: '第一章'
  },
  {
    id: 'ch1-temple-dialog2',
    text: '登高而望，自有"今来一登望，如上九天游"之感。少侠，你我虽在凡尘，心却可向九天。',
    emotion: 'excited',
    chapter: '第一章'
  },
  {
    id: 'ch1-park-dialog1',
    text: '一盏盖碗茶，一把竹椅，看人来人往，听麻将声声——这才是地道的成都安逸！',
    emotion: 'happy',
    chapter: '第一章'
  },
  {
    id: 'ch1-park-dialog2',
    text: '人生得意须尽欢，莫使金樽空对月。来，与我共饮此茶，且谈那电竞江湖中的"老男孩"追梦之事。',
    emotion: 'excited',
    chapter: '第一章'
  },
  {
    id: 'ch1-park-story',
    text: '770与SK，两个"老男孩"，26岁重新出发，只为一句承诺。虽最终差一步登顶，却诠释了何为不忘初心。这便如诗中所言：长风破浪会有时，直挂云帆济沧海。',
    emotion: 'thoughtful',
    chapter: '第一章'
  },
  {
    id: 'ch1-end',
    text: '茶过三巡，诗酒已尽兴。前方武侯祠，丞相与玄德公正在等候。',
    emotion: 'normal',
    chapter: '第一章'
  },
  
  // 第二章
  {
    id: 'ch2-wuhou-dialog1',
    text: '红墙竹影，古木参天。千年前的羽扇纶巾与金戈铁马，仿佛犹在耳畔。丞相与玄德公，君臣相知，肝胆相照。',
    emotion: 'thoughtful',
    chapter: '第二章'
  },
  {
    id: 'ch2-wuhou-dialog2',
    text: '这便如Cat与Hurt，"过命的兄弟"。从eStar到QG，一起经历低谷与巅峰，彼此信任，肝胆相照。',
    emotion: 'normal',
    chapter: '第二章'
  },
  {
    id: 'ch2-wuhou-choice',
    text: '少侠，午间 hungry 否？锦里古街就在隔壁，可要随我去尝尝那地道的成都味道？',
    emotion: 'happy',
    chapter: '第二章'
  },
  {
    id: 'ch2-jinli-food',
    text: '夫妻肺片，麻、辣、鲜、香；龙抄手，皮薄馅鲜。这夫妻肺片总店，藏着百年江湖味，最是下酒！',
    emotion: 'excited',
    chapter: '第二章'
  },
  
  // 第三章
  {
    id: 'ch3-caotang-dialog1',
    text: '诗圣昔年流寓之所，在此听雨、观竹，写下二百四十余首诗篇。秋来银杏叶黄时，更添几分诗情。',
    emotion: 'thoughtful',
    chapter: '第三章'
  },
  {
    id: 'ch3-caotang-dialog2',
    text: '少陵野老，与李某虽未曾谋面，却神交已久。他那"安得广厦千万间"的胸怀，令李某敬佩。',
    emotion: 'normal',
    chapter: '第三章'
  },
  {
    id: 'ch3-wenshu-dialog1',
    text: '寺内清净，寺外却是人间至味。那宫廷糕点铺，桃酥、拿破仑，香味能飘出半条街。不过李某今日带你来此，是为了寻一份内心的宁静。',
    emotion: 'thoughtful',
    chapter: '第三章'
  },
  {
    id: 'ch3-wenshu-dialog2',
    text: '举头望明月，低头思故乡。少侠，行走江湖，莫忘初心。电竞之路漫漫，保持内心的宁静与热爱，方能走得更远。',
    emotion: 'normal',
    chapter: '第三章'
  },
  
  // 第四章
  {
    id: 'ch4-ag-dialog1',
    text: '这便是AG超玩会的所在！2024年6月15日启用的专业电竞场馆，西南地区最大的垂直电竞专业场馆之一。',
    emotion: 'excited',
    chapter: '第四章'
  },
  {
    id: 'ch4-ag-dialog2',
    text: '近1000个观赛席位，顶尖XR系统、超大曲面立屏...这里承载着无数少年的电竞梦想。',
    emotion: 'excited',
    chapter: '第四章'
  },
  {
    id: 'ch4-ag-dialog3',
    text: '说起AG，不得不提神医梦泪与法师老帅——"初代双子星"。从队友到战友，共担风雨，同享荣光。',
    emotion: 'normal',
    chapter: '第四章'
  },
  {
    id: 'ch4-ag-dialog4',
    text: '如今的AG，一诺从"激进射手"成长为"团队核心"，那是数千次训练赛的沉淀。Cat转型辅助再夺冠，诠释了何为永不言弃。',
    emotion: 'thoughtful',
    chapter: '第四章'
  },
  {
    id: 'ch4-ag-dialog5',
    text: '2017年，QGhappy.Hurt的孙尚香极限守家；2019年，渡劫的李信高地一打四；2024年，重庆狼队让三追四...这些，都是电竞精神的最好诠释。',
    emotion: 'excited',
    chapter: '第四章'
  },
  {
    id: 'ch4-ag-choice',
    text: '少侠，电竞之路，你觉得最重要的是什么？',
    emotion: 'normal',
    chapter: '第四章'
  },
  {
    id: 'ch4-ag-ending-talent',
    text: '天生我材必有用，千金散尽还复来。天赋确实是起点，但若无勤奋加持，终究难成大器。',
    emotion: 'thoughtful',
    chapter: '第四章'
  },
  {
    id: 'ch4-ag-ending-effort',
    text: '正是如此！职业选手平均每天训练超过10小时，全年无休。清融精准的支援背后，是看比赛录像记满的笔记。',
    emotion: 'happy',
    chapter: '第四章'
  },
  {
    id: 'ch4-ag-ending-team',
    text: '说得好！我们一起赢，一起上场一起赢。胜利属于整个团队，包括替补、教练、粉丝——大家都是最佳第六人！',
    emotion: 'excited',
    chapter: '第四章'
  },
  
  // 终章
  {
    id: 'ch5-final-dialog1',
    text: '安顺廊桥灯火璀璨，倒映在府南河中，如梦似幻。两岸酒馆林立，或有琴声，或有歌声，皆是江湖夜话。',
    emotion: 'thoughtful',
    chapter: '终章'
  },
  {
    id: 'ch5-final-dialog2',
    text: '今日与君同游春熙路、太古里、武侯祠、草堂、AG电竞中心，诗酒、文旅、电竞、羁绊，尽在其中。',
    emotion: 'happy',
    chapter: '终章'
  },
  {
    id: 'ch5-final-dialog3',
    text: '想听故事，便去那民谣小馆坐坐。李某要吟诵最后一句：长风破浪会有时，直挂云帆济沧海！',
    emotion: 'excited',
    chapter: '终章'
  }
]

// ==================== 工具函数 ====================

/**
 * 确保输出目录存在
 */
async function ensureOutputDir() {
  await fs.ensureDir(CONFIG.OUTPUT_DIR)
  console.log(`✓ 输出目录已就绪: ${CONFIG.OUTPUT_DIR}`)
}

/**
 * 生成文件名（基于文本哈希）
 */
function generateFileName(text: string, emotion: string): string {
  // 简化哈希：取前8个字符的base36编码
  let hash = 0
  for (let i = 0; i < Math.min(text.length, 50); i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hashStr = Math.abs(hash).toString(36).substring(0, 8)
  return `libai_${emotion}_${hashStr}.mp3`
}

/**
 * 生成GPT-SoVITS输入文件
 */
async function generateTTSInputFile() {
  const inputData = STORY_DIALOGUES.map(item => ({
    id: item.id,
    text: item.text,
    emotion: item.emotion,
    chapter: item.chapter,
    fileName: generateFileName(item.text, item.emotion),
    params: CONFIG.EMOTION_PARAMS[item.emotion as keyof typeof CONFIG.EMOTION_PARAMS] || CONFIG.EMOTION_PARAMS.normal
  }))

  const outputPath = path.join(CONFIG.OUTPUT_DIR, 'tts-input.json')
  await fs.writeJson(outputPath, inputData, { spaces: 2 })
  
  console.log(`✓ TTS输入文件已生成: ${outputPath}`)
  console.log(`  共 ${inputData.length} 条对话需要生成音频`)
  
  return inputData
}

/**
 * 调用GPT-SoVITS API生成音频
 */
async function generateAudio(item: typeof STORY_DIALOGUES[0]): Promise<{id: string, fileName: string, success: boolean, url?: string, error?: string}> {
  const fileName = generateFileName(item.text, item.emotion)
  const outputPath = path.join(CONFIG.OUTPUT_DIR, fileName)
  
  try {
    console.log(`  🎵 生成中: ${item.chapter} - ${item.id}`)
    
    // GPT-SoVITS API调用（参考格式）
    const response = await axios.post(
      `${CONFIG.TTS_API_URL}/tts`,
      {
        text: item.text,
        // 参考音频配置
        refer_wav_path: CONFIG.REFERENCE_AUDIO,
        prompt_text: CONFIG.REFERENCE_TEXT,
        prompt_language: 'zh',
        text_language: 'zh',
        // 情感参数
        speed: CONFIG.EMOTION_PARAMS[item.emotion as keyof typeof CONFIG.EMOTION_PARAMS]?.speed || 1.0,
        // 其他参数...
      },
      {
        responseType: 'arraybuffer',  // 获取音频二进制数据
        timeout: 30000  // 30秒超时
      }
    )

    if (response.status === 200 && response.data) {
      // 保存音频文件
      await fs.writeFile(outputPath, Buffer.from(response.data))
      console.log(`  ✓ 生成成功: ${fileName}`)
      
      return {
        id: item.id,
        fileName,
        success: true,
        url: outputPath
      }
    } else {
      throw new Error(`API返回错误: ${response.status}`)
    }
  } catch (error) {
    console.error(`  ✗ 生成失败: ${item.id}`, error)
    return {
      id: item.id,
      fileName,
      success: false,
      error: String(error)
    }
  }
}

/**
 * 批量生成音频（带并发控制）
 */
async function batchGenerateAudios(items: typeof STORY_DIALOGUES) {
  console.log(`\n🚀 开始批量生成音频，并发数: ${CONFIG.CONCURRENT_LIMIT}\n`)
  
  const results = []
  const executing: Promise<any>[] = []
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const promise = generateAudio(item).then(result => {
      results.push(result)
      return result
    })
    
    executing.push(promise)
    
    // 控制并发
    if (executing.length >= CONFIG.CONCURRENT_LIMIT) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
    
    // 显示进度
    if ((i + 1) % 5 === 0) {
      console.log(`  📊 进度: ${i + 1}/${items.length}`)
    }
  }
  
  // 等待所有任务完成
  await Promise.all(executing)
  
  return results
}

/**
 * 生成音频URL映射文件
 */
async function generateUrlMapping(results: Array<{id: string, fileName: string, success: boolean}>) {
  const mapping: Record<string, string> = {}
  
  for (const result of results) {
    if (result.success) {
      // 云存储路径格式
      mapping[result.id] = `cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615/tts/libai/${result.fileName}`
    }
  }
  
  const outputPath = path.join(CONFIG.OUTPUT_DIR, 'audio-urls.json')
  await fs.writeJson(outputPath, mapping, { spaces: 2 })
  
  console.log(`\n✓ 音频URL映射已生成: ${outputPath}`)
  console.log(`  成功: ${Object.keys(mapping).length}/${results.length}`)
  
  return mapping
}

/**
 * 生成生成报告
 */
async function generateReport(results: Array<{id: string, fileName: string, success: boolean, error?: string}>) {
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  
  const report = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    success: successCount,
    failed: failCount,
    failedItems: results.filter(r => !r.success).map(r => ({
      id: r.id,
      error: r.error
    }))
  }
  
  const outputPath = path.join(CONFIG.OUTPUT_DIR, 'generation-report.json')
  await fs.writeJson(outputPath, report, { spaces: 2 })
  
  console.log(`\n📊 生成报告:`)
  console.log(`  总计: ${report.total}`)
  console.log(`  成功: ${report.success} ✓`)
  console.log(`  失败: ${report.failed} ✗`)
  
  if (report.failedItems.length > 0) {
    console.log(`\n  失败项:`)
    report.failedItems.forEach(item => {
      console.log(`    - ${item.id}: ${item.error}`)
    })
  }
  
  console.log(`\n✓ 详细报告已保存: ${outputPath}`)
}

/**
 * 生成小程序代码更新文件
 */
async function generateCodeUpdate(mapping: Record<string, string>) {
  // 生成可以直接复制到故事数据文件的代码
  const codeUpdate = Object.entries(mapping).map(([id, url]) => 
    `    ttsAudio: '${url}'`
  )
  
  const outputPath = path.join(CONFIG.OUTPUT_DIR, 'code-update.txt')
  await fs.writeFile(outputPath, codeUpdate.join('\n'))
  
  console.log(`\n✓ 代码更新文件已生成: ${outputPath}`)
  console.log('  将此内容复制到 libai-chengdu.ts 中对应节点的 ttsAudio 字段')
}

// ==================== 主函数 ====================

async function main() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║    李白·成都寻梦记 - TTS批量生成工具    ║')
  console.log('╚════════════════════════════════════════╝\n')
  
  // 1. 确保输出目录存在
  await ensureOutputDir()
  
  // 2. 生成输入文件
  const inputData = await generateTTSInputFile()
  
  // 3. 批量生成音频
  const results = await batchGenerateAudios(STORY_DIALOGUES)
  
  // 4. 生成URL映射
  const mapping = await generateUrlMapping(results)
  
  // 5. 生成报告
  await generateReport(results)
  
  // 6. 生成代码更新文件
  await generateCodeUpdate(mapping)
  
  console.log('\n✨ 全部完成！')
  console.log(`\n下一步:`)
  console.log(`1. 将 ${CONFIG.OUTPUT_DIR} 中的音频文件上传到微信云存储`)
  console.log(`2. 复制 code-update.txt 中的内容到故事数据文件`)
  console.log(`3. 更新 src/services/story-tts.ts 中的 API 配置`)
}

// 运行
main().catch(console.error)
