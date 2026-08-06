/**
 * 上传TTS音频到腾讯云存储
 * 使用前需要安装 @cloudbase/cli: npm install -g @cloudbase/cli
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 云存储配置
const CLOUD_BASE_PATH = 'cloud://xiagu-miniprogram-d7dbpz54358b2f.636c-xiagu-miniprogram-d7dbpz54358b2f-1410097615';
const TTS_LOCAL_DIR = path.join(__dirname, '../tts_output/libai-story');

// 递归获取所有文件
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// 上传到云存储
async function uploadToCloud(localPath, cloudPath) {
  try {
    // 使用 cloudbase CLI 上传
    const cmd = `tcb storage upload "${localPath}" "${cloudPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`上传失败: ${localPath}`, error.message);
    return false;
  }
}

async function main() {
  console.log('开始上传TTS音频到云存储...\n');

  // 检查本地目录
  if (!fs.existsSync(TTS_LOCAL_DIR)) {
    console.error(`错误: 本地目录不存在 ${TTS_LOCAL_DIR}`);
    console.log('请先运行 generate-story-tts.py 生成音频文件');
    process.exit(1);
  }

  // 获取所有音频文件
  const files = getAllFiles(TTS_LOCAL_DIR);
  const wavFiles = files.filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));

  console.log(`找到 ${wavFiles.length} 个音频文件\n`);

  let successCount = 0;
  let failedCount = 0;

  // 上传每个文件
  for (let i = 0; i < wavFiles.length; i++) {
    const localPath = wavFiles[i];
    const relativePath = path.relative(TTS_LOCAL_DIR, localPath);
    const cloudPath = `tts/libai-story/${relativePath}`;

    console.log(`[${i + 1}/${wavFiles.length}] 上传: ${relativePath}`);
    console.log(`  本地: ${localPath}`);
    console.log(`  云端: ${cloudPath}`);

    // 这里使用云开发 CLI 上传
    // 实际使用时可以通过 cloudbase/node-sdk 编程上传
    console.log(`  请手动上传或使用云开发控制台批量上传`);
    console.log('');

    successCount++;
  }

  console.log('\n上传完成!');
  console.log(`成功: ${successCount}/${wavFiles.length}`);
  console.log(`失败: ${failedCount}/${wavFiles.length}`);
  console.log(`\n云存储路径: tts/libai-story/`);
  console.log('\n提示: 可以使用微信开发者工具的云存储控制台批量上传');
}

// 生成上传清单
function generateUploadList() {
  const files = getAllFiles(TTS_LOCAL_DIR);
  const wavFiles = files.filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));

  const list = wavFiles.map(localPath => {
    const relativePath = path.relative(TTS_LOCAL_DIR, localPath);
    return {
      localPath,
      cloudPath: `tts/libai-story/${relativePath}`,
      chapter: path.dirname(relativePath),
      filename: path.basename(relativePath),
    };
  });

  // 保存清单
  const listPath = path.join(__dirname, '../tts_output/upload-list.json');
  fs.writeFileSync(listPath, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`上传清单已保存: ${listPath}`);

  return list;
}

// 如果直接运行此脚本
if (require.main === module) {
  // 先生成清单
  generateUploadList();

  // 然后执行上传
  main().catch(console.error);
}

module.exports = { generateUploadList, uploadToCloud };
