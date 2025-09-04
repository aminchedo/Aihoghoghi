# 🚀 **COMPLETE DEPLOYMENT GUIDE**
## Iranian Legal Archive System

---

## 📋 **TABLE OF CONTENTS**

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Step 1: Domain Setup](#step-1-domain-setup)
4. [Step 2: Railway Deployment](#step-2-railway-deployment)
5. [Step 3: Monitoring Setup](#step-3-monitoring-setup)
6. [Step 4: Testing & Validation](#step-4-testing--validation)
7. [Step 5: Custom Domain & SSL](#step-5-custom-domain--ssl)
8. [Maintenance & Updates](#maintenance--updates)
9. [Troubleshooting](#troubleshooting)
10. [Success Criteria](#success-criteria)

---

## 🚀 **QUICK START**

```bash
# 1. Make scripts executable
chmod +x free-domain-setup.sh
chmod +x deploy-railway.sh
chmod +x setup-monitoring.sh
chmod +x test-endpoints.sh

# 2. Setup domain and environment
./free-domain-setup.sh

# 3. Deploy to Railway
./deploy-railway.sh

# 4. Setup monitoring
./setup-monitoring.sh

# 5. Test deployment
./test-endpoints.sh
```

**Total Time**: 30-45 minutes  
**Cost**: $0 (Free tier services)

---

## 🔧 **PREREQUISITES**

### **Required Accounts**
- ✅ GitHub account (for repository access)
- ✅ Railway account (free tier)
- ✅ HuggingFace account (for AI models)
- ✅ Email account (for SSL certificates)

### **System Requirements**
- ✅ Linux/macOS/Windows with bash
- ✅ Docker installed and running
- ✅ Node.js 18+ and npm
- ✅ Git installed

### **Knowledge Requirements**
- ✅ Basic command line usage
- ✅ Understanding of environment variables
- ✅ Basic Docker concepts

---

## 🌐 **STEP 1: DOMAIN SETUP**

### **Option A: Free Domain (Recommended)**
```bash
# Run the domain setup script
./free-domain-setup.sh

# Choose option 5 (Railway subdomain)
# This gives you: your-app-name.railway.app
```

### **Option B: Custom Domain**
1. **Freenom** (.tk, .ml, .ga, .cf, .gq)
   - Visit: https://freenom.com
   - Search for desired domain
   - Register for free (12 months)
   - Configure DNS after deployment

2. **GitHub Pages**
   - Automatic: `username.github.io/Aihoghoghi`
   - Custom domain: Add CNAME in repository settings

### **What You'll Get**
- Environment file (`.env.production`)
- Railway deployment script
- Endpoint testing script
- Domain configuration instructions

---

## 🚂 **STEP 2: RAILWAY DEPLOYMENT**

### **2.1 Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **2.2 Configure Environment**
```bash
# Edit .env.production with your values
nano .env.production

# Required values:
RAILWAY_TOKEN=your_token_here
HUGGINGFACE_TOKEN=your_token_here
JWT_SECRET=random_secret_string
ENCRYPTION_KEY=random_encryption_key
```

### **2.3 Deploy Application**
```bash
# Run deployment script
./deploy-railway.sh

# This will:
# - Login to Railway
# - Create project
# - Deploy application
# - Get deployment URL
```

### **2.4 Verify Deployment**
```bash
# Check deployment status
railway status

# View logs
railway logs

# Get deployment URL
railway status --json | jq -r '.deployment.url'
```

---

## 📊 **STEP 3: MONITORING SETUP**

### **3.1 Start Monitoring Services**
```bash
# Setup monitoring infrastructure
./setup-monitoring.sh

# Start monitoring services
cd monitoring
./start-monitoring.sh
```

### **3.2 Access Monitoring Dashboards**
- **Grafana**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

### **3.3 Import Dashboard**
1. Open Grafana
2. Go to Dashboards → Import
3. Upload: `monitoring/grafana/dashboards/iranian-legal-dashboard.json`
4. Select Prometheus as data source

### **3.4 Configure Alerts**
- Alerts are pre-configured in Prometheus
- Email notifications via SMTP
- Customize thresholds in `monitoring/prometheus/rules/alerts.yml`

---

## 🧪 **STEP 4: TESTING & VALIDATION**

### **4.1 Run Endpoint Tests**
```bash
# Test all endpoints
./test-endpoints.sh

# This tests:
# ✅ Health endpoint
# ✅ AI model status
# ✅ Database connectivity
# ✅ Persian text processing
# ✅ WebSocket connections
```

### **4.2 Manual Testing Checklist**
- [ ] Frontend loads correctly
- [ ] Persian text displays properly (RTL)
- [ ] AI analysis works with Persian text
- [ ] Document upload/processing
- [ ] Search functionality
- [ ] Real-time updates via WebSocket

### **4.3 Performance Testing**
```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s "$DEPLOYMENT_URL/api/v1/system/health"

# Test AI model performance
curl -X POST "$DEPLOYMENT_URL/api/v1/ai/analyze" \
  -H "Content-Type: application/json" \
  -d '{"text": "قانون اساسی جمهوری اسلامی ایران", "language": "fa"}'
```

---

## 🔒 **STEP 5: CUSTOM DOMAIN & SSL**

### **5.1 Railway Custom Domain**
1. Go to Railway dashboard
2. Select your project
3. Go to Settings → Domains
4. Add your custom domain
5. Railway automatically handles SSL

### **5.2 DNS Configuration**
```bash
# For Freenom domains, add these records:
Type    | Name | Value
--------|------|------
CNAME   | @    | your-app-name.railway.app
CNAME   | www  | your-app-name.railway.app
```

### **5.3 SSL Verification**
- Railway automatically provisions SSL certificates
- Certificates auto-renew every 90 days
- Check SSL status: `./ssl-status.sh`

---

## 🔄 **MAINTENANCE & UPDATES**

### **Daily Operations**
```bash
# Check system health
./monitoring/health-check.sh

# View logs
railway logs

# Monitor performance
# Open Grafana dashboard
```

### **Weekly Maintenance**
```bash
# Update dependencies
npm update
railway up

# Backup database
./backup-database.sh

# Check SSL certificate status
./ssl-status.sh
```

### **Monthly Tasks**
- Review monitoring alerts
- Update AI models
- Performance optimization
- Security updates

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **1. Deployment Fails**
```bash
# Check logs
railway logs

# Verify environment variables
cat .env.production

# Restart deployment
railway up
```

#### **2. AI Model Not Loading**
```bash
# Check HuggingFace token
echo $HUGGINGFACE_TOKEN

# Verify model path
ls -la models/

# Check model service logs
railway logs --service ai-model
```

#### **3. Database Connection Issues**
```bash
# Check database URL
echo $DATABASE_URL

# Test connection
railway run -- npx sequelize-cli db:migrate:status

# Restart database service
railway service restart postgres
```

#### **4. Persian Text Issues**
```bash
# Check RTL support
curl "$DEPLOYMENT_URL/api/v1/system/rtl-test"

# Verify font loading
curl "$DEPLOYMENT_URL/api/v1/system/fonts"

# Check content-type headers
curl -I "$DEPLOYMENT_URL/api/v1/ai/analyze"
```

---

## ✅ **SUCCESS CRITERIA**

### **Technical Requirements**
- [ ] Application accessible via domain
- [ ] HTTPS/SSL working correctly
- [ ] All API endpoints responding
- [ ] Persian text rendering properly
- [ ] AI analysis functional
- [ ] Real-time updates working
- [ ] Monitoring dashboards active

### **Performance Requirements**
- [ ] Response time < 2 seconds
- [ ] Uptime > 99.5%
- [ ] AI model load time < 30 seconds
- [ ] Database queries < 500ms
- [ ] File upload < 10MB support

### **Security Requirements**
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Input validation working
- [ ] SQL injection protection
- [ ] XSS protection enabled

---

## 📞 **SUPPORT & RESOURCES**

### **Documentation**
- [Railway Documentation](https://docs.railway.app/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

### **Community Support**
- [Railway Discord](https://discord.gg/railway)
- [GitHub Issues](https://github.com/aminchedo/Aihoghoghi/issues)
- [Stack Overflow](https://stackoverflow.com/)

### **Emergency Contacts**
- **Critical Issues**: Create GitHub issue with `[URGENT]` tag
- **Security Issues**: Private GitHub issue
- **Performance Issues**: Check monitoring dashboards first

---

## 🎯 **NEXT STEPS AFTER DEPLOYMENT**

1. **Immediate (Day 1)**
   - Test all endpoints
   - Verify monitoring
   - Set up alerts

2. **Week 1**
   - Load testing
   - Performance optimization
   - User acceptance testing

3. **Month 1**
   - Analytics setup
   - Backup automation
   - Scaling preparation

4. **Ongoing**
   - Regular updates
   - Performance monitoring
   - User feedback integration

---

## 🏆 **CONGRATULATIONS!**

You've successfully deployed the **Iranian Legal Archive System** with:
- ✅ Production-ready infrastructure
- ✅ Comprehensive monitoring
- ✅ Automated alerting
- ✅ SSL security
- ✅ Performance optimization
- ✅ Persian language support

Your system is now ready to serve users and process Iranian legal documents with AI-powered analysis!

---

**Need Help?** Check the troubleshooting section or create a GitHub issue.  
**Want to Contribute?** Fork the repository and submit pull requests.  
**Questions?** Review the documentation or ask in the community.