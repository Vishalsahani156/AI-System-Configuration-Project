FROM python:3.12-slim

# System libs for the offline voice engine (pyaudio/pyttsx3/vosk) + build tools.
# espeak-ng is required so pyttsx3.init() succeeds at import time in a headless container.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        portaudio19-dev libasound2-dev \
        ffmpeg espeak-ng libespeak-ng1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt requirements-offline.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt -r requirements-offline.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
