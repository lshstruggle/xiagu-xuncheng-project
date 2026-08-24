#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const repositoryRoot = path.resolve(__dirname, '../..')
const miniProgramRoot = path.join(repositoryRoot, 'xiagu-miniprogram')
const miniRequire = createRequire(path.join(miniProgramRoot, 'package.json'))
const babel = miniRequire('@babel/core')
const presetTypeScript = miniRequire('@babel/preset-typescript')
const transformCommonJS = miniRequire('@babel/plugin-transform-modules-commonjs')

const sourcePath = path.join(
  miniProgramRoot,
  'src/data/stories/libai-chengdu.ts'
)
const outputPath = path.join(
  repositoryRoot,
  'xiagu-server/seeds/stories/libai-chengdu.json'
)

const source = fs.readFileSync(sourcePath, 'utf8')
const transformed = babel.transformSync(source, {
  filename: sourcePath,
  presets: [[presetTypeScript, { allExtensions: true }]],
  plugins: [transformCommonJS],
  babelrc: false,
  configFile: false
})

const storyModule = { exports: {} }
const loadStory = new Function('exports', 'module', transformed.code)
loadStory(storyModule.exports, storyModule)
const story = storyModule.exports.libaiChengduStory

if (!story || !story.id || !story.nodes) {
  throw new Error('story module did not export libaiChengduStory')
}

function rewardItems(node) {
  const sourceReward = node.checkinReward || node.ending?.rewards
  if (!sourceReward) return undefined

  const items = []
  for (const fragment of sourceReward.fragments || []) {
    items.push({ type: 'story_fragment', id: fragment, name: fragment })
  }
  for (const poetryLine of sourceReward.poetryLines || []) {
    items.push({ type: 'poetry_line', id: poetryLine, name: poetryLine })
  }
  if (sourceReward.badge) {
    items.push({ type: 'badge', id: sourceReward.badge, name: sourceReward.badge })
  }

  return {
    hero_fragments: 0,
    skin_fragments: 0,
    bond_value: sourceReward.bondPoints || 0,
    items
  }
}

function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  )
}

const nodes = Object.fromEntries(
  Object.entries(story.nodes).map(([nodeID, node]) => [nodeID, compact({
    id: node.id,
    type: node.type,
    chapter: node.chapter,
    is_key_node: node.isKeyNode,
    location: node.location,
    dialog: node.dialog,
    next_node_id: node.nextNodeId,
    choices: node.choices?.map(choice => compact({
      id: choice.id,
      text: choice.text,
      next_node_id: choice.nextNodeId,
      condition: choice.condition
    })),
    reward: rewardItems(node),
    ending: node.ending,
    bgm: node.bgm,
    bg_image: node.bgImage
  })])
)

const firstChapter = story.chapters?.[0]
const document = {
  _id: story.id,
  hero_id: story.heroId,
  hero_name: story.heroName,
  title: story.title,
  subtitle: story.subtitle,
  description: story.description,
  cover_image: story.coverImage,
  version: 1,
  start_node_id: firstChapter?.nodes?.[0] || '',
  chapters: (story.chapters || []).map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    subtitle: chapter.subtitle,
    location_name: chapter.locationName,
    nodes: chapter.nodes,
    required: Boolean(chapter.required)
  })),
  nodes,
  total_duration: story.totalDuration,
  difficulty: story.difficulty,
  status: 'active'
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${JSON.stringify([document], null, 2)}\n`)
console.log(`Story seed exported: ${outputPath}`)
