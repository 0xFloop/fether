#!/bin/bash
source .env
CWD='/home/unnamed/Desktop/code/fether'
wezterm start --cwd $CWD -- bash -c 'wezterm cli spawn --cwd '${CWD}' -- bash -c "wezterm cli spawn --cwd '${CWD}' -- pnpm anvil & pnpm ngrok;bash" & pnpm dev;bash' 

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
