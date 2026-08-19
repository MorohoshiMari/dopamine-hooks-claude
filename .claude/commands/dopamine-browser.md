---
description: 気分転換フックが開くブラウザを変更する
argument-hint: <"Google Chrome"|"Safari"|"Microsoft Edge"|"Brave Browser">
---

`.claude/settings.json` の `env.CLAUDE_DOPAMINE_BROWSER` を `$ARGUMENTS` に更新してください。

サポートしているブラウザは次の4つのみです（フック側のAppleScript実装が対応しているのはこの4つのみで、それ以外の名前を指定しても動作しません）:
- "Google Chrome"
- "Safari"
- "Microsoft Edge"
- "Brave Browser"

手順:
1. `$ARGUMENTS` が空、またはこの4つのいずれとも完全一致しない場合は、settings.jsonを変更せずに上記のサポート対象一覧を日本語で伝えて終了する。
2. `.claude/settings.json` を Read し、`env.CLAUDE_DOPAMINE_BROWSER` の値を `$ARGUMENTS` に書き換える（Edit ツールを使う。キーが存在しない場合は `env` オブジェクトに追加する）。
3. `jq -e '.env.CLAUDE_DOPAMINE_BROWSER' .claude/settings.json` を実行し、JSON が壊れていないこと・値が正しく反映されたことを確認する。
4. 「開くブラウザを `$ARGUMENTS` に変更しました」と日本語で報告する。次回のフック実行から反映される（Claude Code の再起動は不要）。
