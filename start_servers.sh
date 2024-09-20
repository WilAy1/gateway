#!/bin/bash

# Function to shut down servers
shutdown() {
    echo "Shutting down..."
    redis-cli shutdown
    kill $NPM_PID
    wait $REDIS_PID
    wait $NPM_PID
}

# Trap SIGINT (Ctrl+C) to shutdown both servers before exiting
trap shutdown INT

# Check if Redis is already running on port 6379
if lsof -i :6379 > /dev/null; then
    echo "Redis is already running on port 6379."
else
    echo "Starting Redis server..."
    redis-server &
    REDIS_PID=$!
fi

echo "Starting Node.js development server..."
npm run dev &
NPM_PID=$!

# Wait for both processes to complete
wait
