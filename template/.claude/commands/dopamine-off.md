---
description: 気分転換フック（YouTube自動オープン）を無効化する
---

`.claude/settings.json` の `env.CLAUDE_DOPAMINE_DISABLE` を `"1"` に更新してください（キーが無ければ `env` オブジェクトに追加する）。

手順:
1. `.claude/settings.json` を Read し、`env.CLAUDE_DOPAMINE_DISABLE` を `"1"` に設定する（Edit ツールを使う）。
2. `jq -e '.env.CLAUDE_DOPAMINE_DISABLE' .claude/settings.json` を実行し、JSON が壊れていないこと・値が `"1"` になったことを確認する。
3. 「気分転換フックを無効化しました」と日本語で報告する。次回のプロンプト送信から反映される（Claude Code の再起動は不要）。
