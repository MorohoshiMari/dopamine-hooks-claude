---
description: 気分転換フックが開くURLを変更する
argument-hint: <url>
---

`.claude/settings.json` の `env.CLAUDE_DOPAMINE_URL` を `$ARGUMENTS` に更新してください。

手順:
1. `$ARGUMENTS` が空、または妥当な URL（`http://` か `https://` で始まる）でなければ、変更せずにその旨を日本語で伝えて終了する。
2. `.claude/settings.json` が存在しなければ `{"env": {}}` として新規作成する。存在すれば Read する。
3. `env.CLAUDE_DOPAMINE_URL` の値を `$ARGUMENTS` に書き換える（Edit ツールを使う。`env` オブジェクトが無ければ追加する）。
4. `jq -e '.env.CLAUDE_DOPAMINE_URL' .claude/settings.json` を実行し、JSON が壊れていないこと・値が正しく反映されたことを確認する。
5. 「遷移先 URL を `$ARGUMENTS` に変更しました」と日本語で報告する。次回のフック実行から反映される（Claude Code の再起動は不要）。
