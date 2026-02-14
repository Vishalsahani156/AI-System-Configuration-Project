# Cyber_With_Vijay — AI Voice Command Center

A high-performance AI system featuring **Riyu**, a sweet Indian female voice assistant.

## 🐧 Linux Installation (Fast Track)

1. **Give execution permission to the setup script:**
   ```bash
   chmod +x linux_setup.sh
   ```

2. **Run the installer:**
   ```bash
   ./linux_setup.sh
   ```

3. **Running the System:**
   - **Terminal 1 (Backend):** 
     ```bash
     cd backend && source venv/bin/activate && uvicorn main:app --reload
     ```
   - **Terminal 2 (Frontend):** 
     ```bash
     npm run dev
     ```

## Features
- **Riyu Voice:** Real-time Hinglish speech-to-speech.
- **Visual Analysis:** "Analyze this" triggers camera frame capture.
- **System Memory:** Remembers past conversations via MongoDB and local state.
- **OS Control:** Trigger shell commands via Riyu's tool calls.

## Hardware Permissions
Ensure your user is in the `audio` and `video` groups:
```bash
sudo usermod -aG audio $USER
sudo usermod -aG video $USER
```
*(Logout and back in for changes to take effect)*
# AI-System-Configuration-Project
