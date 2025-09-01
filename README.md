# 🏛️ Iranian Legal Archive System v2.0 - Ultra Modern Platform

A highly advanced, feature-rich web scraping platform for Iranian legal documents with AI-powered analysis, intelligent networking, and professional web interface.

## ✨ Core Architecture

### 🎯 Main Components

- **UltraModernLegalArchive**: Main orchestrator coordinating all system components
- **EnhancedLegalWebScraper**: HTTP requests and HTML parsing with advanced retry logic
- **IntelligentDNSManager**: Multi-resolver DoH support (Shecan, Begzar, Cloudflare, Google)
- **ModernProxyManager**: Proxy pool with testing, rotation, and fallback capabilities
- **ModernContentExtractor**: Source-specific selectors with intelligent noise removal
- **HuggingFaceOptimizedClassifier**: ParsBERT with fallback rule-based classification
- **UltraIntelligentCacheSystem**: In-memory LRU + SQLite persistent cache with TTL
- **UltraAdvancedScoringSystem**: Comprehensive content quality evaluation

### 🌐 Custom Web Interface

**Backend**: FastAPI with WebSocket support for real-time updates
**Frontend**: Modern HTML5 + Tailwind CSS + JavaScript (replacing Gradio)

**Features**:
- Multi-tab interface: Bulk Processing / Search & Filter / System Dashboard / Proxy Management / Settings
- Real-time progress bars and live logs
- Persian RTL support with beautiful typography
- Dark/Light theme toggle
- Export capabilities (JSON/CSV)
- Responsive design for mobile and desktop

## 📊 Authoritative Legal Sources

| Source (Persian) | English Translation | Base URLs | Category | Reliability |
|------------------|-------------------|-----------|----------|-------------|
| مجلس شورای اسلامی | Islamic Consultative Assembly | rc.majlis.ir, majlis.ir | قانون | 98% |
| پورتال ملی قوانین | National Law Portal (Dotic) | dotic.ir | قانون | 96% |
| قوه قضاییه | Judiciary | eadl.ir, judiciary.ir | دادنامه | 95% |
| روزنامه رسمی | Official Newspaper (RRK) | rrk.ir | آگهی قانونی | 99% |
| کانون وکلای دادگستری | Iranian Bar Association | icbar.ir | رویه قضایی | 90% |

Each source has specialized scraping rules with custom CSS selectors and content extraction strategies.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- 4GB+ RAM (for AI models)
- Stable internet connection

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd iranian-legal-archive
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```
   
   Or with uvicorn:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:8000`

## 📁 Project Structure

```
iranian-legal-archive/
├── app.py                          # Main FastAPI application
├── requirements.txt                # Python dependencies
├── README.md                       # This comprehensive guide
├── utils/                          # Modular system components
│   ├── __init__.py                # Package initialization
│   ├── orchestrator.py            # Main UltraModernLegalArchive class
│   ├── dns_manager.py             # IntelligentDNSManager
│   ├── proxy_manager.py           # ModernProxyManager
│   ├── content_extractor.py       # ModernContentExtractor
│   ├── ai_classifier.py           # HuggingFaceOptimizedClassifier
│   ├── cache_system.py            # UltraIntelligentCacheSystem
│   ├── scoring_system.py          # UltraAdvancedScoringSystem
│   └── legal_sources.py           # Authoritative sources configuration
├── templates/                      # Jinja2 HTML templates
│   └── index.html                 # Main web interface
├── static/                         # Static web assets
│   ├── styles.css                 # Custom CSS with RTL support
│   ├── app.js                     # Frontend JavaScript application
│   └── sw.js                      # Service Worker for offline support
├── data/                          # Data storage
│   ├── databases/                 # SQLite databases
│   ├── cache/                     # Cache files
│   ├── models/                    # AI model cache
│   └── init_database.sql          # Database schema
├── web_ui/                        # Legacy Gradio interface (kept for compatibility)
└── enhanced_legal_scraper (3).py  # Legacy monolithic scraper
```

## 🎛️ Usage Guide

### 1. Document Processing
- Navigate to the "پردازش اسناد" (Process Documents) tab
- Enter URLs manually or upload a CSV/TXT file
- Configure proxy settings, batch size, and retry count
- Click "شروع پردازش" to begin processing
- Monitor real-time progress with live updates

### 2. Search & Filter
- Use the "جستجو و فیلتر" tab to search processed documents
- Filter by category, source, or quality score
- Full-text search across titles and content
- Export filtered results

### 3. System Dashboard
- Monitor system health and performance metrics
- View processing statistics and cache efficiency
- Check DNS and proxy status
- Analyze document quality distribution

### 4. Proxy Management
- View proxy statistics and performance
- Update proxy list with fresh sources
- Monitor proxy health and response times
- Automatic proxy rotation and fallback

### 5. Settings
- Configure cache management and cleanup
- View system information and uptime
- Manage theme preferences

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - Main web interface
- `GET /api/status` - Current processing status
- `GET /api/stats` - Comprehensive system statistics
- `POST /api/process-urls` - Start document processing
- `POST /api/search` - Search processed documents
- `WebSocket /ws` - Real-time updates

### Management Endpoints
- `POST /api/update-proxies` - Update proxy list
- `POST /api/upload-urls` - Upload URL file
- `GET /api/processed-documents` - Get processed documents with filtering
- `GET /api/export/{format}` - Export documents (JSON/CSV)
- `DELETE /api/cache` - Clear system cache
- `GET /api/cache/stats` - Cache statistics and health

## 🤖 AI & Machine Learning

### Classification Models
- **Primary**: HooshvareLab/bert-base-parsbert-uncased (Persian BERT)
- **Fallback**: HooshvareLab/bert-fa-base-uncased
- **Lightweight**: distilbert-base-multilingual-cased

### Embedding Models
- **Primary**: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- **Fallback**: sentence-transformers/all-MiniLM-L6-v2

### Classification Categories
- **قانون_اساسی** (Constitutional Law)
- **قانون_عادی** (Ordinary Law)
- **دادنامه** (Court Verdicts)
- **رویه_قضایی** (Judicial Procedures)
- **آگهی_قانونی** (Legal Notices)

## 🌐 Advanced Networking

### DNS Management
- **DoH Support**: DNS over HTTPS with Iranian resolvers (Shecan, Begzar)
- **Fallback Strategy**: Automatic fallback to international DoH and standard DNS
- **Smart Resolution**: Hybrid approach combining multiple DNS strategies

### Proxy System
- **Iranian Proxies**: Specialized proxy pool for Iranian websites
- **International Backup**: Global proxy network for fallback
- **Health Monitoring**: Continuous proxy testing and rotation
- **Performance Metrics**: Response time tracking and optimization

## ⚡ Caching System

### Multi-Layer Cache
- **Memory Cache**: LRU-based in-memory cache for hot data
- **Persistent Cache**: SQLite-based storage with TTL management
- **Smart Invalidation**: Priority-based cache eviction
- **Compression**: Automatic compression for large content

### Cache Features
- Dynamic TTL based on content quality and source reliability
- Category-based organization
- Access frequency tracking
- Automatic cleanup and optimization

## 📈 Quality Scoring

### Comprehensive Evaluation
- **Content Quality** (25%): Length, uniqueness, information density
- **Structure Quality** (20%): Formatting, organization, readability
- **Legal Relevance** (20%): Legal terms, patterns, references
- **Source Reliability** (15%): Source credibility and authority
- **Completeness** (10%): Metadata presence, detail level
- **Readability** (10%): Sentence structure, vocabulary complexity

### Quality Grades
- **عالی** (Excellent): 90-100 points
- **خوب** (Good): 80-89 points
- **متوسط** (Average): 70-79 points
- **قابل قبول** (Acceptable): 60-69 points
- **ضعیف** (Poor): 50-59 points
- **نامناسب** (Unsuitable): 0-49 points

## 🛠️ Configuration

### Environment Variables
```bash
export TRANSFORMERS_CACHE="/tmp/hf_cache"
export HF_HOME="/tmp/hf_cache"
export TORCH_HOME="/tmp/torch_cache"
export CUDA_VISIBLE_DEVICES=""  # Force CPU-only mode
```

### Database Configuration
- **Main Database**: `data/databases/legal_archive.sqlite`
- **Cache Database**: `data/cache/intelligent_cache.sqlite`
- **Models Cache**: `data/models/`

## 🔒 Security Features

- SSL adapter with relaxed verification for misconfigured sites
- Input validation and sanitization
- CORS protection for API endpoints
- Secure file upload handling
- Proxy validation and testing

## 📱 Mobile & Accessibility

- **Responsive Design**: Optimized for all screen sizes
- **RTL Support**: Full right-to-left layout for Persian
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast Mode**: Support for accessibility preferences

## 🚀 Deployment Options

### Local Development
```bash
python app.py
# or
uvicorn app:app --reload
```

### Production Deployment
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker Deployment
```bash
# Create Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

# Build and run
docker build -t legal-archive .
docker run -p 8000:8000 legal-archive
```

### Hugging Face Spaces
The system is optimized for Hugging Face Spaces deployment:
- CPU-only mode enforcement
- Memory usage optimization
- Graceful dependency handling
- Automatic fallback modes

## 📊 Performance Metrics

- **Startup Time**: < 60 seconds (including AI model loading)
- **Processing Speed**: 5-15 documents per minute (depending on proxy performance)
- **Memory Usage**: ~3-6GB (with AI models loaded)
- **Concurrent Processing**: Up to 20 URLs in parallel
- **Cache Hit Rate**: Typically 70-85% for repeated URLs

## 🐛 Troubleshooting

### Common Issues

1. **AI Model Loading Issues**
   ```bash
   # Clear model cache
   rm -rf /tmp/hf_cache/*
   # Restart application
   python app.py
   ```

2. **Database Connection Issues**
   ```bash
   # Check database permissions
   ls -la data/databases/
   # Recreate database
   rm data/databases/legal_archive.sqlite
   python app.py
   ```

3. **Proxy Connection Problems**
   - Update proxy list from the dashboard
   - Disable proxy mode temporarily
   - Check network connectivity

4. **WebSocket Connection Issues**
   - Check firewall settings
   - Ensure port 8000 is available
   - Try refreshing the browser

## 🔄 Migration from v1.x

If upgrading from the previous Gradio-based version:

1. **Backup your data**:
   ```bash
   cp demo_legal_archive.db data/databases/backup.db
   ```

2. **Install new dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migration script** (if needed):
   ```bash
   python migrate_data.py
   ```

## 📈 Advanced Features

### Real-time Processing
- WebSocket-based live updates
- Progress tracking with detailed metrics
- Error handling and retry mechanisms
- Batch processing with configurable sizes

### Intelligent Content Extraction
- Source-specific CSS selectors
- Multi-stage extraction algorithms
- Noise removal and content scoring
- Metadata extraction and enrichment

### AI-Powered Analysis
- Persian BERT for document classification
- Sentence transformers for similarity analysis
- Legal entity extraction and recognition
- Confidence scoring and fallback mechanisms

### Professional Web Interface
- Modern, responsive design with Tailwind CSS
- Persian typography and RTL layout
- Interactive charts and visualizations
- Real-time monitoring and control panels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 style guide
- Add comprehensive docstrings
- Include unit tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **HooshvareLab** for Persian BERT models and NLP research
- **Sentence Transformers** team for multilingual embedding models
- **FastAPI** community for the excellent web framework
- **Tailwind CSS** for the utility-first CSS framework
- **Iranian legal community** for feedback and requirements

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the API documentation at `/docs`

---

**🇮🇷 Made with ❤️ for the Iranian legal community**

### Recent Updates (v2.0)

- ✅ **Modular Architecture**: Separated components into utils/ modules
- ✅ **FastAPI Backend**: Professional REST API with WebSocket support  
- ✅ **Custom Web UI**: Modern interface replacing Gradio
- ✅ **Enhanced Caching**: Multi-layer caching with SQLite persistence
- ✅ **Advanced Scoring**: Comprehensive quality evaluation system
- ✅ **Intelligent Networking**: DoH support and smart proxy management
- ✅ **Real-time Updates**: WebSocket-based live progress tracking
- ✅ **Professional Design**: Responsive UI with Persian typography
- ✅ **Export Capabilities**: JSON and CSV export functionality
- ✅ **System Monitoring**: Health checks and performance metrics