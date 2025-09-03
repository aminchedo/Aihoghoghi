# Persian BERT Legal Archive System - Production Deployment

This directory contains everything needed to deploy the Persian BERT Legal Archive System to production.

## 🚀 Quick Start

1. **Setup Production Environment:**
   ```bash
   chmod +x setup_production.sh
   ./setup_production.sh
   ```

2. **Deploy the Application:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Test All Endpoints:**
   ```bash
   chmod +x test_endpoints.sh
   ./test_endpoints.sh
   ```

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: Minimum 20GB available space
- **CPU**: 2+ cores (4+ cores recommended for AI models)

### Network Requirements
- **Domain**: A registered domain name pointing to your server
- **Ports**: 80, 443, 8000, 3000, 9090, 5432, 6379 available
- **Firewall**: UFW or equivalent firewall management

### External Services
- **Hugging Face**: API token for downloading Persian BERT models
- **Email**: Valid email for SSL certificate notifications

## 🏗️ Architecture

The production deployment uses Docker containers with the following services:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80/443)│    │  FastAPI App    │    │   PostgreSQL    │
│   (Reverse Proxy)│◄──►│   (Port 8000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Certbot       │    │   Redis Cache   │    │   Prometheus    │
│   (SSL Certs)   │    │   (Port 6379)   │    │   (Port 9090)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Grafana       │    │  Model Manager  │    │   AI Models     │
│   (Port 3000)   │    │   (Port 8001)   │    │   (Local Cache) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Directory Structure

```
production/
├── docker-compose.yml          # Main orchestration file
├── Dockerfile                  # Application container
├── Dockerfile.model-manager    # AI model management container
├── .env.example               # Environment variables template
├── setup_production.sh        # Initial setup script
├── deploy.sh                  # Deployment script
├── test_endpoints.sh          # Endpoint testing script
├── nginx/                     # Nginx configuration
│   ├── nginx.conf            # Main Nginx config
│   └── conf.d/               # Server blocks
│       └── default.conf      # Domain configuration
├── monitoring/                # Monitoring setup
│   ├── prometheus.yml        # Prometheus configuration
│   └── grafana/              # Grafana dashboards
│       └── provisioning/     # Auto-provisioning configs
├── init-scripts/              # Database initialization
│   └── 01-init-database.sql  # Schema and seed data
├── model_manager.py           # AI model management service
└── README.md                  # This file
```

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required: Domain and SSL
DOMAIN_NAME=your-domain.com
CERTBOT_EMAIL=admin@your-domain.com

# Required: Database
POSTGRES_PASSWORD=your_secure_password

# Required: Cache
REDIS_PASSWORD=your_secure_password

# Required: Monitoring
GRAFANA_PASSWORD=your_secure_password

# Required: AI Models
HUGGINGFACE_TOKEN=your_huggingface_token

# Optional: Application
SECRET_KEY=your_secret_key
LOG_LEVEL=INFO
```

### Domain Configuration

1. **DNS Setup**: Point your domain to your server's IP address
2. **SSL Certificate**: Automatically obtained via Let's Encrypt
3. **HTTP to HTTPS**: Automatic redirect configured

## 🔧 Deployment Process

### 1. Initial Setup
```bash
./setup_production.sh
```
- Installs Docker and Docker Compose
- Configures firewall rules
- Sets up SSL renewal cron jobs
- Configures backup automation
- Sets up monitoring alerts

### 2. Deploy Application
```bash
./deploy.sh
```
- Builds Docker containers
- Starts all services
- Initializes database
- Downloads AI models
- Configures SSL certificates
- Sets up monitoring

### 3. Verify Deployment
```bash
./test_endpoints.sh
```
- Tests all application endpoints
- Verifies SSL configuration
- Checks monitoring systems
- Validates AI model functionality

## 📊 Monitoring & Observability

### Prometheus Metrics
- **Application Metrics**: Request rate, response time, error rate
- **System Metrics**: CPU, memory, disk usage
- **Database Metrics**: Connection count, query performance
- **AI Model Metrics**: Model status, inference time

### Grafana Dashboards
- **Application Health**: Real-time status monitoring
- **Performance Metrics**: Response times and throughput
- **Resource Usage**: System resource consumption
- **AI Model Status**: Model availability and performance

### Alerting
- **Application Down**: Critical alerts for service failures
- **High Error Rate**: Warning alerts for increased errors
- **Performance Issues**: Alerts for slow response times
- **Resource Exhaustion**: Alerts for high resource usage

## 🔒 Security Features

### Network Security
- **Firewall**: UFW configured with minimal open ports
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configured for production domains only

### Application Security
- **HTTPS Only**: All traffic encrypted with SSL/TLS
- **Security Headers**: HSTS, XSS protection, frame options
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries

### Access Control
- **Non-root Containers**: All services run as non-root users
- **Secret Management**: Environment variables for sensitive data
- **Database Access**: Restricted database user permissions

## 💾 Backup & Recovery

### Automated Backups
- **Database**: Daily PostgreSQL dumps
- **Application Data**: Logs and model cache
- **Configuration**: Environment and config files
- **Retention**: 7 days of backups kept

### Manual Backup
```bash
./backup.sh
```

### Recovery Process
1. Stop services: `docker-compose down`
2. Restore database: `psql -U postgres -d persian_legal_db < backup.sql`
3. Restore data: `tar -xzf app_data_backup.tar.gz`
4. Restart services: `docker-compose up -d`

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart services
docker-compose restart
```

#### SSL Certificate Issues
```bash
# Renew certificates manually
./renew_ssl.sh

# Check certificate status
docker-compose run --rm certbot certificates
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres
```

#### AI Model Issues
```bash
# Check model status
docker-compose exec model-manager python -c "
from model_manager import PersianBERTModelManager
manager = PersianBERTModelManager()
print(manager.get_model_status())
"

# Restart model manager
docker-compose restart model-manager
```

### Log Locations
- **Application**: `docker-compose logs -f persian-bert-app`
- **Nginx**: `docker-compose logs -f nginx`
- **Database**: `docker-compose logs -f postgres`
- **Monitoring**: `docker-compose logs -f prometheus grafana`

## 📈 Scaling & Performance

### Horizontal Scaling
- **Load Balancer**: Add multiple application instances
- **Database**: Implement read replicas
- **Cache**: Redis cluster for high availability

### Vertical Scaling
- **Resources**: Increase CPU/memory allocation
- **Storage**: Use SSD storage for better I/O
- **Network**: Optimize network configuration

### Performance Tuning
- **Database**: Optimize PostgreSQL configuration
- **Application**: Tune FastAPI worker processes
- **Caching**: Implement Redis caching strategies
- **CDN**: Use CDN for static assets

## 🔄 Maintenance

### Regular Tasks
- **SSL Renewal**: Automatic via cron (every 60 days)
- **Backups**: Daily automated backups
- **Log Rotation**: Automatic log management
- **Security Updates**: Regular Docker image updates

### Update Process
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Test deployment
./test_endpoints.sh
```

### Health Checks
- **Application**: `/health` endpoint
- **Database**: Connection pool monitoring
- **Cache**: Redis memory usage
- **AI Models**: Model availability status

## 📞 Support

### Getting Help
1. **Check Logs**: Review application and service logs
2. **Test Endpoints**: Run the testing script
3. **Monitor Metrics**: Check Prometheus and Grafana
4. **Documentation**: Review this README and code comments

### Useful Commands
```bash
# View all service status
docker-compose ps

# View real-time logs
docker-compose logs -f

# Access application shell
docker-compose exec persian-bert-app bash

# Check resource usage
docker stats

# View network configuration
docker network ls
docker network inspect production_app-network
```

## 📝 License

This production deployment configuration is part of the Persian BERT Legal Archive System and follows the same license terms as the main project.

---

**Note**: This production setup is designed for production use but should be thoroughly tested in a staging environment before deploying to production. Always backup your data and test recovery procedures.