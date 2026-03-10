const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const FormData = require('form-data');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  packageJsonPath: path.join(__dirname, '../package.json'),
  buildGradlePath: path.join(__dirname, '../android/app/build.gradle'),
  apkPath: path.join(__dirname, '../android/app/build/outputs/apk/release/app-release.apk'),
};

// 从 .env.production 读取 API_BASE_URL
function getApiBaseUrl() {
  const envPath = path.join(__dirname, '../.env.production');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/API_BASE_URL=(.+)/);
    if (match) return match[1].trim().replace(/\/$/, '');
  }
  throw new Error('API_BASE_URL not found. Ensure .env.production exists with API_BASE_URL.');
}

// 读取当前版本
function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(CONFIG.packageJsonPath, 'utf8'));
  return pkg.version;
}

function incrementVersion(version, type = 'patch') {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function gitTagExists(version, projectRoot) {
  try {
    execSync(`git show-ref --tags --verify --quiet refs/tags/v${version}`, {
      cwd: projectRoot,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function syncRemoteGitState(projectRoot) {
  try {
    execSync('git fetch origin main --tags --prune', { cwd: projectRoot, stdio: 'pipe' });
    console.log('📥 已同步远程 main 和 tags');
  } catch (error) {
    console.warn('⚠️ 同步远程 Git 信息失败，继续使用本地状态');
  }
}

// 递增版本号
function bumpVersion(type = 'patch', projectRoot) {
  const pkg = JSON.parse(fs.readFileSync(CONFIG.packageJsonPath, 'utf8'));
  const currentVersion = pkg.version;
  let newVersion = incrementVersion(currentVersion, type);

  while (projectRoot && gitTagExists(newVersion, projectRoot)) {
    console.log(`⚠️ Git Tag v${newVersion} 已存在，自动递增版本号`);
    newVersion = incrementVersion(newVersion, type);
  }

  pkg.version = newVersion;
  fs.writeFileSync(CONFIG.packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`📦 版本号: ${currentVersion} -> ${newVersion}`);
  return newVersion;
}

// 版本号转 versionCode
function versionToCode(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return major * 10000 + minor * 100 + patch;
}

// 更新 Android build.gradle
function updateAndroidVersion(version) {
  let gradle = fs.readFileSync(CONFIG.buildGradlePath, 'utf8');
  const versionCode = versionToCode(version);

  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);

  fs.writeFileSync(CONFIG.buildGradlePath, gradle);
  console.log(`🤖 Android 版本: ${version} (versionCode: ${versionCode})`);
}

// 打包 APK
function buildApk() {
  console.log('🔨 开始打包 APK...');
  const androidDir = path.join(__dirname, '..', 'android');
  const isWindows = process.platform === 'win32';
  const gradlew = isWindows ? 'gradlew.bat' : './gradlew';

  // Linux/CI 环境需要给 gradlew 加可执行权限
  if (!isWindows) {
    execSync(`chmod +x ${gradlew}`, { cwd: androidDir });
  }

  execSync(`${gradlew} assembleRelease`, { stdio: 'inherit', cwd: androidDir });

  if (!fs.existsSync(CONFIG.apkPath)) {
    throw new Error('APK 文件未找到');
  }

  const stats = fs.statSync(CONFIG.apkPath);
  console.log(`✅ APK 打包完成 (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

// 上传 APK
function uploadApk(version, updateLog) {
  return new Promise((resolve, reject) => {
    console.log('📤 上传 APK...');

    const apiBaseUrl = getApiBaseUrl();
    const url = new URL(`${apiBaseUrl}/app-version/upload`);
    const isHttps = url.protocol === 'https:';

    const form = new FormData();
    form.append('file', fs.createReadStream(CONFIG.apkPath));
    form.append('version', version);
    form.append('updateLog', updateLog);
    form.append('forceUpdate', 'false');
    form.append('platform', 'android');

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: form.getHeaders(),
    };

    const client = isHttps ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ 上传成功');
            resolve(result);
          } else {
            reject(new Error(result.message || '上传失败'));
          }
        } catch (e) {
          reject(new Error(`解析响应失败: ${data}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

// 提交版本变更到 Git
function commitVersionChange(version, updateLog, isCI = false) {
  const projectRoot = path.join(__dirname, '..');
  const filesToCommit = [
    'package.json',
    'android/app/build.gradle',
  ];

  // 检查是否有版本相关文件变更
  const status = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
  const changedFiles = filesToCommit.filter(f => status.includes(f));

  if (changedFiles.length === 0) {
    console.log('⚠️ 没有版本文件变更需要提交');
    return;
  }

  // 暂存版本相关文件
  execSync(`git add ${changedFiles.join(' ')}`, { cwd: projectRoot, stdio: 'pipe' });

  // 构建提交消息（version: 前缀用于 CI 识别并跳过）
  const commitMsg = `version: v${version}\n\n- ${updateLog}`;
  execSync(`git commit -m "${commitMsg}"`, { cwd: projectRoot, stdio: 'pipe' });

  // 创建 Git Tag
  if (gitTagExists(version, projectRoot)) {
    console.log(`⚠️ Git Tag 已存在，跳过重复创建: v${version}`);
  } else {
    execSync(`git tag -a v${version} -m "v${version}: ${updateLog}"`, { cwd: projectRoot, stdio: 'pipe' });
    console.log(`🏷️  Git Tag 已创建: v${version}`);
  }

  console.log(`📝 Git 提交完成: v${version}`);

  // CI 模式下自动 push
  if (isCI) {
    console.log('📤 推送提交和版本标签...');
    execSync('git push origin HEAD:main --follow-tags', { cwd: projectRoot, stdio: 'pipe' });
    console.log('📤 已推送到远程仓库');
  }
}

// 主流程
async function main() {
  const args = process.argv.slice(2);
  const isCI = args.includes('--ci');
  const versionType = args.find(a => ['patch', 'minor', 'major'].includes(a)) || 'patch';
  const updateLog = args.find(a => !['patch', 'minor', 'major', '--ci'].includes(a)) || '修复 bug 和性能优化';

  console.log('\n🚀 开始发布流程\n');
  if (isCI) console.log('   (CI 模式)\n');

  try {
    const projectRoot = path.join(__dirname, '..');

    // 0. 同步远程 Git 信息，避免重复版本号 / 重复 tag
    syncRemoteGitState(projectRoot);

    // 1. 递增版本号
    const newVersion = bumpVersion(versionType, projectRoot);

    // 2. 更新 Android 版本
    updateAndroidVersion(newVersion);

    // 3. 打包 APK
    buildApk();

    // 4. 上传 APK 并创建版本记录
    const result = await uploadApk(newVersion, updateLog);

    // 5. 提交版本变更到 Git
    commitVersionChange(newVersion, updateLog, isCI);

    console.log('\n🎉 发布完成！');
    console.log(`   版本: ${newVersion}`);
    console.log(`   下载: ${result.downloadUrl}`);
  } catch (error) {
    console.error('\n❌ 发布失败:', error.message);
    process.exit(1);
  }
}

main();
