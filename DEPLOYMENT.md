# 🚀 Deployment Guide - Iranian Legal Archive System v2.0

This guide covers various deployment options for the Iranian Legal Archive System.

## 📋 Quick Start Options

### Option 1: Simple Launch (Recommended for Testing)
```bash
python3 launch.py
```

### Option 2: Full Setup (Recommended for Production)
```bash
python3 setup.py
python3 start.py
```

### Option 3: Docker Deployment (Recommended for Production)
```bash
docker-compose up -d
```

## 🛠️ Detailed Setup Instructions

### 1. Local Development Setup

#### Prerequisites
- Python 3.8+
- 4GB+ RAM
- Stable internet connection

#### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd iranian-legal-archive
   ```

2. **Run automated setup**:
   ```bash
   python3 setup.py
   ```
   
   Or manual setup:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Initialize the system**:
   ```bash
   python3 migrate_data.py  # If migrating from v1.x
   python3 start.py
   ```

4. **Access the application**:
   Open `http://localhost:8000` in your browser

### 2. Docker Deployment

#### Single Container
```bash
# Build the image
docker build -t legal-archive .

# Run the container
docker run -d \
  --name legal-archive \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  legal-archive
```

#### Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production with Nginx
```bash
# Start with nginx proxy
docker-compose --profile production up -d

# Access via nginx
# HTTP: http://localhost
# HTTPS: https://localhost (configure SSL certificates)
```

### 3. Cloud Deployment

#### Hugging Face Spaces

1. **Create a new Space**:
   - Go to https://huggingface.co/spaces
   - Click "Create new Space"
   - Choose "Gradio" as SDK (for compatibility)

2. **Upload files**:
   ```bash
   # Upload all files except:
   # - venv/
   # - __pycache__/
   # - .git/
   # - data/ (will be created automatically)
   ```

3. **Add app_file configuration**:
   Create `app_file: app.py` in your Space settings

4. **Set environment variables**:
   ```
   TRANSFORMERS_CACHE=/tmp/models
   HF_HOME=/tmp/models
   TORCH_HOME=/tmp/models
   CUDA_VISIBLE_DEVICES=""
   ```

#### AWS EC2

1. **Launch EC2 instance**:
   - Ubuntu 20.04 LTS
   - t3.large or larger (4GB+ RAM)
   - Security group: Allow HTTP (80), HTTPS (443), Custom (8000)

2. **Setup on EC2**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Python and dependencies
   sudo apt install -y python3 python3-pip python3-venv git
   
   # Clone repository
   git clone <repository-url>
   cd iranian-legal-archive
   
   # Run setup
   python3 setup.py
   ```

3. **Configure systemd service**:
   ```bash
   # Create service file
   sudo nano /etc/systemd/system/legal-archive.service
   ```
   
   Service file content:
   ```ini
   [Unit]
   Description=Iranian Legal Archive System
   After=network.target
   
   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/iranian-legal-archive
   ExecStart=/home/ubuntu/iranian-legal-archive/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   Enable and start:
   ```bash
   sudo systemctl enable legal-archive
   sudo systemctl start legal-archive
   sudo systemctl status legal-archive
   ```

#### Google Cloud Platform

1. **Create Compute Engine instance**:
   ```bash
   gcloud compute instances create legal-archive-vm \
     --image-family=ubuntu-2004-lts \
     --image-project=ubuntu-os-cloud \
     --machine-type=e2-standard-2 \
     --boot-disk-size=50GB
   ```

2. **Setup and deploy**:
   ```bash
   # SSH to instance
   gcloud compute ssh legal-archive-vm
   
   # Follow local setup instructions
   # ...
   ```

3. **Configure firewall**:
   ```bash
   gcloud compute firewall-rules create allow-legal-archive \
     --allow tcp:8000 \
     --source-ranges 0.0.0.0/0
   ```

### 4. Production Considerations

#### Performance Optimization

1. **Use production WSGI server**:
   ```bash
   # Install gunicorn
   pip install gunicorn
   
   # Run with multiple workers
   gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

2. **Configure reverse proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
       
       location /ws {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

3. **Database optimization**:
   ```bash
   # Regular database maintenance
   sqlite3 data/databases/legal_archive.sqlite "VACUUM; ANALYZE;"
   ```

#### Security

1. **Firewall configuration**:
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **SSL/TLS setup**:
   ```bash
   # Using Let's Encrypt
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

3. **Environment variables**:
   ```bash
   # Create secure .env file
   echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env
   chmod 600 .env
   ```

#### Monitoring

1. **Log management**:
   ```bash
   # Setup log rotation
   sudo nano /etc/logrotate.d/legal-archive
   ```
   
   Logrotate configuration:
   ```
   /home/ubuntu/iranian-legal-archive/logs/*.log {
       daily
       rotate 7
       compress
       delaycompress
       missingok
       notifempty
       copytruncate
   }
   ```

2. **Health monitoring**:
   ```bash
   # Add to crontab for health checks
   */5 * * * * curl -f http://localhost:8000/api/status || echo "Service down" | mail -s "Legal Archive Alert" admin@example.com
   ```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Find process using port 8000
   sudo lsof -i :8000
   
   # Kill process if needed
   sudo kill -9 <PID>
   
   # Or use different port
   uvicorn app:app --port 8080
   ```

2. **Permission denied errors**:
   ```bash
   # Fix file permissions
   chmod +x launch.py setup.py start.py
   
   # Fix directory permissions
   chmod -R 755 data/
   ```

3. **Memory issues**:
   ```bash
   # Monitor memory usage
   htop
   
   # Reduce model cache size
   export TRANSFORMERS_CACHE="/tmp/small_cache"
   ```

4. **SSL certificate issues**:
   ```bash
   # Disable SSL verification temporarily
   export PYTHONHTTPSVERIFY=0
   
   # Or update certificates
   sudo apt update && sudo apt install ca-certificates
   ```

### Performance Tuning

1. **Database optimization**:
   ```sql
   -- Run these queries periodically
   VACUUM;
   ANALYZE;
   REINDEX;
   ```

2. **Cache tuning**:
   ```python
   # Adjust cache settings in utils/cache_system.py
   self.max_memory_items = 200  # Increase for more RAM
   self.cleanup_interval = 3600  # Adjust cleanup frequency
   ```

3. **Proxy optimization**:
   ```python
   # Adjust proxy settings in utils/proxy_manager.py
   self.update_interval = 1800  # Proxy refresh interval
   max_workers = 8  # Concurrent proxy tests
   ```

## 📊 Monitoring and Maintenance

### Regular Maintenance Tasks

1. **Weekly tasks**:
   ```bash
   # Clear old cache entries
   curl -X DELETE "http://localhost:8000/api/cache" -H "Content-Type: application/json" -d '{"older_than_hours": 168}'
   
   # Update proxy list
   curl -X POST "http://localhost:8000/api/update-proxies"
   ```

2. **Monthly tasks**:
   ```bash
   # Database optimization
   python3 -c "
   from utils import UltraModernLegalArchive
   archive = UltraModernLegalArchive()
   archive.cleanup_and_optimize()
   "
   
   # Backup data
   tar -czf backup-$(date +%Y%m%d).tar.gz data/
   ```

### Monitoring Endpoints

- **Health Check**: `GET /api/status`
- **System Stats**: `GET /api/stats` 
- **Cache Health**: `GET /api/cache/stats`

### Log Locations

- **Application Logs**: `logs/app.log`
- **Access Logs**: `logs/access.log`
- **Error Logs**: `logs/error.log`

## 🆘 Support

If you encounter issues:

1. Check the logs: `tail -f logs/app.log`
2. Verify system health: `curl http://localhost:8000/api/status`
3. Test individual components: `python3 test_system.py`
4. Review troubleshooting section in README.md

For additional support, please open an issue on GitHub with:
- System information (OS, Python version)
- Error logs and stack traces
- Steps to reproduce the issue