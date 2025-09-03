# Iranian Legal Archive System - Deployment Scripts

This directory contains all the automated deployment scripts for the Iranian Legal Archive System.

## 🚀 Quick Start

For the easiest deployment experience, use the interactive quick-start script:

```bash
cd scripts
chmod +x quick-start.sh
./quick-start.sh
```

This will guide you through the complete deployment process step by step.

## 📁 Script Overview

### Core Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `quick-start.sh` | Interactive deployment menu | `./quick-start.sh` |
| `server-setup.sh` | Initial server preparation | `sudo ./server-setup.sh` |
| `setup-environment.sh` | Application environment setup | `sudo ./setup-environment.sh yourdomain.com` |
| `create-env-file.sh` | Environment configuration | `sudo ./create-env-file.sh` |
| `setup-ssl.sh` | SSL certificate installation | `sudo ./setup-ssl.sh domain.com email@domain.com` |
| `deploy.sh` | Application deployment | `sudo ./deploy.sh` |

### Testing & Monitoring Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `test-deployment.sh` | Comprehensive testing | `sudo ./test-deployment.sh yourdomain.com` |
| `health-monitor.sh` | Health monitoring | `sudo ./health-monitor.sh` |
| `setup-monitoring.sh` | Grafana/Prometheus setup | `sudo ./setup-monitoring.sh` |

### Maintenance Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `update-system.sh` | System updates | `sudo ./update-system.sh` |
| `backup-system.sh` | System backup | `sudo ./backup-system.sh` |
| `rollback.sh` | Rollback to previous version | `sudo ./rollback.sh` |

## 🔧 Manual Deployment Steps

If you prefer to run scripts individually, follow this order:

### 1. Server Preparation
```bash
sudo ./server-setup.sh
# Log out and log back in for Docker group changes
```

### 2. Environment Setup
```bash
sudo ./setup-environment.sh yourdomain.com
```

### 3. Configuration
```bash
sudo ./create-env-file.sh
```

### 4. SSL Setup (Optional)
```bash
sudo ./setup-ssl.sh yourdomain.com your-email@domain.com
```

### 5. Deploy Application
```bash
sudo ./deploy.sh
```

### 6. Test Deployment
```bash
sudo ./test-deployment.sh yourdomain.com
```

### 7. Setup Monitoring
```bash
sudo ./setup-monitoring.sh
```

### 8. Setup Automation
```bash
# Health monitoring (every 5 minutes)
sudo cp health-monitor.sh /usr/local/bin/
echo "*/5 * * * * /usr/local/bin/health-monitor.sh" | sudo crontab -

# Daily backups (2:00 AM)
sudo cp backup-system.sh /usr/local/bin/
echo "0 2 * * * /usr/local/bin/backup-system.sh" | sudo crontab -

# Weekly updates (Sunday 3:00 AM)
sudo cp update-system.sh /usr/local/bin/
echo "0 3 * * 0 /usr/local/bin/update-system.sh" | sudo crontab -
```

## 🌐 Domain Configuration

### Free Domain Options

1. **Freenom** - Free .tk, .ml, .ga domains
2. **GitHub Pages** - `https://yourusername.github.io/Aihoghoghi/`
3. **Netlify/Vercel** - Custom subdomains

### DNS Configuration

Use the DNS helper script:
```bash
./dns-setup.sh
```

Or manually configure these records:
- **A Record**: `@` → Your server IP
- **A Record**: `www` → Your server IP
- **CNAME Record**: `api` → Your domain

## 📊 Monitoring Access

After setup, access monitoring tools at:

- **Grafana**: `http://yourdomain.com:3001` (admin/admin123)
- **Prometheus**: `http://yourdomain.com:9090`
- **Application**: `https://yourdomain.com`

## 🛠️ Troubleshooting

### Common Issues

1. **Service won't start**:
   ```bash
   sudo journalctl -u iranian-legal-archive -f
   sudo systemctl status iranian-legal-archive
   ```

2. **Permission issues**:
   ```bash
   sudo chown -R appuser:appuser /opt/iranian-legal-archive
   ```

3. **Nginx errors**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Rollback

If deployment fails, rollback to previous version:
```bash
sudo ./rollback.sh
```

## 🔒 Security Features

- Firewall configured (ports 80, 443, 7860 only)
- SSL certificates with auto-renewal
- Non-root application user
- Secure environment file permissions
- Automated security updates

## 📈 Performance Features

- Gzip compression enabled
- Static file caching
- Database optimization
- Load balancing ready
- Monitoring and alerting

## 📝 Log Files

- Application logs: `/var/log/iranian-legal-archive/`
- Health monitoring: `/var/log/iranian-legal-archive-health.log`
- Maintenance: `/var/log/maintenance.log`
- System logs: `journalctl -u iranian-legal-archive`

## 🆘 Support

For issues or questions:

1. Check the logs: `sudo journalctl -u iranian-legal-archive -f`
2. Run health check: `sudo ./health-monitor.sh`
3. Test deployment: `sudo ./test-deployment.sh yourdomain.com`
4. Review this README and the main deployment guide

## 📋 Prerequisites

- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 2GB+ RAM, 10GB+ storage
- Root/sudo access
- Domain name with DNS control
- Internet connection for package installation

---

**Note**: All scripts include error handling and will exit on critical errors. Review the output carefully and address any warnings before proceeding to the next step.