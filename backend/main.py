
import os
import json
import subprocess
import threading
import queue
import sys
from fastapi import FastAPI, WebSocket, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Offline Voice Dependencies
try:
    import vosk
    import pyaudio
    import pyttsx3
    import speech_recognition as sr
except ImportError:
    print("Warning: Offline voice dependencies missing. Run linux_setup.sh")

load_dotenv()

app = FastAPI(title="Cyber_With_vishal_Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI)
db = client.cyber_with_vishal

# --- OFFLINE NLP ENGINE ---
class OfflineController:
    def __init__(self):
        self.engine = pyttsx3.init()
        # Set female voice if available
        voices = self.engine.getProperty('voices')
        for voice in voices:
            if "female" in voice.name.lower() or "hindi" in voice.name.lower():
                self.engine.setProperty('voice', voice.id)
                break
        self.engine.setProperty('rate', 160)
        
    def speak(self, text):
        print(f"Riyu (Offline): {text}")
        self.engine.say(text)
        self.engine.runAndWait()

    def handle_command(self, text: str):
        text = text.lower()
        if "check battery" in text or "battery status" in text:
            res = subprocess.getoutput("acpi -b")
            self.speak(f"Babu, battery status is: {res}")
        elif "open terminal" in text:
            subprocess.Popen(["gnome-terminal"])
            self.speak("Terminal khul gaya hai, vishal.")
        elif "system load" in text or "cpu load" in text:
            res = subprocess.getoutput("uptime | awk '{print $10}'")
            self.speak(f"System load current level: {res}")
        elif "list files" in text:
            res = subprocess.getoutput("ls -m")
            self.speak(f"Files are: {res}")
        elif "volume up" in text:
            subprocess.run(["amixer", "-D", "pulse", "sset", "Master", "10%+"])
            self.speak("Awaaz badha di hai.")
        else:
            self.speak("Sorry Babu, I didn't get that in offline mode. I'll try my best though.")

offline_riyu = OfflineController()

@app.on_event("startup")
async def startup_db_client():
    print("🚀 Cyber_With_vishal: Linux Backend Online")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.get("/")
async def root():
    return {"status": "CWV_OS_ONLINE", "version": "3.1.0", "offline_engine": "Vosk+Pyttsx3 Ready"}

@app.post("/offline/execute")
async def execute_offline(command: dict):
    # This endpoint is called when Frontend detects no internet
    query = command.get("text", "")
    offline_riyu.handle_command(query)
    return {"status": "executed"}

@app.get("/logs/agent/{agent_id}")
async def get_agent_logs(agent_id: str):
    logs = await db.agent_logs.find({"agent_id": agent_id}).sort("timestamp", -1).limit(50).to_list(length=50)
    return logs

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
