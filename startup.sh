#!/bin/bash

CWD='/home/unnamed/Desktop/code/fether'

wezterm start --new-tab --cwd $CWD -- pnpm dev 
wezterm start --new-tab --cwd $CWD -- pnpm anvil
wezterm start --new-tab --cwd $CWD -- pnpm ngrok
wezterm start --new-tab --cwd $CWD -- pnpm studio

OP=$(wezterm cli list | awk '{print $2}')
TAB_NAMES=("Studio" "Ngrok" "Anvil" "Dev")
TAB_IDS=()
SCRIPT_CREATED_TAB_IDS=()
for i in $OP; do 
	if [ "$i" != "TABID" ]
	then
		TAB_IDS+=($i)
	fi
done

for i in {1..4}; do 
	SCRIPT_CREATED_TAB_IDS+=(${TAB_IDS[$i * -1]})
done
TAB_INDEX=0
for i in "${SCRIPT_CREATED_TAB_IDS[@]}"; do
	wezterm cli set-tab-title --tab-id $i ${TAB_NAMES[$TAB_INDEX]}
	TAB_INDEX=$((TAB_INDEX+1))
done

# below is the old startup script used on mac
# osascript -e 'tell application "iTerm" to tell current window to set newTab to (create tab with default profile)'
# osascript -e 'tell application "iTerm" to tell the first session of current tab of current window to write text "cd ~/Desktop/Code/fether && pnpm dev"'
#
# osascript -e 'tell application "iTerm" to tell current window to set newTab to (create tab with default profile)'
# osascript -e 'tell application "iTerm" to tell the first session of current tab of current window to write text "cd ~/Desktop/Code/fether && pnpm anvil"'
#
# osascript -e 'tell application "iTerm" to tell current window to set newTab to (create tab with default profile)'
# osascript -e 'tell application "iTerm" to tell the first session of current tab of current window to write text "cd ~/Desktop/Code/fether && pnpm ngrok"'
#
# osascript -e 'tell application "iTerm" to tell current window to set newTab to (create tab with default profile)'
# osascript -e 'tell application "iTerm" to tell the first session of current tab of current window to write text "cd ~/Desktop/Code/fether && pnpm studio"'
#
