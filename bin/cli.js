#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template', '.claude');
const TARGET_DIR = path.join(process.cwd(), '.claude');
const SETTINGS_FILE = path.join(TARGET_DIR, 'settings.json');
const DEFAULT_URL = 'https://www.youtube.com/shorts';
const DEFAULT_BROWSER = 'Google Chrome';
const SUPPORTED_BROWSERS = ['Google Chrome', 'Safari', 'Microsoft Edge', 'Brave Browser'];

// dopamine-hooks-claude が所有する（= init で追加し、remove で消す）ファイルと設定キー。
const OWNED_HOOK_FILES = ['hooks/dopamine-open.sh', 'hooks/dopamine-close.sh'];
const OWNED_COMMAND_FILES = [
  'commands/dopamine-url.md',
  'commands/dopamine-browser.md',
  'commands/dopamine-on.md',
  'commands/dopamine-off.md',
];
const OWNED_FILES = [...OWNED_HOOK_FILES, ...OWNED_COMMAND_FILES];
const OWNED_ENV_KEYS = ['CLAUDE_DOPAMINE_URL', 'CLAUDE_DOPAMINE_DISABLE', 'CLAUDE_DOPAMINE_BROWSER'];
const OWNED_COMMAND_MARKERS = ['dopamine-open.sh', 'dopamine-close.sh'];

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
  console.log('  npx dopamine-hooks-claude init          .claude/ を作成 (既に有れば関連ファイルのみ追記) する');
  console.log('  npx dopamine-hooks-claude remove         導入した関連ファイル・設定だけを取り除く');
  console.log('  npx dopamine-hooks-claude on             フックを有効化する');
  console.log('  npx dopamine-hooks-claude off            フックを無効化する');
  console.log('  npx dopamine-hooks-claude url <url>      開くURLを変更する');
  console.log('  npx dopamine-hooks-claude browser <app>  開くブラウザを変更する ("Google Chrome" | "Safari" | "Microsoft Edge" | "Brave Browser")');
  console.log('  npx dopamine-hooks-claude status         現在の設定を表示する');
  console.log('');
  console.log('on/off/url/browser/status/remove はターミナルから直接実行してください。');
  console.log('Claude Code のスラッシュコマンド(/dopamine-off 等)経由だと、');
  console.log('コマンド送信自体が UserPromptSubmit を発火させるため、無効化が');
  console.log('反映される前に一度ページが開いてしまいます。それを避けたい場合は');
  console.log('こちらのCLIを使ってください。');
}

function printNextSteps() {
  console.log('次のステップ:');
  console.log('  1. macOS + Google Chrome (または Safari 等) が必要です');
  console.log('  2. このディレクトリで `claude` を起動してください');
  console.log('  3. 初回フック実行時にブラウザ / System Events の操作許可を求められたら許可してください');
  console.log('  4. `dopamine-hooks-claude on|off|url|browser|status|remove` で挙動を調整できます');
}

// incoming (テンプレート側) の env / hooks を、existing (既存 settings.json) を
// 壊さずにマージする。env は既存キーを優先し、無いキーだけ追加する。
// hooks は同じ command を持つエントリが既に無い場合だけ配列に追記する。
function mergeSettings(existing, incoming) {
  const merged = existing && typeof existing === 'object' ? JSON.parse(JSON.stringify(existing)) : {};

  merged.env = merged.env || {};
  for (const [key, value] of Object.entries(incoming.env || {})) {
    if (!(key in merged.env)) {
      merged.env[key] = value;
    }
  }

  merged.hooks = merged.hooks || {};
  for (const eventName of Object.keys(incoming.hooks || {})) {
    const existingGroups = merged.hooks[eventName] || [];
    const existingCommands = existingGroups.flatMap((g) => (g.hooks || []).map((h) => h.command));
    const newGroups = (incoming.hooks[eventName] || []).filter(
      (group) => !(group.hooks || []).some((h) => existingCommands.includes(h.command))
    );
    merged.hooks[eventName] = existingGroups.concat(newGroups);
  }

  return merged;
}

function cmdInit() {
  if (!fs.existsSync(TARGET_DIR)) {
    copyRecursive(TEMPLATE_DIR, TARGET_DIR);
    console.log('.claude/ を作成しました:');
    OWNED_FILES.forEach((f) => console.log(`  .claude/${f}`));
    console.log('  .claude/settings.json');
    console.log('');
    printNextSteps();
    return;
  }

  console.log(`${TARGET_DIR} は既に存在するため、dopamine-hooks-claude 関連ファイルのみ追記します。`);
  console.log('');

  const added = [];
  const skipped = [];
  for (const rel of OWNED_FILES) {
    const src = path.join(TEMPLATE_DIR, rel);
    const dest = path.join(TARGET_DIR, rel);
    if (fs.existsSync(dest)) {
      skipped.push(rel);
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    if (dest.endsWith('.sh')) {
      fs.chmodSync(dest, 0o755);
    }
    added.push(rel);
  }

  const templateSettings = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, 'settings.json'), 'utf8'));
  const existingSettings = fs.existsSync(SETTINGS_FILE)
    ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
    : {};
  saveSettings(mergeSettings(existingSettings, templateSettings));

  if (added.length) {
    console.log('追加したファイル:');
    added.forEach((f) => console.log(`  .claude/${f}`));
  }
  if (skipped.length) {
    console.log('既に存在したためスキップ（上書きしていません）:');
    skipped.forEach((f) => console.log(`  .claude/${f}`));
  }
  console.log('settings.json の env / hooks.UserPromptSubmit / hooks.Stop は、既存の設定を残したままマージしました。');
  console.log('');
  printNextSteps();
}

function cmdRemove() {
  if (!fs.existsSync(TARGET_DIR)) {
    console.log(`${TARGET_DIR} は存在しません。削除するものがありません。`);
    return;
  }

  const removedFiles = [];
  for (const rel of OWNED_FILES) {
    const dest = path.join(TARGET_DIR, rel);
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
      removedFiles.push(rel);
    }
  }

  for (const dir of ['hooks', 'commands']) {
    const dirPath = path.join(TARGET_DIR, dir);
    if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
      fs.rmdirSync(dirPath);
    }
  }

  let settingsChanged = false;
  if (fs.existsSync(SETTINGS_FILE)) {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));

    if (settings.env) {
      for (const key of OWNED_ENV_KEYS) {
        if (key in settings.env) {
          delete settings.env[key];
          settingsChanged = true;
        }
      }
      if (Object.keys(settings.env).length === 0) {
        delete settings.env;
      }
    }

    if (settings.hooks) {
      for (const eventName of Object.keys(settings.hooks)) {
        const before = settings.hooks[eventName].length;
        settings.hooks[eventName] = settings.hooks[eventName].filter(
          (group) =>
            !(group.hooks || []).some((h) =>
              OWNED_COMMAND_MARKERS.some((marker) => (h.command || '').includes(marker))
            )
        );
        if (settings.hooks[eventName].length !== before) {
          settingsChanged = true;
        }
        if (settings.hooks[eventName].length === 0) {
          delete settings.hooks[eventName];
        }
      }
      if (Object.keys(settings.hooks).length === 0) {
        delete settings.hooks;
      }
    }

    if (settingsChanged) {
      saveSettings(settings);
    }
  }

  if (removedFiles.length === 0 && !settingsChanged) {
    console.log('dopamine-hooks-claude 関連の設定は見つかりませんでした（既に削除済み、または未導入です）。');
    return;
  }

  console.log('dopamine-hooks-claude 関連のファイル・設定を削除しました:');
  removedFiles.forEach((f) => console.log(`  .claude/${f}`));
  if (settingsChanged) {
    console.log('  settings.json 内の env.CLAUDE_DOPAMINE_* および関連フック登録');
  }
  console.log('');
  console.log('他のフックや設定には触れていません。');
}

function loadSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    console.error(`エラー: ${SETTINGS_FILE} が見つかりません。先に \`dopamine-hooks-claude init\` を実行してください。`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
}

function saveSettings(settings) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
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

function cmdBrowser(browser) {
  if (!browser || !SUPPORTED_BROWSERS.includes(browser)) {
    console.error(`エラー: サポートしているブラウザは次のいずれかのみです: ${SUPPORTED_BROWSERS.map((b) => `"${b}"`).join(', ')}`);
    console.error('（フック側のAppleScript実装がこの4つにしか対応していないため、他の名前を指定しても動作しません）');
    console.error('使い方: dopamine-hooks-claude browser <app>');
    process.exit(1);
  }
  const settings = loadSettings();
  settings.env = settings.env || {};
  settings.env.CLAUDE_DOPAMINE_BROWSER = browser;
  saveSettings(settings);
  console.log(`開くブラウザを ${browser} に変更しました。`);
}

function cmdStatus() {
  const settings = loadSettings();
  const env = settings.env || {};
  const disabled = env.CLAUDE_DOPAMINE_DISABLE === '1';
  console.log(`状態: ${disabled ? '無効 (off)' : '有効 (on)'}`);
  console.log(`URL: ${env.CLAUDE_DOPAMINE_URL || `(既定値: ${DEFAULT_URL})`}`);
  console.log(`ブラウザ: ${env.CLAUDE_DOPAMINE_BROWSER || `(既定値: ${DEFAULT_BROWSER})`}`);
}

function main() {
  const [cmd, arg] = process.argv.slice(2);

  switch (cmd) {
    case 'init':
      return cmdInit();
    case 'remove':
    case 'uninstall':
      return cmdRemove();
    case 'on':
      return cmdOn();
    case 'off':
      return cmdOff();
    case 'url':
      return cmdUrl(arg);
    case 'browser':
      return cmdBrowser(arg);
    case 'status':
      return cmdStatus();
    default:
      printUsage();
      process.exit(cmd ? 1 : 0);
  }
}

main();
