#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template', '.claude');
const TARGET_DIR = path.join(process.cwd(), '.claude');
const SETTINGS_FILE = path.join(TARGET_DIR, 'settings.json');
const DEFAULT_URL = 'https://www.youtube.com/shorts';

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.copyFileSync(src, dest);
  if (src.endsWith('.sh')) {
    fs.chmodSync(dest, 0o755);
  }
}

function printUsage() {
  console.log('使い方:');
  console.log('  npx dopamine-hooks-claude init         .claude/ を作成して導入する');
  console.log('  npx dopamine-hooks-claude on            フックを有効化する');
  console.log('  npx dopamine-hooks-claude off           フックを無効化する');
  console.log('  npx dopamine-hooks-claude url <url>     開くURLを変更する');
  console.log('  npx dopamine-hooks-claude status         現在の設定を表示する');
  console.log('');
  console.log('on/off/url/status はターミナルから直接実行してください。');
  console.log('Claude Code のスラッシュコマンド(/dopamine-off 等)経由だと、');
  console.log('コマンド送信自体が UserPromptSubmit を発火させるため、無効化が');
  console.log('反映される前に一度ページが開いてしまいます。それを避けたい場合は');
  console.log('こちらのCLIを使ってください。');
}

function cmdInit() {
  if (fs.existsSync(TARGET_DIR)) {
    console.error(`エラー: ${TARGET_DIR} は既に存在するため中断しました。`);
    console.error('上書きは行いません。必要なファイルを手動でマージしてください。');
    process.exit(1);
  }

  copyRecursive(TEMPLATE_DIR, TARGET_DIR);

  console.log('.claude/ を作成しました:');
  console.log('  .claude/hooks/dopamine-open.sh');
  console.log('  .claude/hooks/dopamine-close.sh');
  console.log('  .claude/commands/dopamine-url.md');
  console.log('  .claude/commands/dopamine-on.md');
  console.log('  .claude/commands/dopamine-off.md');
  console.log('  .claude/settings.json');
  console.log('');
  console.log('次のステップ:');
  console.log('  1. macOS + Google Chrome が必要です');
  console.log('  2. このディレクトリで `claude` を起動してください');
  console.log('  3. 初回フック実行時に Chrome / System Events の操作許可を求められたら許可してください');
  console.log('  4. `dopamine-hooks-claude on|off|url|status` で挙動を調整できます');
}

function loadSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    console.error(`エラー: ${SETTINGS_FILE} が見つかりません。先に \`dopamine-hooks-claude init\` を実行してください。`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + '\n');
}

function cmdOn() {
  const settings = loadSettings();
  settings.env = settings.env || {};
  settings.env.CLAUDE_DOPAMINE_DISABLE = '0';
  saveSettings(settings);
  console.log('気分転換フックを有効化しました。');
}

function cmdOff() {
  const settings = loadSettings();
  settings.env = settings.env || {};
  settings.env.CLAUDE_DOPAMINE_DISABLE = '1';
  saveSettings(settings);
  console.log('気分転換フックを無効化しました。');
}

function cmdUrl(url) {
  if (!url || !/^https?:\/\//.test(url)) {
    console.error('エラー: 有効な URL(http:// または https:// で始まる)を指定してください。');
    console.error('使い方: dopamine-hooks-claude url <url>');
    process.exit(1);
  }
  const settings = loadSettings();
  settings.env = settings.env || {};
  settings.env.CLAUDE_DOPAMINE_URL = url;
  saveSettings(settings);
  console.log(`遷移先 URL を ${url} に変更しました。`);
}

function cmdStatus() {
  const settings = loadSettings();
  const env = settings.env || {};
  const disabled = env.CLAUDE_DOPAMINE_DISABLE === '1';
  console.log(`状態: ${disabled ? '無効 (off)' : '有効 (on)'}`);
  console.log(`URL: ${env.CLAUDE_DOPAMINE_URL || `(既定値: ${DEFAULT_URL})`}`);
}

function main() {
  const [cmd, arg] = process.argv.slice(2);

  switch (cmd) {
    case 'init':
      return cmdInit();
    case 'on':
      return cmdOn();
    case 'off':
      return cmdOff();
    case 'url':
      return cmdUrl(arg);
    case 'status':
      return cmdStatus();
    default:
      printUsage();
      process.exit(cmd ? 1 : 0);
  }
}

main();
