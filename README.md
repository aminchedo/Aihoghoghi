# Iranian Legal Archive System - FastAPI + ML

A FastAPI-based web application for Iranian legal document analysis with AI-powered classification and processing.

## 🚀 Deployment on Vercel

This project is optimized for deployment on Vercel with Python 3.12 support.

### Dependencies Structure

The project uses a modular dependency structure for better build management:

- **`requirements.txt`** - Main dependencies file including core FastAPI and ML packages
- **`requirements-core.txt`** - Lightweight core dependencies without ML packages
- **`requirements-ml.txt`** - Heavy ML dependencies (torch, transformers, sentence-transformers)

### Python Version Compatibility

- **Target Python Version**: 3.12 (default on Vercel)
- **Alternative**: Python 3.11 (configured in `runtime.txt` if needed)
- **Compatibility**: All dependencies are tested and compatible with Python 3.12

### Key Dependency Updates for Python 3.12

The following changes were made to ensure Python 3.12 compatibility:

1. **Torch**: Updated to `torch==2.2.2` (supports Python 3.12)
2. **NumPy**: Updated to `numpy==1.26.4` (no distutils dependency)
3. **Transformers**: Updated to `transformers==4.36.2` (latest stable)
4. **Sentence Transformers**: Added `sentence-transformers==2.7.0`
5. **Build Dependencies**: Added `setuptools>=68.0.0`, `packaging>=23.0`, `wheel>=0.42.0`

### Installation

#### Local Development

```bash
# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Or install core dependencies only (without ML)
pip install -r requirements-core.txt

# Start the development server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Production Deployment on Vercel

1. **Automatic Deployment**: Push to your connected Git repository
2. **Manual Deployment**: Use Vercel CLI
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The project includes optimized Vercel configuration:

- **Runtime**: Python 3.12 (specified in `runtime.txt` and `vercel.json`)
- **Memory**: Increased Lambda size to 50MB for ML models
- **Timeout**: 30 seconds for API functions
- **Environment**: Custom PYTHONPATH and version settings

### Project Structure

```
├── api/                    # FastAPI application
│   ├── main.py            # Main API entry point
│   ├── ai_processor.py    # AI/ML processing module
│   ├── database.py        # Database operations
│   └── scraper.py         # Web scraping functionality
├── utils/                 # Utility modules
├── static/               # Static files
├── templates/            # HTML templates
├── requirements.txt      # Main dependencies
├── requirements-core.txt # Core dependencies only
├── requirements-ml.txt   # ML dependencies only
├── runtime.txt          # Python version for Vercel
├── vercel.json          # Vercel deployment configuration
└── README.md            # This file
```

### Environment Variables

Set these environment variables in your Vercel project settings:

```
PYTHONPATH=/var/task
PYTHON_VERSION=3.12
```

### Troubleshooting

#### Common Issues

1. **Build timeouts**: The ML dependencies are heavy. Vercel has been configured with increased memory and timeout limits.

2. **Import errors**: If you encounter import errors for ML packages, ensure all dependencies in `requirements.txt` are installed.

3. **Distutils errors**: Python 3.12 removed distutils. This is handled by including `setuptools>=68.0.0`.

#### Alternative Deployment Options

If you encounter persistent issues with the full ML stack on Vercel:

1. **Use core dependencies only**:
   ```bash
   # Replace requirements.txt with requirements-core.txt for deployment
   cp requirements-core.txt requirements.txt
   ```

2. **Switch to Python 3.11**:
   ```bash
   # Update runtime.txt
   echo "python-3.11" > runtime.txt
   ```

### API Endpoints

- **GET `/`** - Health check and API information
- **POST `/process`** - Process legal documents
- **GET `/api/health`** - Health status
- **WebSocket `/ws`** - Real-time updates

### Development

#### Running Tests

```bash
python -m pytest tests/ -v
```

#### Code Quality

```bash
# Format code
black .

# Type checking
mypy .

# Linting
flake8 .
```

### License

[Add your license information here]

### Contributing

[Add contributing guidelines here]