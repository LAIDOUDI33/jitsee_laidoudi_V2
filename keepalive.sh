#!/bin/bash
# Keep dev server alive - restart if dead
while true; do
  if ! pgrep -f 'next' > /dev/null 2>&1; then
    echo "$(date): Dev server dead, restarting..." >> /home/z/my-project/keepalive.log
    cd /home/z/my-project && NODE_OPTIONS='--max-old-space-size=2048' bun run dev </dev/null >> /home/z/my-project/dev.log 2>&1 &
    sleep 15  # Wait for compilation
  fi
  sleep 10
done
