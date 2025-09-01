# 🏛️ Iranian Legal Archive System - Advanced Web UI

A powerful, modern web interface for the Iranian Legal Document Archive System, featuring AI-powered document analysis, intelligent proxy management, and real-time processing capabilities.

## ✨ Features

### 🎯 Core Functionality
- **AI-Powered Document Analysis**: Persian BERT classification and similarity analysis
- **Intelligent DNS Management**: Hybrid DNS with DoH support and automatic failover
- **Advanced Proxy System**: Smart proxy rotation with health monitoring
- **Real-time Processing**: WebSocket-based live updates and progress tracking
- **Comprehensive Caching**: SQLite-based intelligent caching system

### 🌐 Web Interface Features
- **Modern Responsive Design**: Mobile-first design with Tailwind CSS
- **Persian RTL Support**: Full right-to-left layout with proper typography
- **Dark/Light Theme**: Automatic theme switching with user preference storage
- **Real-time Dashboard**: Live charts and metrics visualization
- **File Upload Support**: Bulk URL processing from CSV/TXT files
- **Advanced Search**: Real-time document filtering and search
- **Export Capabilities**: JSON, CSV, and TXT export formats
- **Offline Support**: Service Worker for offline functionality

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip package manager

### Installation

1. **Clone or download the repository**
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the web server**:
   ```bash
   python web_server.py
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:7860`

## 📁 Project Structure

```
iranian-legal-archive/
├── enhanced_legal_scraper (3).py  # Main backend system
├── web_server.py                  # FastAPI web server
├── requirements.txt               # Python dependencies
├── web_ui/                        # Web interface files
│   ├── index.html                # Main HTML page
│   ├── styles.css                # Advanced CSS styling
│   ├── script.js                 # JavaScript functionality
│   ├── sw.js                     # Service Worker
│   └── package.json              # Web dependencies info
└── README.md                     # This file
```

## 🎛️ Usage Guide

### 1. Document Processing
- Navigate to the "پردازش اسناد" (Process Documents) section
- Enter URLs manually or upload a CSV/TXT file
- Configure proxy settings and batch size
- Click "شروع پردازش" to begin processing
- Monitor real-time progress and results

### 2. Proxy Dashboard
- View proxy statistics and performance metrics
- Monitor active proxy count and success rates
- Update proxy list with the refresh button
- Visualize data with interactive charts

### 3. Settings Configuration
- Configure DNS strategies (Hybrid, DoH, Standard)
- Select AI model preferences
- Manage cache settings and cleanup

### 4. Export and Analysis
- Export processed documents in multiple formats
- Search and filter through processed documents
- View detailed analysis results and quality scores

## 🔧 API Endpoints

The FastAPI server exposes the following endpoints:

- `GET /` - Main web interface
- `GET /api/status` - Current processing status
- `GET /api/stats` - System statistics
- `POST /api/process-urls` - Start document processing
- `POST /api/update-proxies` - Update proxy list
- `POST /api/upload-urls` - Upload URL file
- `GET /api/processed-documents` - Get processed documents
- `GET /api/export/{format}` - Export documents
- `DELETE /api/cache` - Clear system cache
- `GET /api/logs` - Get operation logs
- `WebSocket /ws` - Real-time updates

## 🌟 Advanced Features

### Real-time Updates
The system uses WebSocket connections to provide live updates during document processing, including:
- Progress tracking
- Status messages
- Error notifications
- Completion alerts

### Intelligent Caching
- SQLite-based document caching
- Automatic cache invalidation
- Memory-efficient storage
- Cache statistics and management

### Proxy Management
- Automatic proxy discovery and testing
- Health monitoring and rotation
- Performance metrics tracking
- Fallback to direct connections

### AI Integration
- Persian BERT for document classification
- Sentence transformers for similarity analysis
- Optimized for CPU-only environments
- Graceful fallback for missing models

## 🛠️ Configuration

### Environment Variables
- `TRANSFORMERS_CACHE`: Cache directory for AI models
- `HF_HOME`: Hugging Face cache directory
- `TORCH_HOME`: PyTorch cache directory
- `CUDA_VISIBLE_DEVICES`: GPU configuration (empty for CPU-only)

### DNS Configuration
- Hybrid mode (recommended): Combines multiple DNS strategies
- DoH mode: DNS over HTTPS for enhanced privacy
- Standard mode: Traditional DNS resolution

## 🐛 Troubleshooting

### Common Issues

1. **"Limited Mode" Error**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check internet connectivity
   - Verify Python version (3.8+)

2. **WebSocket Connection Issues**
   - Check firewall settings
   - Ensure port 7860 is available
   - Try refreshing the browser

3. **Proxy Problems**
   - Update proxy list from the dashboard
   - Disable proxy mode if needed
   - Check network connectivity

4. **AI Model Loading Issues**
   - Ensure sufficient disk space for model cache
   - Check internet connection for model downloads
   - Try lightweight model options in settings

## 🔒 Security Considerations

- All external requests use secure HTTP adapters
- Proxy validation and testing before use
- Input validation for all user data
- CORS protection for API endpoints
- Secure file upload handling

## 📱 Mobile Support

The interface is fully responsive and optimized for:
- Desktop computers (1024px+)
- Tablets (768px - 1024px)
- Mobile phones (< 768px)
- Portrait and landscape orientations

## 🌍 Internationalization

- Full Persian/Farsi language support
- RTL (Right-to-Left) layout
- Persian date and time formatting
- Cultural adaptations for Iranian users

## 🚀 Deployment Options

### Local Development
```bash
python web_server.py
```

### Production Deployment
```bash
uvicorn web_server:app --host 0.0.0.0 --port 7860 --workers 4
```

### Hugging Face Spaces
The system is optimized for Hugging Face Spaces deployment with:
- CPU-only mode enforcement
- Memory usage optimization
- Graceful dependency handling
- Automatic fallback modes

## 📊 Performance

- **Startup Time**: < 30 seconds (including model loading)
- **Processing Speed**: 3-10 documents per minute (depending on proxy performance)
- **Memory Usage**: ~2-4GB (with AI models loaded)
- **Concurrent Users**: Supports multiple simultaneous users
- **Cache Hit Rate**: Typically 60-80% for repeated URLs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- HooshvareLab for Persian BERT models
- Sentence Transformers team
- FastAPI and Gradio communities
- Iranian legal data sources

---

**Made with ❤️ for the Iranian legal community**