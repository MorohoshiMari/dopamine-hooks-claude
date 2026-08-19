#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template', '.claude');
const TARGET_DIR = path.join(process.cwd(), '.claude');

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
  console.log('使い方: npx dopamine-hooks-claude init');
  console.log('  カレントディレクトリに .claude/ を作成し、Claude Code 用の');
  console.log('  「気分転換」フック(UserPromptSubmit/Stop)を導入します。');
}

function main() {
  const cmd = process.argv[2];

  if (cmd !== 'init') {
    printUsage();
    process.exit(cmd ? 1 : 0);
  }

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
  console.log('  4. /dopamine-url <url>, /dopamine-on, /dopamine-off で挙動を調整できます');
}

main();
