# Deployment Guide - Vercel + Python 3.12

## 🎯 Quick Deployment Checklist

### ✅ Pre-deployment Verification

1. **Check Python version compatibility**:
   ```bash
   python verify_dependencies.py
   ```

2. **Test local installation**:
   ```bash
   pip install -r requirements.txt
   uvicorn api.main:app --host 0.0.0.0 --port 8000
   ```

3. **Verify API endpoints**:
   - Visit `http://localhost:8000/docs` for API documentation
   - Test core endpoints to ensure they respond correctly

### 🔧 Dependency Management Strategy

#### Option 1: Full Installation (Recommended)
Use `requirements.txt` for complete functionality including ML features:
```bash
pip install -r requirements.txt
```

#### Option 2: Core Only (Lightweight)
Use `requirements-core.txt` for basic API functionality without ML:
```bash
pip install -r requirements-core.txt
```

#### Option 3: Staged Installation
Install core dependencies first, then ML dependencies:
```bash
pip install -r requirements-core.txt
pip install -r requirements-ml.txt
```

### 🐍 Python Version Configuration

#### Current Configuration (Python 3.12)
- `runtime.txt`: `python-3.12`
- `vercel.json`: `PYTHON_VERSION=3.12`

#### Fallback Configuration (Python 3.11)
If you encounter issues with Python 3.12, switch to 3.11:

1. Update `runtime.txt`:
   ```
   python-3.11
   ```

2. Update `vercel.json`:
   ```json
   {
     "env": {
       "PYTHON_VERSION": "3.11"
     }
   }
   ```

### 📦 Dependency Version Matrix

| Package | Version | Python 3.12 | Notes |
|---------|---------|--------------|-------|
| fastapi | 0.104.1 | ✅ | Stable |
| uvicorn | 0.24.0 | ✅ | Stable |
| torch | 2.2.2 | ✅ | Min version for Py3.12 |
| numpy | 1.26.4 | ✅ | No distutils dependency |
| transformers | 4.36.2 | ✅ | Latest stable |
| sentence-transformers | 2.7.0 | ✅ | Latest stable |
| pandas | 2.1.4 | ✅ | Stable |
| setuptools | ≥68.0.0 | ✅ | Required for Py3.12 |
| packaging | ≥23.0 | ✅ | Build dependency |

### 🚀 Vercel Deployment Steps

1. **Connect Repository**: Link your Git repository to Vercel

2. **Configure Build Settings**:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `pip install -r requirements.txt`

3. **Environment Variables**:
   ```
   PYTHONPATH=/var/task
   PYTHON_VERSION=3.12
   ```

4. **Deploy**: Push to main branch or trigger manual deployment

### 🔍 Troubleshooting

#### Build Failures

**Error**: `torch==2.1.1` not available for Python 3.12
**Solution**: ✅ Fixed - Updated to `torch==2.2.2`

**Error**: `numpy==1.24.3` requires distutils
**Solution**: ✅ Fixed - Updated to `numpy==1.26.4`

**Error**: Missing setuptools
**Solution**: ✅ Fixed - Added `setuptools>=68.0.0`

#### Runtime Errors

**Error**: Import errors for ML packages
**Solution**: Ensure all packages in `requirements.txt` are installed

**Error**: Memory/timeout issues
**Solution**: Vercel config includes `maxLambdaSize: 50mb` and `maxDuration: 30s`

#### Performance Optimization

1. **Conditional ML Loading**: The AI processor gracefully handles missing ML dependencies
2. **Lazy Loading**: ML models are loaded only when needed
3. **Caching**: Model weights can be cached using Vercel's persistent storage

### 🧪 Testing

Run the dependency verification script:
```bash
python verify_dependencies.py
```

Expected output:
```
✅ fastapi - OK
✅ uvicorn - OK
✅ torch - OK
✅ numpy - OK
✅ transformers - OK
✅ sentence_transformers - OK
🎉 All dependencies verified successfully!
```

### 📊 Build Size Optimization

- **Core only**: ~50MB (without ML)
- **Full installation**: ~200MB (with ML)
- **Vercel limit**: 250MB (within limits)

### 🔄 Continuous Integration

For automated testing, add this to your CI pipeline:
```yaml
- name: Test Dependencies
  run: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    python verify_dependencies.py
```

### 📞 Support

If you encounter deployment issues:
1. Check Vercel build logs for specific error messages
2. Verify dependency versions are still current
3. Test locally with the same Python version
4. Consider using `requirements-core.txt` for minimal deployment

---

**Last Updated**: January 2025
**Python Version**: 3.12
**Vercel Compatibility**: ✅ Verified