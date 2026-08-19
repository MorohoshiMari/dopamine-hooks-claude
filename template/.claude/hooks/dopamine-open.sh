#!/usr/bin/env bash
#
# UserPromptSubmit hook — 指定 URL を新しい Chrome ウィンドウで開く。
# 開く直前に最前面だったアプリ名とウィンドウ ID を state ファイルに保存し、
# Stop hook (dopamine-close.sh) がそれを見て元の画面に復帰する。
#
# 設定は settings.json の env よりも、実行のたびに settings.json 自体を
# jq で読み直す値を優先する。/dopamine-url や /dopamine-on|off コマンドで
# settings.json を書き換えた場合に、再起動なしで即座に反映させるため。
#   env.CLAUDE_DOPAMINE_URL      開く URL (既定: YouTube Shorts フィード)
#   env.CLAUDE_DOPAMINE_DISABLE  "1" なら何もしない
#   env.CLAUDE_DOPAMINE_BROWSER  開くブラウザ (既定: Google Chrome)
#                                "Safari" か、Chrome と同じ AppleScript辞書を
#                                持つブラウザ (Google Chrome / Microsoft Edge /
#                                Brave Browser 等) のアプリ名を指定する。
#
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETTINGS_FILE="$SCRIPT_DIR/../settings.json"

# settings.json (jq で読める) が使えるときはそれを唯一の情報源として使う。
# プロセス環境変数へは絶対にフォールバックしない — Claude Code は settings.json
# の env をプロセス環境変数へ反映した後、キーを削除しても環境変数側までは
# 消してくれない (確認済み)。そのため空欄フォールバックにすると、過去に一度でも
# 設定した値が settings.json から消えても環境変数に残った古い値を拾ってしまう。
# jq や設定ファイル自体が使えない場合のみ、環境変数 → 既定値の順で使う。
if command -v jq >/dev/null 2>&1 && [ -f "$SETTINGS_FILE" ]; then
  SHORTS_URL="$(jq -r '.env.CLAUDE_DOPAMINE_URL // "https://www.youtube.com/shorts"' "$SETTINGS_FILE" 2>/dev/null)"
  DISABLE="$(jq -r '.env.CLAUDE_DOPAMINE_DISABLE // "0"' "$SETTINGS_FILE" 2>/dev/null)"
  BROWSER_APP="$(jq -r '.env.CLAUDE_DOPAMINE_BROWSER // "Google Chrome"' "$SETTINGS_FILE" 2>/dev/null)"
else
  SHORTS_URL="${CLAUDE_DOPAMINE_URL:-https://www.youtube.com/shorts}"
  DISABLE="${CLAUDE_DOPAMINE_DISABLE:-0}"
  BROWSER_APP="${CLAUDE_DOPAMINE_BROWSER:-Google Chrome}"
fi

[ "$DISABLE" = "1" ] && exit 0
STATE_DIR="${TMPDIR:-/tmp}/claude-dopamine-hooks"
LOG="${TMPDIR:-/tmp}/claude-dopamine.log"

log() { printf '%s open  %s\n' "$(date '+%F %T')" "$*" >>"$LOG"; }
log "fired"

payload=$(cat)
session_id=$(printf '%s' "$payload" |
  sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)
[ -n "$session_id" ] || session_id=default

mkdir -p "$STATE_DIR"
state_file="$STATE_DIR/$session_id"

# 既に開いている場合: そのウィンドウがまだ生きていれば前面に出すだけ。
# 死んでいれば state を捨てて開き直す (クラッシュ等で残った古い state 対策)。
if [ -f "$state_file" ]; then
  IFS=$'\t' read -r _prev_app old_win_id old_browser <"$state_file"
  old_browser="${old_browser:-Google Chrome}"
  if [ -n "${old_win_id:-}" ] && /usr/bin/pgrep -qx "$old_browser" &&
    /usr/bin/osascript -e "tell application \"$old_browser\" to get id of every window" 2>/dev/null |
    tr ',' '\n' | grep -qx " *${old_win_id}"; then
    /usr/bin/osascript -e "tell application \"$old_browser\" to activate" >/dev/null 2>&1
    exit 0
  fi
  rm -f "$state_file"
fi

# Safari は「タブ付きウィンドウ」ではなく document ベースなので、
# 新規ウィンドウ作成の作法が Chrome 系と異なる。
if [ "$BROWSER_APP" = "Safari" ]; then
  browser_script="tell application \"$BROWSER_APP\"
	set w to make new document with properties {URL:\"$SHORTS_URL\"}
	set winId to id of front window
	activate
end tell"
else
  browser_script="tell application \"$BROWSER_APP\"
	set w to make new window
	set URL of active tab of w to \"$SHORTS_URL\"
	set winId to id of w
	activate
end tell"
fi

result=$(/usr/bin/osascript 2>/dev/null <<APPLESCRIPT
set prevApp to ""
try
	tell application "System Events" to set prevApp to name of first application process whose frontmost is true
end try
$browser_script
return prevApp & tab & winId
APPLESCRIPT
)

# 失敗しても本体の会話は止めない
if [ -n "$result" ]; then
  printf '%s\t%s\n' "$result" "$BROWSER_APP" >"$state_file"
  log "opened ($BROWSER_APP): $result"
else
  log "osascript failed ($BROWSER_APP の自動化許可を確認)"
fi
exit 0
