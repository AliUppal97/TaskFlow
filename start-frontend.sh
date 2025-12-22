#!/bin/bash
# TaskFlow - Start Frontend Server
# Bash script to start the Next.js frontend server

echo "Starting TaskFlow Frontend..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend" || exit

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start the development server
echo "Starting frontend server on http://localhost:3000"
npm run dev



