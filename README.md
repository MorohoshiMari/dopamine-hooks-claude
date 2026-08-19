# dopamine-hooks-claude

[Claude Code](https://claude.com/claude-code) の生成待ちの間，Mrs. GREEN APPLE のライラックを流し続け，あなたを飽きさせません．
※開かれる URL は任意のものに変更可能です．

## 動作環境

- macOS
- Google Chrome または Safari（`Microsoft Edge` / `Brave Browser` など Chrome と同じ AppleScript辞書を持つブラウザも指定可能）
- Node.js >= 16

初回フック実行時，システム設定 → プライバシーとセキュリティ → オートメーション で，ターミナル（または利用しているシェルアプリ）から使用するブラウザと **System Events** への操作許可を求められます．許可してください．

## 導入方法

導入したいプロジェクトのルートディレクトリで実行します．

```bash
npx dopamine-hooks-claude init
# or
yarn dlx dopamine-hooks-claude init
# or
pnpm dlx dopamine-hooks-claude init
```

`.claude/` 以下に以下のファイルが作成されます．既に `.claude/` が存在する場合はエラーにせず，関連ファイルだけを追記マージします（既存の他のフック・コマンド・`env`・同名でないファイルは上書きしません．同名ファイルが既にあればそのファイルだけスキップします）．

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

## 使い方

### CLIから直接実行

```bash
npx dopamine-hooks-claude on                    # 有効化
npx dopamine-hooks-claude off                   # 無効化
npx dopamine-hooks-claude url <url>             # 開くURLを変更
npx dopamine-hooks-claude browser "Safari"      # 開くブラウザを変更（既定: "Google Chrome"）
npx dopamine-hooks-claude status                # 現在の設定を表示
npx dopamine-hooks-claude remove                # 導入した関連ファイル・設定だけを削除
```

### 方法2: Claude Code のスラッシュコマンド

| コマンド | 内容 |
|---|---|
| `/dopamine-url <url>` | 開くURLを変更する |
| `/dopamine-browser <app>` | 開くブラウザを変更する（`"Google Chrome"` / `"Safari"` 等） |
| `/dopamine-on` | フックを有効化する |
| `/dopamine-off` | フックを無効化する（何も開かなくなる） |

## 削除方法

`npx dopamine-hooks-claude init` は npm の依存関係としてインストールされない（`npx` は一時実行のみで `package.json` にも `node_modules` にも残らない）ため，`npm uninstall` に相当する操作自体が発生しません．導入した `.claude/hooks/dopamine-*.sh`・`.claude/commands/dopamine-*.md`・`settings.json` 内の `env.CLAUDE_DOPAMINE_*` とフック登録だけを取り除きたい場合は，`remove` を実行してください．

```bash
npx dopamine-hooks-claude remove
```

このコマンドは dopamine-hooks-claude が追加したファイル・設定だけを対象にし，他のフックや `env` の値には一切触れません．

## ライセンス

MIT
