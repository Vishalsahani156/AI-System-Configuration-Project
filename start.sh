#!/bin/bash

# Cyber_With_Vijay Launcher

# Load environment variables
if [ -f .env ]; then
  export $(echo $(cat .env | sed 's/#.*//' | xargs) | envsubst)
fi

echo "🚀 Launching Cyber_With_Vijay Command Center..."

# Start Backend in background
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "🌐 Starting UI..."
npm run dev &
FRONTEND_PID=$!

# Handle exit
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait
