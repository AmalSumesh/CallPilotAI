FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/root/.cache/huggingface \
    PORT=8000

# Install audio processing system dependencies (libsndfile & ffmpeg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Upgrade pip & install lightweight CPU-only PyTorch first, then other requirements
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download and cache microsoft/wavlm-base so it boots instantly without cold-start network lag
RUN python -c "from transformers import AutoFeatureExtractor, AutoModel; AutoFeatureExtractor.from_pretrained('microsoft/wavlm-base'); AutoModel.from_pretrained('microsoft/wavlm-base')"

# Copy application source and trained weights
COPY app/ ./app/
COPY model/ ./model/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
