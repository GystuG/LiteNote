/**
 * 热更新 Bundle 发布脚本
 *
 * 用法：node scripts/release-bundle.js [--dev] [--force] [更新日志]
 *
 * 流程：
 * 1. 递增 bundleVersion
 * 2. 构建 JS bundle (react-native bundle)
 * 3. Hermes 编译为字节码
 * 4. 将 bundle + assets 打成 zip
 * 5. 计算 SHA256
 * 6. 上传到后端 POST /hot-update/upload
 * 7. 更新 bundle-version.json
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const FormData = require('form-data');
const AdmZip = require('adm-zip');

// 路径配置
const ROOT = path.join(__dirname, '..');
const CONFIG = {
  bundleVersionPath: path.join(ROOT, 'bundle-version.json'),
  packageJsonPath: path.join(ROOT, 'package.json'),
  bundleOutputDir: path.join(ROOT, 'bundle-output'),
  bundleFile: 'index.android.bundle',
};

// ======= 工具函数 =======

function getApiBaseUrl(isDev) {
  const envFile = isDev ? '.env.development' : '.env.production';
  const envPath = path.join(ROOT, envFile);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/API_BASE_URL=(.+)/);
    if (match) return match[1].trim().replace(/\/$/, '');
  }
  return 'http://YOUR_SERVER_IP:3006';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function computeSHA256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function versionToCode(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return major * 10000 + minor * 100 + patch;
}

// ======= 构建步骤 =======

function buildBundle() {
  console.log('1. 构建 JS Bundle...');
  ensureDir(CONFIG.bundleOutputDir);

  const bundlePath = path.join(CONFIG.bundleOutputDir, CONFIG.bundleFile);
  const assetsDir = path.join(CONFIG.bundleOutputDir, 'assets');

  // 清理旧的 assets 目录，避免残留文件
  if (fs.existsSync(assetsDir)) {
    fs.rmSync(assetsDir, { recursive: true });
  }
  ensureDir(assetsDir);

  execSync(
    `npx react-native bundle ` +
    `--platform android ` +
    `--dev false ` +
    `--entry-file index.js ` +
    `--bundle-output "${bundlePath}" ` +
    `--assets-dest "${assetsDir}"`,
    { cwd: ROOT, stdio: 'inherit' },
  );

  if (!fs.existsSync(bundlePath)) {
    throw new Error('Bundle 构建失败：文件不存在');
  }

  const stats = fs.statSync(bundlePath);
  console.log(`   Bundle 大小: ${(stats.size / 1024).toFixed(1)} KB`);
  return bundlePath;
}

function compileHermes(bundlePath) {
  console.log('2. Hermes 编译...');

  const possiblePaths = [
    path.join(ROOT, 'node_modules/react-native/sdks/hermesc/win64-bin/hermesc.exe'),
    path.join(ROOT, 'node_modules/react-native/sdks/hermesc/linux64-bin/hermesc'),
    path.join(ROOT, 'node_modules/react-native/sdks/hermesc/osx-bin/hermesc'),
  ];

  let hermescPath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      hermescPath = p;
      break;
    }
  }

  if (!hermescPath) {
    console.log('   hermesc 未找到，跳过 Hermes 编译（使用 JS 文本 bundle）');
    return bundlePath;
  }

  const outputPath = bundlePath + '.hbc';
  execSync(
    `"${hermescPath}" -emit-binary -out "${outputPath}" "${bundlePath}"`,
    { cwd: ROOT, stdio: 'inherit' },
  );

  fs.renameSync(outputPath, bundlePath);
  const stats = fs.statSync(bundlePath);
  console.log(`   Hermes 编译完成: ${(stats.size / 1024).toFixed(1)} KB`);
  return bundlePath;
}

/**
 * 将 bundle 打成 zip
 */
function createZip(bundlePath, bundleVersion) {
  console.log('3. 打包 zip...');

  const zip = new AdmZip();
  zip.addLocalFile(bundlePath);

  const zipPath = path.join(CONFIG.bundleOutputDir, `business-v${bundleVersion}.zip`);
  zip.writeZip(zipPath);

  const bundleSize = fs.statSync(bundlePath).size;
  const zipSize = fs.statSync(zipPath).size;
  console.log(`   Bundle: ${(bundleSize / 1024).toFixed(1)} KB → Zip: ${(zipSize / 1024).toFixed(1)} KB`);
  return zipPath;
}

function uploadBundle(zipPath, metadata, isDev) {
  return new Promise((resolve, reject) => {
    const apiBaseUrl = getApiBaseUrl(isDev);
    console.log(`5. 上传 Bundle... (${apiBaseUrl})`);

    const url = new URL(`${apiBaseUrl}/hot-update/upload`);
    const isHttps = url.protocol === 'https:';

    const form = new FormData();
    form.append('file', fs.createReadStream(zipPath), {
      filename: path.basename(zipPath),
      contentType: 'application/zip',
    });
    form.append('bundleVersion', String(metadata.bundleVersion));
    form.append('targetVersion', metadata.targetVersion);
    form.append('minNativeCode', String(metadata.minNativeCode));
    form.append('bundleType', metadata.bundleType || 'business');
    form.append('fileHash', metadata.fileHash);
    form.append('updateLog', metadata.updateLog);
    form.append('forceUpdate', String(metadata.forceUpdate || false));
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
            console.log('   上传成功');
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

// ======= 主流程 =======

async function main() {
  const args = process.argv.slice(2);
  const forceUpdate = args.includes('--force');
  const isDev = args.includes('--dev');
  const updateLog = args.find(a => !a.startsWith('--')) || '修复 bug 和性能优化';

  console.log('\n========================================');
  console.log('  Hot Update Bundle 发布');
  console.log('========================================\n');

  try {
    // 读取配置
    const bundleVersionConfig = readJson(CONFIG.bundleVersionPath);
    const pkg = readJson(CONFIG.packageJsonPath);
    const nativeVersion = pkg.version;
    const nativeCode = versionToCode(nativeVersion);
    const newBundleVersion = bundleVersionConfig.bundleVersion + 1;

    console.log(`  原生版本: ${nativeVersion} (code: ${nativeCode})`);
    console.log(`  Bundle 版本: ${bundleVersionConfig.bundleVersion} -> ${newBundleVersion}`);
    console.log(`  更新日志: ${updateLog}`);
    console.log(`  强制更新: ${forceUpdate}`);
    console.log(`  目标环境: ${isDev ? '开发' : '生产'}`);
    console.log('');

    // 更新 bundle-version.json（构建前更新，这样会被编译进 bundle）
    bundleVersionConfig.bundleVersion = newBundleVersion;
    bundleVersionConfig.lastNativeVersion = nativeVersion;
    writeJson(CONFIG.bundleVersionPath, bundleVersionConfig);

    // 1. 构建 bundle
    const bundlePath = buildBundle();

    // 2. Hermes 编译
    compileHermes(bundlePath);

    // 3. 打 zip (bundle + assets)
    const zipPath = createZip(bundlePath, newBundleVersion);

    // 4. 计算 zip 的 SHA256
    console.log('4. 计算 SHA256...');
    const fileHash = computeSHA256(zipPath);
    console.log(`   SHA256: ${fileHash}`);

    // 5. 上传
    await uploadBundle(zipPath, {
      bundleVersion: newBundleVersion,
      targetVersion: nativeVersion,
      minNativeCode: nativeCode,
      bundleType: 'business',
      fileHash,
      updateLog,
      forceUpdate,
    }, isDev);

    // 6. 完成
    console.log('\n========================================');
    console.log('  发布成功！');
    console.log(`  Bundle 版本: ${newBundleVersion}`);
    console.log(`  文件哈希: ${fileHash.substring(0, 16)}...`);
    console.log('========================================\n');
  } catch (error) {
    console.error('\n发布失败:', error.message);

    // 回滚 bundle-version.json
    try {
      const config = readJson(CONFIG.bundleVersionPath);
      config.bundleVersion = config.bundleVersion - 1;
      writeJson(CONFIG.bundleVersionPath, config);
      console.log('已回滚 bundle-version.json');
    } catch {
      // ignore
    }

    process.exit(1);
  }
}

main();
