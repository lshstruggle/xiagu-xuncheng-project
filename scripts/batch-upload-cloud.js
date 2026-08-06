#!/usr/bin/env node
/**
 * 批量上传TTS音频到腾讯云存储
 * 使用 @cloudbase/node-sdk
 */

const fs = require('fs');
const path = require('path');

// 云开发配置
const CLOUD_ENV = 'xiagu-miniprogram-d7dbpz54358b2f';
const BASE_LOCAL_DIR = '/Users/lsh/服创代码/tts_output/libai-story';
const BASE_CLOUD_DIR = 'tts/libai-story';

// 递归获取所有wav文件
function getAllWavFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllWavFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.wav')) {
      const relativePath = path.relative(BASE_LOCAL_DIR, fullPath);
      arrayOfFiles.push({
        localPath: fullPath,
        cloudPath: `${BASE_CLOUD_DIR}/${relativePath}`,
        chapter: path.dirname(relativePath),
        filename: file
      });
    }
  });

  return arrayOfFiles;
}

// 生成云开发控制台批量上传命令
function generateUploadCommands() {
  const files = getAllWavFiles(BASE_LOCAL_DIR);
  
  console.log('='.repeat(60));
  console.log('批量上传命令生成');
  console.log('='.repeat(60));
  console.log(`\n找到 ${files.length} 个音频文件\n`);

  // 按章节分组
  const chapters = {};
  files.forEach(file => {
    if (!chapters[file.chapter]) {
      chapters[file.chapter] = [];
    }
    chapters[file.chapter].push(file);
  });

  // 生成上传脚本
  console.log('方式1: 使用云开发Node SDK (推荐)');
  console.log('-'.repeat(60));
  console.log(`
1. 安装依赖:
   cd /Users/lsh/服创代码
   npm install @cloudbase/node-sdk

2. 创建上传脚本 upload.js:
`);

  const sdkCode = `const cloudbase = require('@cloudbase/node-sdk');
const fs = require('fs');
const path = require('path');

const app = cloudbase.init({
  env: '${CLOUD_ENV}'
});

const db = app.database();
const storage = app.storage();

async function uploadFile(localPath, cloudPath) {
  try {
    const result = await storage.uploadFile({
      cloudPath: cloudPath,
      fileContent: fs.createReadStream(localPath)
    });
    console.log('✓ 上传成功:', cloudPath);
    return result;
  } catch (err) {
    console.error('✗ 上传失败:', cloudPath, err.message);
    throw err;
  }
}

async function batchUpload() {
  const files = ${JSON.stringify(files, null, 2)};
  
  console.log('开始上传', files.length, '个文件...\\n');
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(\`[\${i + 1}/\${files.length}] \${file.filename}\`);
    await uploadFile(file.localPath, file.cloudPath);
  }
  
  console.log('\\n上传完成!');
}

batchUpload().catch(console.error);
`;

  console.log(sdkCode);

  // 方式2: 微信开发者工具
  console.log('\n方式2: 微信开发者工具手动上传');
  console.log('-'.repeat(60));
  console.log(`
1. 打开微信开发者工具
2. 点击左侧"云开发"图标
3. 选择"存储"标签
4. 点击"上传文件"按钮
5. 选择以下文件夹中的音频文件:
`);

  Object.keys(chapters).sort().forEach(chapter => {
    const count = chapters[chapter].length;
    console.log(`   ${chapter}/ (${count}个文件)`);
  });

  // 方式3: 使用云开发CLI
  console.log('\n方式3: 使用云开发CLI (如果已安装)');
  console.log('-'.repeat(60));
  console.log(`
# 安装CLI
npm install -g @cloudbase/cli

# 登录
cloudbase login

# 批量上传
cloudbase storage upload /Users/lsh/服创代码/tts_output/libai-story tts/libai-story
`);

  // 保存文件列表
  const listPath = path.join(__dirname, '../tts_output/upload-files.json');
  fs.writeFileSync(listPath, JSON.stringify(files, null, 2), 'utf-8');
  console.log(`\n文件列表已保存: ${listPath}`);

  return files;
}

// 生成可直接运行的SDK脚本
function generateRunnableScript() {
  const files = getAllWavFiles(BASE_LOCAL_DIR);
  
  const scriptContent = `const cloudbase = require('@cloudbase/node-sdk');
const fs = require('fs');
const path = require('path');

const app = cloudbase.init({
  env: '${CLOUD_ENV}'
});

const storage = app.storage();

const files = ${JSON.stringify(files, null, 2)};

async function uploadFile(localPath, cloudPath) {
  try {
    const result = await storage.uploadFile({
      cloudPath: cloudPath,
      fileContent: fs.createReadStream(localPath)
    });
    console.log('✓', cloudPath);
    return result;
  } catch (err) {
    console.error('✗', cloudPath, err.message);
    throw err;
  }
}

async function batchUpload() {
  console.log('开始上传', files.length, '个文件...\\n');
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    process.stdout.write(\`[\${i + 1}/\${files.length}] \${file.filename} ... \`);
    
    try {
      await uploadFile(file.localPath, file.cloudPath);
      success++;
    } catch (err) {
      failed++;
    }
  }
  
  console.log('\\n--------------------------------');
  console.log('上传完成!');
  console.log(\`成功: \${success}/\${files.length}\`);
  console.log(\`失败: \${failed}/\${files.length}\`);
}

batchUpload().catch(console.error);
`;

  const scriptPath = path.join(__dirname, '../upload-to-cloud-run.js');
  fs.writeFileSync(scriptPath, scriptContent, 'utf-8');
  console.log(`\n可执行脚本已生成: ${scriptPath}`);
  console.log('\n运行方式:');
  console.log('  cd /Users/lsh/服创代码');
  console.log('  npm install @cloudbase/node-sdk');
  console.log('  node upload-to-cloud-run.js');
}

// 主函数
console.log('\n');
generateUploadCommands();
generateRunnableScript();
console.log('\n');
