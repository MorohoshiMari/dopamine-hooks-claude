# dopamine-hooks-claude

[Claude Code](https://claude.com/claude-code) 用の「気分転換」フック集です。

- `UserPromptSubmit`（プロンプト送信時）に発火し、新しいブラウザウィンドウで指定したURL（既定は YouTube Shorts フィード、既定ブラウザは Google Chrome）を開きます
- `Stop`（AIの応答生成が完了した時）に発火し、そのウィンドウを閉じてプロンプト送信直前に最前面だったアプリへフォーカスを戻します

生成AIの応答を待つ間、少しだけ気分転換したい人向けのプロジェクト固有フックです。

## 動作環境

- macOS
- Google Chrome または Safari（`Microsoft Edge` / `Brave Browser` など Chrome と同じ AppleScript辞書を持つブラウザも指定可能）
- Node.js >= 16（導入コマンド実行時のみ）

初回フック実行時、システム設定 → プライバシーとセキュリティ → オートメーション で、ターミナル（または利用しているシェルアプリ）から使用するブラウザと **System Events** への操作許可を求められます。許可してください。

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
    ├── dopamine-url.md      # /dopamine-url <url>     — 開くURLを変更
    ├── dopamine-browser.md  # /dopamine-browser <app> — 開くブラウザを変更
    ├── dopamine-on.md       # /dopamine-on            — フックを有効化
    └── dopamine-off.md      # /dopamine-off           — フックを無効化
```

導入後、そのディレクトリで `claude` を起動してください。

> 既に起動中の Claude Code セッションに後から `.claude/` を追加した場合は、一度セッションを再起動してください（設定ファイル監視の仕様上、セッション起動後に新規作成された `settings.json` は自動検知されません）。最初から `.claude/` がある状態で `claude` を起動する場合は再起動不要です。

## 使い方

設定変更には2通りの方法があります。中身はどちらも同じで、`.claude/settings.json` の `env.CLAUDE_DOPAMINE_URL` / `env.CLAUDE_DOPAMINE_DISABLE` / `env.CLAUDE_DOPAMINE_BROWSER` を書き換えるだけです。変更はフック実行のたびに読み直されるため、Claude Code の再起動なしで次回のプロンプト送信から反映されます。

### 方法1: ターミナルから直接実行（推奨）

```bash
npx dopamine-hooks-claude on                    # 有効化
npx dopamine-hooks-claude off                   # 無効化
npx dopamine-hooks-claude url <url>             # 開くURLを変更
npx dopamine-hooks-claude browser "Safari"      # 開くブラウザを変更（既定: "Google Chrome"）
npx dopamine-hooks-claude status                # 現在の設定を表示
```

### 方法2: Claude Code のスラッシュコマンド

| コマンド | 内容 |
|---|---|
| `/dopamine-url <url>` | 開くURLを変更する |
| `/dopamine-browser <app>` | 開くブラウザを変更する（`"Google Chrome"` / `"Safari"` 等） |
| `/dopamine-on` | フックを有効化する |
| `/dopamine-off` | フックを無効化する（何も開かなくなる） |

> **注意**: スラッシュコマンドはそれ自体が「プロンプト送信」なので、`/dopamine-off` を打った瞬間に `UserPromptSubmit` hook がまだ有効な状態のまま発火し、無効化が反映される前に一度だけページが開いてしまいます。この一手間を避けたい場合は方法1のCLIを使ってください。

## ライセンス

MIT
