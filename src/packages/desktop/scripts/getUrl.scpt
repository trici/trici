on run argv
  set browserName to item 1 of argv
  tell application browserName
    return URL of current tab of front window
  end tell
end run



