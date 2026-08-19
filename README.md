# dopamine-hooks-claude

[Claude Code](https://claude.com/claude-code) の生成待ちの間，Mrs. GREEN APPLE の [ライラック](https://youtu.be/QjrkrVmC-8M?si=DN9b0Cone07h000z) を流し続け，あなたを飽きさせません．

※開かれる URL は任意のものに変更可能です．

Claude Code のプラグイン/マーケットプレイス機能で配布しています．

## 動作環境

- macOS
- Google Chrome または Safari（`Microsoft Edge` / `Brave Browser` など Chrome と同じ AppleScript辞書を持つブラウザも指定可能）
- Node.js >= 16（`on` / `off` / `url` / `browser` / `status` コマンド実行時のみ）

初回フック実行時，システム設定 → プライバシーとセキュリティ → オートメーション で，ターミナル（または利用しているシェルアプリ）から使用するブラウザと **System Events** への操作許可を求められます．許可してください．

## 導入方法

Claude Code 内で以下を実行します．

```
/plugin marketplace add MorohoshiMari/dopamine-hooks-claude
/plugin install dopamine-hooks-claude@dopamine-hooks-claude-marketplace
```

インストール後，`UserPromptSubmit` / `Stop` フックとスラッシュコマンドが有効になります．プラグインはユーザースコープでインストールされるため，既定では全プロジェクトで動作します（`/plugin disable dopamine-hooks-claude@dopamine-hooks-claude-marketplace` で無効化可能）．

## 構成

```
.claude-plugin/
├── plugin.json          # プラグインのマニフェスト
└── marketplace.json     # マーケットプレイスのマニフェスト（このリポジトリ自身を1プラグインとして公開）
hooks/
├── hooks.json            # UserPromptSubmit / Stop フックの登録
├── dopamine-open.sh       # UserPromptSubmit hook
└── dopamine-close.sh      # Stop hook
commands/
├── dopamine-url.md        # /dopamine-hooks-claude:dopamine-url <url>     — 開くURLを変更
├── dopamine-browser.md    # /dopamine-hooks-claude:dopamine-browser <app> — 開くブラウザを変更
├── dopamine-on.md         # /dopamine-hooks-claude:dopamine-on            — フックを有効化
└── dopamine-off.md        # /dopamine-hooks-claude:dopamine-off           — フックを無効化
bin/
└── dopamine-hooks-claude  # プラグインインストール後にPATHへ追加されるCLI
```

設定（開くURL・ブラウザ・有効/無効）はプロジェクトごとの `.claude/settings.json` の `env` に保存されます．プラグイン本体はプロジェクトの外にインストールされますが，フックスクリプトは `$CLAUDE_PROJECT_DIR/.claude/settings.json` を毎回読み直すため，プロジェクトごとに別々の設定が可能です．

## 使い方

設定変更には2通りの方法があります．中身はどちらも同じで，カレントプロジェクトの `.claude/settings.json` の `env.CLAUDE_DOPAMINE_URL` / `env.CLAUDE_DOPAMINE_DISABLE` / `env.CLAUDE_DOPAMINE_BROWSER` を書き換えるだけです．ファイルが無ければ自動作成されます．変更はフック実行のたびに読み直されるため，Claude Code の再起動なしで次回のプロンプト送信から反映されます．

### 方法1: ターミナルから直接実行（推奨）

プラグインインストール後，プロジェクトのルートディレクトリで実行します．

```bash
dopamine-hooks-claude on                    # 有効化
dopamine-hooks-claude off                   # 無効化
dopamine-hooks-claude url <url>             # 開くURLを変更
dopamine-hooks-claude browser "Safari"      # 開くブラウザを変更（既定: "Google Chrome"）
dopamine-hooks-claude status                # 現在の設定を表示
```

### 方法2: Claude Code のスラッシュコマンド

| コマンド | 内容 |
|---|---|
| `/dopamine-hooks-claude:dopamine-url <url>` | 開くURLを変更する |
| `/dopamine-hooks-claude:dopamine-browser <app>` | 開くブラウザを変更する（`"Google Chrome"` / `"Safari"` / `"Microsoft Edge"` / `"Brave Browser"`） |
| `/dopamine-hooks-claude:dopamine-on` | フックを有効化する |
| `/dopamine-hooks-claude:dopamine-off` | フックを無効化する（何も開かなくなる） |

> **注意**: スラッシュコマンドはそれ自体が「プロンプト送信」なので，`/dopamine-hooks-claude:dopamine-off` を打った瞬間に `UserPromptSubmit` hook がまだ有効な状態のまま発火し，無効化が反映される前に一度だけページが開いてしまいます．この一手間を避けたい場合は方法1のCLIを使ってください．

## 削除方法

```
/plugin uninstall dopamine-hooks-claude@dopamine-hooks-claude-marketplace
/plugin marketplace remove dopamine-hooks-claude-marketplace
```

プロジェクトごとの `.claude/settings.json` に残った `env.CLAUDE_DOPAMINE_*` は，このアンインストールでは削除されません．不要であれば手動で削除してください．

## ライセンス

MIT
