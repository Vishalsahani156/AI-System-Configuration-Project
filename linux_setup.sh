#!/bin/bash

# Cyber_With_Vijay - Linux Installation Script
# Supports: Ubuntu, Debian, Kali, Mint (apt) and Arch, Manjaro (pacman)

echo "🚀 Starting Cyber_With_Riyu AI Installation..."

# 1 + 2. System Update & Dependencies (detect package manager)
echo "📦 Installing system dependencies..."
if command -v apt-get &>/dev/null; then
    sudo apt-get update && sudo apt-get upgrade -y
    sudo apt-get install -y python3 python3-pip python3-venv \
        portaudio19-dev libasound2-dev ffmpeg \
        libavformat-dev libavcodec-dev libswresample-dev \
        libavutil-dev libsdl2-dev build-essential nodejs npm
elif command -v pacman &>/dev/null; then
    sudo pacman -Syu --noconfirm --needed python python-pip \
        portaudio ffmpeg sdl2 base-devel nodejs npm
else
    echo "❌ Unsupported system: need apt-get or pacman. Install deps manually."
    exit 1
fi

# 3. Create Project Structure
mkdir -p backend/logs

# 4. Backend Setup
echo "🐍 Setting up Python Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn pymongo motor pyotp passlib[bcrypt] \
    python-jose[cryptography] python-dotenv \
    vosk pyttsx3 SpeechRecognition pyaudio
cd ..

# 5. Frontend Setup
echo "⚛️ Setting up Frontend..."
npm install

# 6. Environment Config
if [ ! -f .env ]; then
    echo "🔑 Please enter your Gemini API Key (get it from ai.google.dev):"
    read api_key
    echo "API_KEY=$api_key" > .env
    echo "GEMINI_API_KEY=$api_key" >> .env
    echo "MONGO_URI=mongodb+srv://ai_admin:strong_password_123d@cyber-with-vijay.rzcwecg.mongodb.net/?appName=cyber-with-vijay" >> .env
    echo ".env file created."
fi

# 7. Add user to hardware groups
echo "🎙️ Adding $USER to audio/video groups..."
sudo usermod -aG audio $USER
sudo usermod -aG video $USER

echo "✅ Installation Complete!"
echo "------------------------------------------------"
echo "To start the whole system, run: ./start.sh"
echo "------------------------------------------------"
