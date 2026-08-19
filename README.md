# dopamine-hooks-claude

[Claude Code](https://claude.com/claude-code) 用の「気分転換」フック集です。

- `UserPromptSubmit`（プロンプト送信時）に発火し、新しい Chrome ウィンドウで指定した動画（既定は YouTube Shorts フィード）を開きます
- `Stop`（AIの応答生成が完了した時）に発火し、そのウィンドウを閉じてプロンプト送信直前に最前面だったアプリへフォーカスを戻します

生成AIの応答を待つ間、少しだけ気分転換したい人向けのプロジェクト固有フックです。

## 動作環境

- macOS
- Google Chrome
- Node.js >= 16（導入コマンド実行時のみ）

初回フック実行時、システム設定 → プライバシーとセキュリティ → オートメーション で、ターミナル（または利用しているシェルアプリ）から **Google Chrome** と **System Events** への操作許可を求められます。許可してください。

## 導入方法

導入したいプロジェクトのルートディレクトリで実行します。

```bash
npx dopamine-hooks-claude init
# or
yarn dlx dopamine-hooks-claude init
# or
pnpm dlx dopamine-hooks-claude init
```

`.claude/` 以下に以下のファイルが作成されます。既に `.claude/` が存在する場合は上書きせずエラー終了します。

```
.claude/
├── settings.json          # フックの登録 + 開くURLの既定値
├── hooks/
│   ├── dopamine-open.sh   # UserPromptSubmit hook
│   └── dopamine-close.sh  # Stop hook
└── commands/
    ├── dopamine-url.md    # /dopamine-url <url> — 開くURLを変更
    ├── dopamine-on.md     # /dopamine-on        — フックを有効化
    └── dopamine-off.md    # /dopamine-off       — フックを無効化
```

導入後、そのディレクトリで `claude` を起動してください。

> 既に起動中の Claude Code セッションに後から `.claude/` を追加した場合は、一度セッションを再起動してください（設定ファイル監視の仕様上、セッション起動後に新規作成された `settings.json` は自動検知されません）。最初から `.claude/` がある状態で `claude` を起動する場合は再起動不要です。

## 使い方

導入後、Claude Code のプロンプトから以下のスラッシュコマンドで挙動を調整できます。

| コマンド | 内容 |
|---|---|
| `/dopamine-url <url>` | 開くURLを変更する |
| `/dopamine-on` | フックを有効化する |
| `/dopamine-off` | フックを無効化する（何も開かなくなる） |

設定は `.claude/settings.json` の `env.CLAUDE_DOPAMINE_URL` / `env.CLAUDE_DOPAMINE_DISABLE` に保存され、フック実行のたびに読み直されるため、変更は Claude Code の再起動なしで次回のプロンプト送信から反映されます。

## ライセンス

MIT
