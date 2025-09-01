# 🏛️ Enhanced Iranian Legal Archive System v2.0.0

A comprehensive, intelligent system for archiving, processing, and analyzing Iranian legal documents with advanced proxy management, caching, and real-time processing capabilities.

## ✨ Features

### 🔧 Core Functionality
- **Intelligent Document Processing**: Advanced parsing and extraction of legal documents
- **Smart Proxy Management**: Automatic proxy rotation and health monitoring
- **Intelligent Caching**: Efficient content caching with automatic cleanup
- **Real-time Monitoring**: Live dashboard with system metrics and statistics
- **Multi-source Support**: Process documents from various Iranian legal websites

### 📊 Advanced Analytics
- **Document Classification**: Automatic categorization of legal documents
- **Quality Scoring**: AI-powered quality assessment of extracted content
- **Source Analysis**: Track and analyze document sources
- **Performance Metrics**: Comprehensive system performance monitoring

### 🌐 Web Interface
- **Modern Dashboard**: Beautiful, responsive Persian/Farsi interface
- **Real-time Updates**: Live status updates and progress monitoring
- **Dark/Light Theme**: Automatic theme switching with user preferences
- **Mobile Responsive**: Optimized for all device sizes

### 🛡️ Security & Reliability
- **Proxy Health Monitoring**: Automatic proxy testing and failover
- **Error Handling**: Comprehensive error handling and logging
- **Background Services**: Automated maintenance and monitoring
- **Data Integrity**: Robust database management with SQLite

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip package manager
- Internet connection for proxy and document fetching

### Installation

1. **Clone or download the project files**
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the system:**
   ```bash
   python run_enhanced_legal_archive.py
   ```

4. **Access the dashboard:**
   Open your browser and go to `http://127.0.0.1:8000`

### Alternative Installation Methods

#### Using Virtual Environment (Recommended)
```bash
# Create virtual environment
python -m venv legal_archive_env

# Activate virtual environment
# On Linux/Mac:
source legal_archive_env/bin/activate
# On Windows:
legal_archive_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the system
python run_enhanced_legal_archive.py
```

#### Docker Installation (Coming Soon)
```bash
docker build -t iranian-legal-archive .
docker run -p 8000:8000 iranian-legal-archive
```

## 📖 Usage Guide

### Basic Usage

1. **Start the System:**
   ```bash
   python run_enhanced_legal_archive.py
   ```

2. **Access Dashboard:**
   Navigate to `http://127.0.0.1:8000` in your web browser

3. **Process Documents:**
   - Go to the "پردازش اسناد" (Document Processing) section
   - Enter URLs of legal documents (one per line)
   - Click "شروع پردازش" (Start Processing)

4. **Monitor Progress:**
   - View real-time processing status
   - Check system metrics and statistics
   - Monitor proxy health and performance

### Advanced Configuration

#### Command Line Options
```bash
python run_enhanced_legal_archive.py --help
```

Available options:
- `--host`: Host to bind the server (default: 127.0.0.1)
- `--port`: Port to bind the server (default: 8000)
- `--data-dir`: Directory to store data files (default: /tmp/data)
- `--log-level`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `--dev`: Run in development mode with auto-reload
- `--check-deps`: Check dependencies and exit

#### Examples
```bash
# Run on different port
python run_enhanced_legal_archive.py --port 8080

# Allow external connections
python run_enhanced_legal_archive.py --host 0.0.0.0

# Development mode with auto-reload
python run_enhanced_legal_archive.py --dev

# Custom data directory
python run_enhanced_legal_archive.py --data-dir ./my_data

# Debug mode
python run_enhanced_legal_archive.py --log-level DEBUG
```

## 🏗️ Architecture

### System Components

1. **FastAPI Backend**: RESTful API server with async support
2. **SQLite Databases**: 
   - Main document storage
   - Intelligent cache management
   - Proxy management and statistics
3. **Web Interface**: Modern HTML5/CSS3/JavaScript frontend
4. **Background Services**: Automated monitoring and maintenance
5. **Proxy Manager**: Intelligent proxy rotation and health checking

### Database Schema

#### Documents Table
- `id`: Unique document identifier
- `title`: Document title
- `url`: Source URL
- `content`: Extracted text content
- `source`: Document source/website
- `category`: Document category (قانون، رأی، etc.)
- `timestamp`: Processing timestamp
- `quality_score`: AI-calculated quality score
- `word_count`: Number of words in content
- `classification`: Legal classification
- `metadata`: Additional metadata in JSON format

#### Cache Table
- `url_hash`: MD5 hash of URL
- `url`: Original URL
- `content`: Cached content
- `timestamp`: Cache creation time
- `access_count`: Number of accesses
- `last_access`: Last access timestamp

#### Proxies Table
- `id`: Proxy identifier
- `host`: Proxy host
- `port`: Proxy port
- `protocol`: Protocol (http/https)
- `username`: Authentication username (optional)
- `password`: Authentication password (optional)
- `status`: Current status (active/failed/untested)
- `response_time`: Average response time
- `last_tested`: Last test timestamp
- `success_count`: Number of successful requests
- `fail_count`: Number of failed requests

## 🔌 API Reference

### Endpoints

#### System Status
- `GET /api/status` - Get current system status
- `GET /api/stats` - Get detailed statistics

#### Document Processing
- `POST /api/process-urls` - Process a list of URLs
- `GET /api/documents` - Get processed documents (with filtering)

#### Network Management
- `GET /api/network` - Get network and proxy status
- `POST /api/network/test-all` - Test all proxies
- `POST /api/network/update-proxies` - Update proxy list

#### Cache Management
- `DELETE /api/cache` - Clear all cached data

#### Logging
- `GET /api/logs` - Get system logs (with filtering)

### Request/Response Examples

#### Process URLs
```bash
curl -X POST "http://localhost:8000/api/process-urls" \
     -H "Content-Type: application/json" \
     -d '{"urls": ["https://example.com/legal-doc1", "https://example.com/legal-doc2"]}'
```

Response:
```json
{
  "message": "پردازش 2 URL شروع شد",
  "success": true
}
```

#### Get System Status
```bash
curl "http://localhost:8000/api/status"
```

Response:
```json
{
  "is_processing": false,
  "progress": 100,
  "message": "سیستم آماده است",
  "total_operations": 150,
  "successful_operations": 142,
  "failed_operations": 8,
  "total_documents": 89,
  "active_proxies": 12,
  "cache_size": 45,
  "success_rate": 94.67,
  "proxy_health": 85,
  "cache_usage": 23
}
```

## 🛠️ Development

### Project Structure
```
iranian-legal-archive/
├── enhanced_legal_archive_system.py    # Main system implementation
├── run_enhanced_legal_archive.py       # Startup script
├── requirements.txt                    # Python dependencies
├── static/                            # Static web assets
│   ├── css/
│   │   └── main.css                   # Main stylesheet
│   ├── js/
│   │   └── main.js                    # Main JavaScript
│   └── images/                        # Image assets
├── ENHANCED_LEGAL_ARCHIVE_README.md   # This file
└── iranian_legal_archive.log          # System log file
```

### Adding New Features

1. **Document Parsers**: Extend the `_parse_document()` method
2. **Proxy Sources**: Add new proxy sources in `_update_proxies_task()`
3. **Classification**: Improve document classification in `_classify_document()`
4. **UI Components**: Add new sections to the web interface

### Testing

```bash
# Check dependencies
python run_enhanced_legal_archive.py --check-deps

# Run in development mode
python run_enhanced_legal_archive.py --dev --log-level DEBUG

# Test API endpoints
curl http://localhost:8000/api/status
```

## 🔧 Configuration

### Environment Variables
- `LEGAL_ARCHIVE_HOST`: Server host (default: 127.0.0.1)
- `LEGAL_ARCHIVE_PORT`: Server port (default: 8000)
- `LEGAL_ARCHIVE_DATA_DIR`: Data directory (default: /tmp/data)
- `LEGAL_ARCHIVE_LOG_LEVEL`: Log level (default: INFO)

### Configuration File (Optional)
Create a `config.json` file:
```json
{
  "host": "0.0.0.0",
  "port": 8000,
  "data_dir": "./data",
  "log_level": "INFO",
  "proxy_test_interval": 21600,
  "cache_cleanup_time": "03:00",
  "max_cache_size": 104857600
}
```

## 📊 Performance Tuning

### Optimization Tips

1. **Database Performance**:
   - Regular VACUUM operations
   - Proper indexing on frequently queried columns
   - Consider WAL mode for concurrent access

2. **Proxy Management**:
   - Adjust proxy test intervals based on reliability
   - Use proxy pools for different document sources
   - Monitor proxy performance metrics

3. **Caching Strategy**:
   - Implement cache size limits
   - Use LRU eviction policies
   - Consider Redis for distributed caching

4. **Resource Usage**:
   - Monitor memory usage with large document processing
   - Use connection pooling for database operations
   - Implement rate limiting for external requests

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check if port is in use
netstat -tulpn | grep :8000

# Try different port
python run_enhanced_legal_archive.py --port 8080
```

#### Dependencies Issues
```bash
# Check dependencies
python run_enhanced_legal_archive.py --check-deps

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

#### Database Issues
```bash
# Check data directory permissions
ls -la /tmp/data

# Reset databases (WARNING: This will delete all data)
rm -rf /tmp/data/*.sqlite
```

#### Proxy Issues
- Check internet connectivity
- Verify proxy configurations
- Test proxy endpoints manually

### Log Analysis
```bash
# View recent logs
tail -f iranian_legal_archive.log

# Search for errors
grep "ERROR" iranian_legal_archive.log

# Filter by component
grep "proxy" iranian_legal_archive.log
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Code Style**: Follow PEP 8 for Python code
2. **Documentation**: Update documentation for new features
3. **Testing**: Add tests for new functionality
4. **Commits**: Use clear, descriptive commit messages

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd iranian-legal-archive

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements.txt
pip install pytest black flake8

# Run tests
pytest

# Format code
black *.py

# Check code style
flake8 *.py
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Persian/Farsi Language Support**: Thanks to the Vazirmatn font family
- **Web Framework**: Built with FastAPI and modern web technologies
- **Legal Document Sources**: Various Iranian legal institutions and databases
- **Open Source Libraries**: All the amazing open-source libraries that make this possible

## 📞 Support

For support and questions:

1. **Documentation**: Check this README and inline code documentation
2. **Issues**: Create an issue in the project repository
3. **Logs**: Check the system logs for detailed error information
4. **Community**: Join discussions in the project forums

## 🚀 Roadmap

### Version 2.1.0 (Planned)
- [ ] Machine learning-based document classification
- [ ] Advanced search capabilities
- [ ] Document similarity detection
- [ ] Export functionality (PDF, Word, etc.)

### Version 2.2.0 (Planned)
- [ ] Multi-user support with authentication
- [ ] Document annotation and commenting
- [ ] Integration with external legal databases
- [ ] Advanced analytics and reporting

### Version 3.0.0 (Future)
- [ ] Distributed processing with multiple workers
- [ ] Advanced NLP for legal text analysis
- [ ] Integration with legal AI assistants
- [ ] Enterprise features and scalability improvements

---

**Enhanced Iranian Legal Archive System v2.0.0**  
Built with ❤️ for the Iranian legal community