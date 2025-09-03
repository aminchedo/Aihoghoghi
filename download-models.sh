#!/bin/bash

# ========================================
# MODEL DOWNLOAD SCRIPT
# Iranian Legal Archive System
# ========================================
# 
# This script downloads Persian BERT models locally
# for development and testing purposes
#
# Usage: ./download-models.sh [output_directory]
# ========================================

set -e

# Configuration
HUGGINGFACE_TOKEN="${HUGGINGFACE_API_KEY:-YOUR_HUGGINGFACE_API_TOKEN_HERE}"
MODEL_NAME="HooshvareLab/bert-base-parsbert-uncased"
OUTPUT_DIR="${1:-./models/persian-bert-legal}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if Python and required packages are installed
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is not installed. Please install Python 3.8+ first."
    fi
    
    if ! python3 -c "import transformers" &> /dev/null; then
        warn "Transformers library not found. Installing..."
        pip3 install transformers torch
    fi
    
    if ! python3 -c "import requests" &> /dev/null; then
        warn "Requests library not found. Installing..."
        pip3 install requests
    fi
}

# Download model files
download_model() {
    log "Starting model download..."
    log "Model: $MODEL_NAME"
    log "Output Directory: $OUTPUT_DIR"
    
    # Check if token is set
    if [[ "$HUGGINGFACE_TOKEN" == "YOUR_HUGGINGFACE_API_TOKEN_HERE" ]]; then
        error "Please set HUGGINGFACE_API_KEY environment variable or update the script"
    fi
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Set environment variable for the token
    export HUGGING_FACE_HUB_TOKEN="$HUGGINGFACE_TOKEN"
    
    # Download using Python script
    python3 << EOF
import os
import sys
from transformers import AutoTokenizer, AutoModel, AutoConfig

# Set token
os.environ['HUGGING_FACE_HUB_TOKEN'] = '$HUGGINGFACE_TOKEN'

try:
    print("🔍 Downloading model configuration...")
    config = AutoConfig.from_pretrained('$MODEL_NAME', use_auth_token=True)
    config.save_pretrained('$OUTPUT_DIR')
    print("✅ Configuration downloaded")
    
    print("🔍 Downloading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained('$MODEL_NAME', use_auth_token=True)
    tokenizer.save_pretrained('$OUTPUT_DIR')
    print("✅ Tokenizer downloaded")
    
    print("🔍 Downloading model...")
    model = AutoModel.from_pretrained('$MODEL_NAME', use_auth_token=True)
    model.save_pretrained('$OUTPUT_DIR')
    print("✅ Model downloaded")
    
    print("🎉 All model files downloaded successfully!")
    
except Exception as e:
    print(f"❌ Error downloading model: {e}")
    sys.exit(1)
EOF
}

# Verify downloaded files
verify_download() {
    log "Verifying downloaded files..."
    
    required_files=(
        "config.json"
        "pytorch_model.bin"
        "tokenizer.json"
        "tokenizer_config.json"
        "vocab.txt"
    )
    
    missing_files=()
    
    for file in "${required_files[@]}"; do
        if [[ -f "$OUTPUT_DIR/$file" ]]; then
            log "✅ $file - $(du -h "$OUTPUT_DIR/$file" | cut -f1)"
        else
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        log "🎉 All model files verified successfully!"
        log "📁 Model location: $OUTPUT_DIR"
        log "💾 Total size: $(du -sh "$OUTPUT_DIR" | cut -f1)"
    else
        warn "Missing files: ${missing_files[*]}"
        return 1
    fi
}

# Create model info file
create_model_info() {
    log "Creating model information file..."
    
    cat > "$OUTPUT_DIR/model-info.txt" << EOF
Iranian Legal Archive System - Persian BERT Model
================================================

Model Information:
- Name: $MODEL_NAME
- Type: Persian BERT (ParsBERT)
- Architecture: BERT Base Uncased
- Language: Persian (Farsi)
- Tokenizer: WordPiece
- Max Sequence Length: 512

Download Details:
- Date: $(date)
- Token Used: [HIDDEN FOR SECURITY]
- Output Directory: $OUTPUT_DIR

File Structure:
$(find "$OUTPUT_DIR" -type f -exec ls -lh {} \; | sed 's/^/  /')

Usage:
- This model is used for Persian legal document analysis
- Supports text classification, entity extraction, and similarity analysis
- Optimized for Iranian legal terminology and language patterns

Technical Notes:
- Model format: PyTorch
- Quantized: No
- Requires: transformers library
- Compatible with: @xenova/transformers

⚠️  IMPORTANT:
- Keep this model secure
- Do not share the model files publicly
- Use only for authorized legal analysis
- Respect Hugging Face terms of service

EOF

    log "✅ Model information file created: $OUTPUT_DIR/model-info.txt"
}

# Main execution
main() {
    log "🚀 Starting Persian BERT model download..."
    log "Token: ${HUGGINGFACE_TOKEN:0:10}..."
    
    # Check dependencies
    check_dependencies
    
    # Download model
    download_model
    
    # Verify download
    verify_download
    
    # Create model info
    create_model_info
    
    log "🎉 Model download completed successfully!"
    log ""
    log "📋 NEXT STEPS:"
    log "   1. Test the model with a simple script"
    log "   2. Update your .env file with: AI_MODEL_PATH=$OUTPUT_DIR"
    log "   3. Restart your application"
    log ""
    log "🔧 TEST COMMAND:"
    log "   python3 -c \"from transformers import AutoTokenizer; tokenizer = AutoTokenizer.from_pretrained('$OUTPUT_DIR'); print('✅ Model loaded successfully!')\""
}

# Run main function
main "$@"