#!/bin/sh
# Start Next.js app in the background
node server.js &

# Start Vite mobile app in the background
serve -s /app/mobile-dist -l 5000 &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
