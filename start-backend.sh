#!/bin/bash
# TaskFlow - Start Backend Server
# Bash script to start the NestJS backend server

echo "Starting TaskFlow Backend..."

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.template .env
    echo "Please configure your .env file with database credentials!"
fi

# Start the development server
echo "Starting backend server on http://localhost:3001"
npm run start:dev





