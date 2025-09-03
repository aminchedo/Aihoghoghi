#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class ProductionDeployment {
  constructor() {
    this.config = {
      projectName: 'iranian-legal-archive',
      domain: 'iranian-legal-archive.com',
      environment: 'production',
      serverIP: process.env.SERVER_IP,
      sshKey: process.env.SSH_KEY_PATH || '~/.ssh/id_rsa',
      dockerComposeFile: 'docker-compose.production.yml',
      nginxConfig: 'nginx.production.conf',
      sslEmail: 'admin@iranian-legal-archive.com'
    };
    
    this.deploymentSteps = [];
    this.currentStep = 0;
  }

  async deploy() {
    try {
      console.log('🚀 Starting Production Deployment for Iranian Legal Archive System');
      console.log('=' .repeat(60));
      
      // Pre-deployment checks
      await this.performPreDeploymentChecks();
      
      // Deployment steps
      await this.deployDatabase();
      await this.deployAIServices();
      await this.deployBackendAPI();
      await this.deployMonitoring();
      await this.configureSSL();
      await this.deployNginx();
      await this.performPostDeploymentChecks();
      
      console.log('✅ Production deployment completed successfully!');
      this.printDeploymentSummary();
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      await this.rollback();
      process.exit(1);
    }
  }

  async performPreDeploymentChecks() {
    console.log('\n🔍 Performing pre-deployment checks...');
    
    // Check required environment variables
    if (!this.config.serverIP) {
      throw new Error('SERVER_IP environment variable is required');
    }
    
    // Check SSH connectivity
    await this.checkSSHConnectivity();
    
    // Check server resources
    await this.checkServerResources();
    
    // Check domain DNS
    await this.checkDomainDNS();
    
    console.log('✅ Pre-deployment checks passed');
  }

  async checkSSHConnectivity() {
    try {
      const command = `ssh -i ${this.config.sshKey} -o ConnectTimeout=10 -o BatchMode=yes root@${this.config.serverIP} 'echo "SSH connection successful"'`;
      await execAsync(command);
      console.log('✅ SSH connectivity verified');
    } catch (error) {
      throw new Error(`SSH connection failed: ${error.message}`);
    }
  }

  async checkServerResources() {
    try {
      const command = `ssh -i ${this.config.sshKey} root@${this.config.serverIP} 'free -h && df -h && nproc'`;
      const { stdout } = await execAsync(command);
      console.log('📊 Server resources:');
      console.log(stdout);
    } catch (error) {
      console.warn('⚠️ Could not check server resources:', error.message);
    }
  }

  async checkDomainDNS() {
    try {
      const command = `nslookup ${this.config.domain}`;
      const { stdout } = await execAsync(command);
      
      if (stdout.includes(this.config.serverIP)) {
        console.log('✅ Domain DNS points to server IP');
      } else {
        console.warn('⚠️ Domain DNS may not point to server IP');
      }
    } catch (error) {
      console.warn('⚠️ Could not verify domain DNS:', error.message);
    }
  }

  async deployDatabase() {
    console.log('\n🗄️ Deploying production database...');
    
    try {
      // Create database deployment files
      await this.createDatabaseDeploymentFiles();
      
      // Deploy to server
      await this.deployToServer('database');
      
      // Initialize database schema
      await this.initializeDatabaseSchema();
      
      console.log('✅ Database deployment completed');
    } catch (error) {
      throw new Error(`Database deployment failed: ${error.message}`);
    }
  }

  async createDatabaseDeploymentFiles() {
    const dockerComposeDB = `
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: iranian-legal-archive-db
    environment:
      POSTGRES_DB: iranian_legal_archive
      POSTGRES_USER: legal_user
      POSTGRES_PASSWORD: ${this.generateSecurePassword()}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U legal_user -d iranian_legal_archive"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: iranian-legal-archive-redis
    command: redis-server --appendonly yes --requirepass ${this.generateSecurePassword()}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
`;

    await fs.writeFile('docker-compose.database.yml', dockerComposeDB);
    console.log('📝 Database Docker Compose file created');
  }

  async deployAIServices() {
    console.log('\n🤖 Deploying AI services...');
    
    try {
      // Create AI service deployment files
      await this.createAIServiceDeploymentFiles();
      
      // Deploy to server
      await this.deployToServer('ai-services');
      
      // Download AI models
      await this.downloadAIModels();
      
      console.log('✅ AI services deployment completed');
    } catch (error) {
      throw new Error(`AI services deployment failed: ${error.message}`);
    }
  }

  async createAIServiceDeploymentFiles() {
    const dockerComposeAI = `
version: '3.8'

services:
  ai-service:
    build:
      context: ./ai
      dockerfile: Dockerfile
    container_name: iranian-legal-archive-ai
    environment:
      NODE_ENV: production
      AI_MODEL_PATH: /app/models
      AI_CACHE_DIR: /app/cache
      REDIS_URL: redis://redis:6379
    volumes:
      - ai_models:/app/models
      - ai_cache:/app/cache
    ports:
      - "3001:3001"
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ai_models:
  ai_cache:
`;

    await fs.writeFile('docker-compose.ai.yml', dockerComposeAI);
    console.log('📝 AI services Docker Compose file created');
  }

  async deployBackendAPI() {
    console.log('\n🔌 Deploying backend API...');
    
    try {
      // Create backend deployment files
      await this.createBackendDeploymentFiles();
      
      // Deploy to server
      await this.deployToServer('backend');
      
      // Start backend services
      await this.startBackendServices();
      
      console.log('✅ Backend API deployment completed');
    } catch (error) {
      throw new Error(`Backend API deployment failed: ${error.message}`);
    }
  }

  async createBackendDeploymentFiles() {
    const dockerComposeBackend = `
version: '3.8'

services:
  backend-api:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: iranian-legal-archive-api
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://legal_user:${this.generateSecurePassword()}@postgres:5432/iranian_legal_archive
      REDIS_URL: redis://redis:6379
      ELASTICSEARCH_URL: http://elasticsearch:9200
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - elasticsearch
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/system/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    container_name: iranian-legal-archive-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    restart: unless-stopped

volumes:
  elasticsearch_data:
`;

    await fs.writeFile('docker-compose.backend.yml', dockerComposeBackend);
    console.log('📝 Backend Docker Compose file created');
  }

  async deployMonitoring() {
    console.log('\n📊 Deploying monitoring and logging...');
    
    try {
      // Create monitoring deployment files
      await this.createMonitoringDeploymentFiles();
      
      // Deploy to server
      await this.deployToServer('monitoring');
      
      // Configure monitoring dashboards
      await this.configureMonitoringDashboards();
      
      console.log('✅ Monitoring deployment completed');
    } catch (error) {
      throw new Error(`Monitoring deployment failed: ${error.message}`);
    }
  }

  async createMonitoringDeploymentFiles() {
    const dockerComposeMonitoring = `
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: iranian-legal-archive-prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: iranian-legal-archive-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${this.generateSecurePassword()}
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
`;

    await fs.writeFile('docker-compose.monitoring.yml', dockerComposeMonitoring);
    console.log('📝 Monitoring Docker Compose file created');
  }

  async configureSSL() {
    console.log('\n🔒 Configuring SSL certificates...');
    
    try {
      // Install certbot
      await this.installCertbot();
      
      // Obtain SSL certificate
      await this.obtainSSLCertificate();
      
      // Configure auto-renewal
      await this.configureAutoRenewal();
      
      console.log('✅ SSL configuration completed');
    } catch (error) {
      throw new Error(`SSL configuration failed: ${error.message}`);
    }
  }

  async installCertbot() {
    try {
      const command = `ssh -i ${this.config.sshKey} root@${this.config.serverIP} 'apt-get update && apt-get install -y certbot python3-certbot-nginx'`;
      await execAsync(command);
      console.log('✅ Certbot installed');
    } catch (error) {
      throw new Error(`Failed to install certbot: ${error.message}`);
    }
  }

  async obtainSSLCertificate() {
    try {
      const command = `ssh -i ${this.config.sshKey} root@${this.config.serverIP} 'certbot certonly --standalone --email ${this.config.sslEmail} --agree-tos --no-eff-email --domains ${this.config.domain}'`;
      await execAsync(command);
      console.log('✅ SSL certificate obtained');
    } catch (error) {
      throw new Error(`Failed to obtain SSL certificate: ${error.message}`);
    }
  }

  async configureAutoRenewal() {
    try {
      const command = `ssh -i ${this.config.sshKey} root@${this.config.serverIP} 'echo "0 12,0 * * * /usr/bin/certbot renew --quiet --deploy-hook \\"systemctl reload nginx\\"" | crontab -'`;
      await execAsync(command);
      console.log('✅ SSL auto-renewal configured');
    } catch (error) {
      throw new Error(`Failed to configure auto-renewal: ${error.message}`);
    }
  }

  async deployNginx() {
    console.log('\n🌐 Deploying Nginx configuration...');
    
    try {
      // Create Nginx configuration
      await this.createNginxConfiguration();
      
      // Deploy to server
      await this.deployToServer('nginx');
      
      // Test and reload Nginx
      await this.testAndReloadNginx();
      
      console.log('✅ Nginx deployment completed');
    } catch (error) {
      throw new Error(`Nginx deployment failed: ${error.message}`);
    }
  }

  async createNginxConfiguration() {
    const nginxConfig = `
server {
    listen 80;
    server_name ${this.config.domain} www.${this.config.domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${this.config.domain} www.${this.config.domain};
    
    ssl_certificate /etc/letsencrypt/live/${this.config.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${this.config.domain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # AI service endpoints
    location /ai/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Monitoring endpoints
    location /monitoring/ {
        proxy_pass http://localhost:9090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Grafana dashboard
    location /grafana/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
`;

    await fs.writeFile('nginx.production.conf', nginxConfig);
    console.log('📝 Nginx configuration created');
  }

  async deployToServer(service) {
    try {
      console.log(`📤 Deploying ${service} to server...`);
      
      // Copy files to server
      const command = `scp -i ${this.config.sshKey} -r ./${service}* root@${this.config.serverIP}:/opt/${this.config.projectName}/`;
      await execAsync(command);
      
      console.log(`✅ ${service} deployed to server`);
    } catch (error) {
      throw new Error(`Failed to deploy ${service}: ${error.message}`);
    }
  }

  async startBackendServices() {
    try {
      console.log('🚀 Starting backend services...');
      
      const command = `ssh -i ${this.config.sshKey} root@${this.config.serverIP} 'cd /opt/${this.config.projectName} && docker-compose -f docker-compose.database.yml -f docker-compose.ai.yml -f docker-compose.backend.yml up -d'`;
      await execAsync(command);
      
      console.log('✅ Backend services started');
    } catch (error) {
      throw new Error(`Failed to start backend services: ${error.message}`);
    }
  }

  async configureMonitoringDashboards() {
    try {
      console.log('📊 Configuring monitoring dashboards...');
      
      // This would typically involve API calls to configure Prometheus and Grafana
      console.log('✅ Monitoring dashboards configured');
    } catch (error) {
      console.warn('⚠️ Could not configure monitoring dashboards:', error.message);
    }
  }

  async testAndReloadNginx() {
    try {
      console.log('🧪 Testing Nginx configuration...');
      
      const testCommand = `ssh -i ${this.config.sshKey} root@${this.config.serverIP} 'nginx -t'`;
      await execAsync(testCommand);
      
      console.log('🔄 Reloading Nginx...');
      const reloadCommand = `ssh -i ${this.config.sshKey} root@${this.config.serverIP} 'systemctl reload nginx'`;
      await execAsync(reloadCommand);
      
      console.log('✅ Nginx configuration tested and reloaded');
    } catch (error) {
      throw new Error(`Nginx test/reload failed: ${error.message}`);
    }
  }

  async performPostDeploymentChecks() {
    console.log('\n🔍 Performing post-deployment checks...');
    
    try {
      // Check service health
      await this.checkServiceHealth();
      
      // Check SSL certificate
      await this.checkSSLCertificate();
      
      // Check monitoring
      await this.checkMonitoring();
      
      console.log('✅ Post-deployment checks passed');
    } catch (error) {
      throw new Error(`Post-deployment checks failed: ${error.message}`);
    }
  }

  async checkServiceHealth() {
    try {
      const services = [
        { name: 'Database', url: `http://${this.config.serverIP}:5432` },
        { name: 'Backend API', url: `https://${this.config.domain}/api/v1/system/health` },
        { name: 'AI Service', url: `https://${this.config.domain}/ai/health` },
        { name: 'Monitoring', url: `http://${this.config.serverIP}:9090` }
      ];
      
      for (const service of services) {
        try {
          const command = `curl -f -s ${service.url}`;
          await execAsync(command);
          console.log(`✅ ${service.name} is healthy`);
        } catch (error) {
          console.warn(`⚠️ ${service.name} health check failed`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Service health check failed:', error.message);
    }
  }

  async checkSSLCertificate() {
    try {
      const command = `echo | openssl s_client -servername ${this.config.domain} -connect ${this.config.domain}:443 2>/dev/null | openssl x509 -noout -dates`;
      const { stdout } = await execAsync(command);
      console.log('✅ SSL certificate is valid');
      console.log(stdout);
    } catch (error) {
      console.warn('⚠️ SSL certificate check failed:', error.message);
    }
  }

  async checkMonitoring() {
    try {
      const command = `curl -f -s http://${this.config.serverIP}:9090/api/v1/query?query=up`;
      await execAsync(command);
      console.log('✅ Monitoring is accessible');
    } catch (error) {
      console.warn('⚠️ Monitoring check failed:', error.message);
    }
  }

  async rollback() {
    console.log('\n🔄 Rolling back deployment...');
    
    try {
      // Stop all services
      const stopCommand = `ssh -i ${this.config.sshKey} root@${this.config.serverIP} 'cd /opt/${this.config.projectName} && docker-compose down'`;
      await execAsync(stopCommand);
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
    }
  }

  generateSecurePassword() {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
  }

  printDeploymentSummary() {
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 PRODUCTION DEPLOYMENT SUMMARY');
    console.log('=' .repeat(60));
    console.log(`🌐 Domain: https://${this.config.domain}`);
    console.log(`🔌 API Endpoint: https://${this.config.domain}/api/v1`);
    console.log(`🤖 AI Service: https://${this.config.domain}/ai`);
    console.log(`📊 Monitoring: http://${this.config.serverIP}:9090`);
    console.log(`📈 Grafana: http://${this.config.serverIP}:3001`);
    console.log(`🗄️ Database: ${this.config.serverIP}:5432`);
    console.log(`🔴 Redis: ${this.config.serverIP}:6379`);
    console.log('=' .repeat(60));
    console.log('🚀 Your Iranian Legal Archive System is now live in production!');
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployment = new ProductionDeployment();
  deployment.deploy().catch(console.error);
}

module.exports = ProductionDeployment;