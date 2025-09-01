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
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/databases data/cache data/models logs

# Set environment variables
ENV TRANSFORMERS_CACHE=/app/data/models
ENV HF_HOME=/app/data/models
ENV TORCH_HOME=/app/data/models
ENV CUDA_VISIBLE_DEVICES=""
ENV TOKENIZERS_PARALLELISM=false

# Create non-root user for security
RUN useradd -m -u 1000 legaluser && chown -R legaluser:legaluser /app
USER legaluser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/status || exit 1

# Start the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]