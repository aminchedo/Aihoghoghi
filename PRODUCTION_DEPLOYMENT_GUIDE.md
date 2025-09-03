# 🚀 **PRODUCTION DEPLOYMENT GUIDE**
## Iranian Legal Archive System

---

## 📋 **TABLE OF CONTENTS**

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

---

## 🔧 **PREREQUISITES**

### **Required Accounts & Services:**
- ✅ GitHub repository access
- ✅ Domain name with DNS control
- ✅ Production server (VPS/Cloud instance)
- ✅ SSH access to server
- ✅ Root/sudo access on server

### **Technical Knowledge:**
- ✅ Basic Linux server administration
- ✅ Understanding of DNS configuration
- ✅ Familiarity with SSL certificates
- ✅ Basic database management

---

## 🖥️ **SERVER REQUIREMENTS**

### **Minimum Specifications:**
- **CPU**: 4 cores (2.0 GHz+)
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: High-speed internet connection
- **OS**: Ubuntu 20.04 LTS or newer

### **Recommended Specifications:**
- **CPU**: 8 cores (2.5 GHz+)
- **RAM**: 16GB
- **Storage**: 200GB+ NVMe SSD
- **Network**: 1Gbps+ connection
- **OS**: Ubuntu 22.04 LTS

### **Software Requirements:**
- Docker & Docker Compose
- Node.js 18.x+
- PostgreSQL 13+
- Redis 6+
- Nginx
- Python 3.8+

---

## ✅ **PRE-DEPLOYMENT CHECKLIST**

### **Domain & DNS:**
- [ ] Domain name purchased and active
- [ ] DNS provider configured
- [ ] A record ready for server IP
- [ ] Email address for SSL certificates

### **Server Preparation:**
- [ ] Server provisioned and running
- [ ] SSH access configured
- [ ] Root/sudo access available
- [ ] Server IP address noted
- [ ] Firewall ports open (22, 80, 443)

### **Repository:**
- [ ] Code pushed to main branch
- [ ] All tests passing
- [ ] Production configuration ready
- [ ] Environment variables documented

---

## 🚀 **DEPLOYMENT STEPS**

### **Step 1: Server Access & Preparation**

```bash
# SSH to your server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git unzip
```

### **Step 2: Clone & Setup Project**

```bash
# Clone the repository
git clone https://github.com/aminchedo/Aihoghoghi.git /opt/iranian-legal-archive
cd /opt/iranian-legal-archive

# Make deployment script executable
chmod +x deploy-production.sh
```

### **Step 3: Run Production Deployment**

```bash
# Execute the deployment script
./deploy-production.sh YOUR_DOMAIN.COM admin@YOUR_DOMAIN.COM
```

**⚠️ Important Notes:**
- Replace `YOUR_DOMAIN.COM` with your actual domain
- Replace `admin@YOUR_DOMAIN.COM` with your email
- The script will take 15-30 minutes to complete
- Keep the terminal session active during deployment

### **Step 4: DNS Configuration**

After deployment, update your DNS records:

```dns
# A Record
@    IN    A    YOUR_SERVER_IP

# CNAME Record (optional)
www  IN    CNAME @
```

### **Step 5: SSL Certificate Verification**

```bash
# Check SSL certificate status
certbot certificates

# Test auto-renewal
certbot renew --dry-run
```

---

## 🔍 **POST-DEPLOYMENT VERIFICATION**

### **Service Status Check:**

```bash
# Check all services
systemctl status iranian-legal-archive
systemctl status nginx
systemctl status postgresql
systemctl status redis-server
systemctl status elasticsearch
systemctl status prometheus
systemctl status grafana-server
```

### **Endpoint Testing:**

```bash
# Test API endpoints
curl -k https://YOUR_DOMAIN.COM/api/health
curl -k https://YOUR_DOMAIN.COM/api/documents
curl -k https://YOUR_DOMAIN.COM/metrics

# Test monitoring
curl -k https://YOUR_DOMAIN.COM/grafana/
```

### **Database Verification:**

```bash
# Connect to database
sudo -u postgres psql -d iranian_legal_archive

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM legal_documents;
```

---

## 📊 **MONITORING & MAINTENANCE**

### **Monitoring Dashboards:**

1. **Grafana**: `https://YOUR_DOMAIN.COM/grafana/`
   - Default credentials: `admin` / `[generated_password]`
   - Monitor system metrics, API performance, database health

2. **Prometheus**: `https://YOUR_DOMAIN.COM/metrics`
   - Raw metrics endpoint for custom monitoring

### **Log Monitoring:**

```bash
# Application logs
tail -f /var/log/iranian-legal-archive/*.log

# System logs
journalctl -u iranian-legal-archive -f
journalctl -u nginx -f

# Database logs
tail -f /var/log/postgresql/postgresql-*.log
```

### **Regular Maintenance Tasks:**

```bash
# Daily
- Check service status
- Monitor disk space
- Review error logs

# Weekly
- Update system packages
- Review security logs
- Check backup status

# Monthly
- SSL certificate renewal
- Database optimization
- Security updates
```

---

## 🛠️ **TROUBLESHOOTING**

### **Common Issues & Solutions:**

#### **1. Service Won't Start**
```bash
# Check service status
systemctl status iranian-legal-archive

# Check logs
journalctl -u iranian-legal-archive -n 50

# Check configuration
node -c /opt/iranian-legal-archive/src/backend/productionServer.js
```

#### **2. Database Connection Issues**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check connection
sudo -u postgres psql -d iranian_legal_archive -c "SELECT 1;"

# Check environment variables
cat /opt/iranian-legal-archive/.env | grep DB_
```

#### **3. SSL Certificate Issues**
```bash
# Check certificate status
certbot certificates

# Renew certificate
certbot renew

# Check Nginx configuration
nginx -t
```

#### **4. Performance Issues**
```bash
# Check system resources
htop
iotop
nethogs

# Check database performance
sudo -u postgres psql -d iranian_legal_archive -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## 🔒 **SECURITY CONSIDERATIONS**

### **Firewall Configuration:**
```bash
# Check firewall status
ufw status

# Allow only necessary ports
ufw allow ssh
ufw allow 80
ufw allow 443
ufw deny 3000  # Internal API port
```

### **SSL/TLS Security:**
- ✅ HSTS enabled
- ✅ Modern cipher suites
- ✅ SSL certificate auto-renewal
- ✅ Security headers configured

### **Access Control:**
- ✅ Service user with minimal privileges
- ✅ Database user with limited access
- ✅ Fail2ban protection
- ✅ Regular security updates

### **Data Protection:**
- ✅ Database encryption at rest
- ✅ Secure password generation
- ✅ Regular backups
- ✅ Access logging

---

## 📈 **SCALING & OPTIMIZATION**

### **Performance Tuning:**

#### **Database Optimization:**
```sql
-- Enable query optimization
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
```

#### **Application Optimization:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable clustering
export CLUSTER_ENABLED=true
export CLUSTER_WORKERS=4
```

#### **Nginx Optimization:**
```nginx
# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 📞 **SUPPORT & RESOURCES**

### **Documentation:**
- [Project Repository](https://github.com/aminchedo/Aihoghoghi)
- [API Documentation](https://YOUR_DOMAIN.COM/api/docs)
- [System Monitoring](https://YOUR_DOMAIN.COM/grafana/)

### **Logs & Debugging:**
- Application logs: `/var/log/iranian-legal-archive/`
- System logs: `journalctl -u iranian-legal-archive`
- Database logs: `/var/log/postgresql/`
- Nginx logs: `/var/log/nginx/`

### **Emergency Contacts:**
- System Administrator: [Your Contact]
- Database Administrator: [Your Contact]
- Security Team: [Your Contact]

---

## 🎯 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment:**
- [ ] Server provisioned and accessible
- [ ] Domain DNS configured
- [ ] Repository code ready
- [ ] Environment variables prepared
- [ ] SSL certificate email ready

### **During Deployment:**
- [ ] Deployment script executed
- [ ] All services started successfully
- [ ] Database initialized
- [ ] AI models downloaded
- [ ] SSL certificates obtained
- [ ] Monitoring configured

### **Post-Deployment:**
- [ ] All endpoints responding
- [ ] SSL certificates working
- [ ] Monitoring dashboards accessible
- [ ] Database connections stable
- [ ] Backup system functional
- [ ] Security measures active

---

## 🚨 **EMERGENCY PROCEDURES**

### **System Failure:**
```bash
# Stop all services
systemctl stop iranian-legal-archive nginx postgresql redis-server

# Check system resources
df -h
free -h
top

# Restart services
systemctl start postgresql redis-server
systemctl start iranian-legal-archive
systemctl start nginx
```

### **Data Recovery:**
```bash
# Restore from backup
sudo -u postgres psql -d iranian_legal_archive < /opt/backups/LATEST_BACKUP.sql

# Check data integrity
sudo -u postgres psql -d iranian_legal-archive -c "SELECT COUNT(*) FROM legal_documents;"
```

### **Security Incident:**
```bash
# Block suspicious IPs
ufw deny from SUSPICIOUS_IP

# Check access logs
tail -f /var/log/nginx/access.log | grep SUSPICIOUS_IP

# Review security logs
journalctl -u fail2ban -f
```

---

## 🎉 **DEPLOYMENT COMPLETE!**

Congratulations! Your Iranian Legal Archive System is now running in production.

### **Next Steps:**
1. **Test all functionality** thoroughly
2. **Configure monitoring alerts** for critical metrics
3. **Set up regular backups** and test recovery
4. **Monitor performance** and optimize as needed
5. **Train your team** on system administration
6. **Plan for scaling** as your user base grows

### **Remember:**
- Keep your deployment credentials secure
- Monitor system health regularly
- Update security patches promptly
- Test your backup and recovery procedures
- Document any custom configurations

---

**📧 For additional support or questions, please refer to the project documentation or contact the development team.**

---

*Last Updated: $(date)*
*Version: 2.0.0*
*System: Iranian Legal Archive System*