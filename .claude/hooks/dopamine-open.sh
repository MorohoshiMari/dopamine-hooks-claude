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
#
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETTINGS_FILE="$SCRIPT_DIR/../settings.json"

cfg_url=""
cfg_disable=""
if command -v jq >/dev/null 2>&1 && [ -f "$SETTINGS_FILE" ]; then
  cfg_url=$(jq -r '.env.CLAUDE_DOPAMINE_URL // empty' "$SETTINGS_FILE" 2>/dev/null)
  cfg_disable=$(jq -r '.env.CLAUDE_DOPAMINE_DISABLE // empty' "$SETTINGS_FILE" 2>/dev/null)
fi

DISABLE="${cfg_disable:-${CLAUDE_DOPAMINE_DISABLE:-0}}"
[ "$DISABLE" = "1" ] && exit 0

SHORTS_URL="${cfg_url:-${CLAUDE_DOPAMINE_URL:-https://www.youtube.com/shorts}}"
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
  IFS=$'\t' read -r _prev_app old_win_id <"$state_file"
  if [ -n "${old_win_id:-}" ] && /usr/bin/pgrep -qx "Google Chrome" &&
    /usr/bin/osascript -e "tell application \"Google Chrome\" to get id of every window" 2>/dev/null |
    tr ',' '\n' | grep -qx " *${old_win_id}"; then
    /usr/bin/osascript -e 'tell application "Google Chrome" to activate' >/dev/null 2>&1
    exit 0
  fi
  rm -f "$state_file"
fi

result=$(/usr/bin/osascript 2>/dev/null <<APPLESCRIPT
set prevApp to ""
try
	tell application "System Events" to set prevApp to name of first application process whose frontmost is true
end try
tell application "Google Chrome"
	set w to make new window
	set URL of active tab of w to "$SHORTS_URL"
	set winId to id of w
	activate
end tell
return prevApp & tab & winId
APPLESCRIPT
)

# 失敗しても本体の会話は止めない
if [ -n "$result" ]; then
  printf '%s\n' "$result" >"$state_file"
  log "opened: $result"
else
  log "osascript failed (Chrome の自動化許可を確認)"
fi
exit 0
