# Iranian Legal Archive System - Docker Configuration
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    wget \
    git \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies with specific versions
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    requests==2.31.0 \
    beautifulsoup4==4.12.2 \
    transformers==4.35.2 \
    torch==2.1.1 \
    sqlite3 \
    python-multipart \
    jinja2

# Copy application files in correct structure
COPY complete_working_system.py ./
COPY integrated_real_system.py ./
COPY huggingface_real_ai.py ./
COPY real_ai_analyzer.py ./
COPY functional_system.html ./
COPY index.html ./

# Create necessary directories matching project structure
RUN mkdir -p \
    data/databases \
    data/cache \
    data/models \
    logs \
    static \
    templates

# Copy database if exists (optional)
COPY *.db ./data/databases/ 2>/dev/null || true

# Set environment variables for Persian AI models
ENV TRANSFORMERS_CACHE=/app/data/models
ENV HF_HOME=/app/data/models
ENV TORCH_HOME=/app/data/models
ENV CUDA_VISIBLE_DEVICES=""
ENV TOKENIZERS_PARALLELISM=false
ENV PYTHONPATH=/app
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Create non-root user for security
RUN useradd -m -u 1000 legaluser && chown -R legaluser:legaluser /app
USER legaluser

# Expose port
EXPOSE 8000

# Health check matching the actual API endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Pre-download Persian BERT models (optional, for better performance)
RUN python3 -c "
from transformers import pipeline, AutoTokenizer, AutoModel
import warnings
warnings.filterwarnings('ignore')
try:
    tokenizer = AutoTokenizer.from_pretrained('HooshvareLab/bert-fa-zwnj-base')
    model = AutoModel.from_pretrained('HooshvareLab/bert-fa-zwnj-base')
    print('✅ Persian BERT model cached successfully')
except:
    print('⚠️ Persian BERT model download failed, will use fallback')
" || true

# Start the complete working system
CMD ["python3", "complete_working_system.py"]
