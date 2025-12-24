#!/bin/bash
# TaskFlow - Start Both Servers
# Bash script to start both backend and frontend servers

echo "Starting TaskFlow Application..."

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start backend in background
echo "Starting backend server..."
cd "$SCRIPT_DIR" || exit
bash start-backend.sh > backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment
sleep 2

# Start frontend in background
echo "Starting frontend server..."
bash start-frontend.sh > frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "Both servers are starting..."
echo "Backend PID: $BACKEND_PID (logs: backend.log)"
echo "Frontend PID: $FRONTEND_PID (logs: frontend.log)"
echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:3001/api/docs"
echo ""
echo "To stop servers, run: kill $BACKEND_PID $FRONTEND_PID"
echo "Or view logs: tail -f backend.log frontend.log"





