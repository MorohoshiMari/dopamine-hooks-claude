#!/usr/bin/env bash
#
# Stop hook — dopamine-open.sh が開いた Chrome ウィンドウを閉じ、
# プロンプト送信直前に最前面だったアプリにフォーカスを戻す。
#
set -uo pipefail

STATE_DIR="${TMPDIR:-/tmp}/claude-dopamine-hooks"
LOG="${TMPDIR:-/tmp}/claude-dopamine.log"

log() { printf '%s close %s\n' "$(date '+%F %T')" "$*" >>"$LOG"; }
log "fired"

payload=$(cat)
session_id=$(printf '%s' "$payload" |
  sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)
[ -n "$session_id" ] || session_id=default

state_file="$STATE_DIR/$session_id"
if [ ! -f "$state_file" ]; then
  log "no state (nothing to close)"
  exit 0
fi

IFS=$'\t' read -r prev_app win_id browser_app <"$state_file"
browser_app="${browser_app:-Google Chrome}"
rm -f "$state_file"
log "closing window=$win_id ($browser_app), restoring focus to '${prev_app:-?}'"

# ブラウザが起動していないなら閉じる対象もない (tell で起動させないよう pgrep で確認)
if [ -n "${win_id:-}" ] && /usr/bin/pgrep -qx "$browser_app"; then
  # ループ内の window 参照に close を送っても無視されるアプリがあるため
  # `window id N` で直接指定する。既に閉じられている場合はエラーになるので try で握る。
  /usr/bin/osascript >/dev/null 2>&1 <<APPLESCRIPT
tell application "$browser_app"
	try
		close (window id ${win_id})
	end try
end tell
APPLESCRIPT
fi

if [ -n "${prev_app:-}" ]; then
  /usr/bin/osascript >/dev/null 2>&1 \
    -e "tell application \"System Events\" to tell process \"${prev_app}\" to set frontmost to true"
fi

exit 0
