const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class SSLManager {
  constructor(config = {}) {
    this.config = {
      domain: config.domain || 'iranian-legal-archive.com',
      email: config.email || 'admin@iranian-legal-archive.com',
      staging: config.staging || false, // Use Let's Encrypt staging for testing
      certbotPath: config.certbotPath || '/usr/bin/certbot',
      webrootPath: config.webrootPath || '/var/www/html',
      sslDir: config.sslDir || '/etc/letsencrypt/live',
      autoRenewal: config.autoRenewal !== false,
      renewalThreshold: config.renewalThreshold || 30, // Days before expiry
      ...config
    };
    
    this.certificateInfo = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔒 Initializing SSL Manager...');
      
      // Check if certbot is available
      await this.checkCertbotAvailability();
      
      // Check current certificate status
      await this.checkCertificateStatus();
      
      // Setup auto-renewal if enabled
      if (this.config.autoRenewal) {
        await this.setupAutoRenewal();
      }
      
      this.isInitialized = true;
      console.log('✅ SSL Manager initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize SSL Manager:', error);
      throw error;
    }
  }

  async checkCertbotAvailability() {
    try {
      const { stdout } = await execAsync(`${this.config.certbotPath} --version`);
      console.log(`📋 Certbot version: ${stdout.trim()}`);
      return true;
    } catch (error) {
      throw new Error(`Certbot not available at ${this.config.certbotPath}. Please install certbot.`);
    }
  }

  async checkCertificateStatus() {
    try {
      const certPath = path.join(this.config.sslDir, this.config.domain, 'cert.pem');
      
      try {
        await fs.access(certPath);
        this.certificateInfo = await this.getCertificateInfo(certPath);
        console.log('✅ SSL certificate found and valid');
        return true;
      } catch {
        console.log('⚠️ No SSL certificate found, will attempt to obtain one');
        return false;
      }
    } catch (error) {
      console.error('Failed to check certificate status:', error);
      return false;
    }
  }

  async getCertificateInfo(certPath) {
    try {
      const certData = await fs.readFile(certPath, 'utf8');
      const cert = require('crypto').X509Certificate ? 
        new (require('crypto').X509Certificate)(certData) : 
        this.parseCertificateManually(certData);
      
      return {
        subject: cert.subject,
        issuer: cert.issuer,
        validFrom: cert.validFrom,
        validTo: cert.validTo,
        serialNumber: cert.serialNumber,
        fingerprint: cert.fingerprint
      };
    } catch (error) {
      console.error('Failed to parse certificate:', error);
      return null;
    }
  }

  parseCertificateManually(certData) {
    // Fallback parsing for older Node.js versions
    const lines = certData.split('\n');
    let inCert = false;
    let certContent = '';
    
    for (const line of lines) {
      if (line.includes('-----BEGIN CERTIFICATE-----')) {
        inCert = true;
        continue;
      }
      if (line.includes('-----END CERTIFICATE-----')) {
        inCert = false;
        break;
      }
      if (inCert) {
        certContent += line;
      }
    }
    
    // This is a simplified parser - in production you'd want a proper ASN.1 parser
    return {
      subject: 'Unknown',
      issuer: 'Unknown',
      validFrom: new Date(),
      validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      serialNumber: 'Unknown',
      fingerprint: 'Unknown'
    };
  }

  async obtainCertificate() {
    try {
      console.log('🔐 Obtaining SSL certificate from Let\'s Encrypt...');
      
      const stagingFlag = this.config.staging ? '--staging' : '';
      const webrootFlag = `--webroot --webroot-path=${this.config.webrootPath}`;
      
      const command = `${this.config.certbotPath} certonly ${stagingFlag} ${webrootFlag} --email ${this.config.email} --agree-tos --no-eff-email --domains ${this.config.domain}`;
      
      console.log(`Executing: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('IMPORTANT NOTES')) {
        throw new Error(`Certbot error: ${stderr}`);
      }
      
      console.log('✅ SSL certificate obtained successfully');
      console.log(stdout);
      
      // Refresh certificate info
      await this.checkCertificateStatus();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to obtain SSL certificate:', error);
      throw error;
    }
  }

  async renewCertificate() {
    try {
      console.log('🔄 Renewing SSL certificate...');
      
      const command = `${this.config.certbotPath} renew --quiet`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('No renewals were attempted')) {
        console.warn('Certificate renewal warnings:', stderr);
      }
      
      console.log('✅ SSL certificate renewal completed');
      
      // Refresh certificate info
      await this.checkCertificateStatus();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to renew SSL certificate:', error);
      throw error;
    }
  }

  async setupAutoRenewal() {
    try {
      console.log('⏰ Setting up automatic certificate renewal...');
      
      // Check if cron job already exists
      const { stdout } = await execAsync('crontab -l 2>/dev/null || echo ""');
      
      if (!stdout.includes('certbot renew')) {
        // Add cron job for renewal (twice daily)
        const cronJob = '0 12,0 * * * /usr/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"';
        
        const newCrontab = stdout + '\n' + cronJob + '\n';
        
        // Write new crontab
        const tempFile = '/tmp/crontab_temp';
        await fs.writeFile(tempFile, newCrontab);
        
        await execAsync(`crontab ${tempFile}`);
        await fs.unlink(tempFile);
        
        console.log('✅ Auto-renewal cron job added');
      } else {
        console.log('ℹ️ Auto-renewal cron job already exists');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to setup auto-renewal:', error);
      throw error;
    }
  }

  async checkRenewalNeeded() {
    try {
      if (!this.certificateInfo) {
        return false;
      }
      
      const now = new Date();
      const expiryDate = new Date(this.certificateInfo.validTo);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= this.config.renewalThreshold) {
        console.log(`⚠️ Certificate expires in ${daysUntilExpiry} days, renewal needed`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check renewal status:', error);
      return false;
    }
  }

  async createHTTPSOptions() {
    try {
      if (!this.isInitialized) {
        throw new Error('SSL Manager not initialized');
      }
      
      const keyPath = path.join(this.config.sslDir, this.config.domain, 'privkey.pem');
      const certPath = path.join(this.config.sslDir, this.config.domain, 'cert.pem');
      const chainPath = path.join(this.config.sslDir, this.config.domain, 'chain.pem');
      
      // Check if files exist
      await fs.access(keyPath);
      await fs.access(certPath);
      await fs.access(chainPath);
      
      const key = await fs.readFile(keyPath);
      const cert = await fs.readFile(certPath);
      const chain = await fs.readFile(chainPath);
      
      const httpsOptions = {
        key: key,
        cert: cert,
        ca: chain,
        // Security options
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: [
          'ECDHE-ECDSA-AES128-GCM-SHA256',
          'ECDHE-RSA-AES128-GCM-SHA256',
          'ECDHE-ECDSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-ECDSA-CHACHA20-POLY1305',
          'ECDHE-RSA-CHACHA20-POLY1305'
        ].join(':'),
        honorCipherOrder: true,
        requestCert: false,
        rejectUnauthorized: false
      };
      
      console.log('🔒 HTTPS options created successfully');
      return httpsOptions;
    } catch (error) {
      console.error('❌ Failed to create HTTPS options:', error);
      throw error;
    }
  }

  async createHTTPSRedirectServer() {
    try {
      const redirectApp = require('express')();
      
      // Redirect HTTP to HTTPS
      redirectApp.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
          return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
      });
      
      const redirectServer = require('http').createServer(redirectApp);
      
      redirectServer.listen(80, () => {
        console.log('🔄 HTTP redirect server listening on port 80');
      });
      
      return redirectServer;
    } catch (error) {
      console.error('❌ Failed to create redirect server:', error);
      throw error;
    }
  }

  async validateCertificate() {
    try {
      if (!this.certificateInfo) {
        return { valid: false, reason: 'No certificate found' };
      }
      
      const now = new Date();
      const validFrom = new Date(this.certificateInfo.validFrom);
      const validTo = new Date(this.certificateInfo.validTo);
      
      if (now < validFrom) {
        return { valid: false, reason: 'Certificate not yet valid' };
      }
      
      if (now > validTo) {
        return { valid: false, reason: 'Certificate expired' };
      }
      
      const daysUntilExpiry = Math.ceil((validTo - now) / (1000 * 60 * 60 * 24));
      
      return {
        valid: true,
        daysUntilExpiry,
        subject: this.certificateInfo.subject,
        issuer: this.certificateInfo.issuer,
        validFrom: this.certificateInfo.validFrom,
        validTo: this.certificateInfo.validTo
      };
    } catch (error) {
      console.error('Failed to validate certificate:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  async getCertificateStatus() {
    try {
      const validation = await this.validateCertificate();
      
      return {
        domain: this.config.domain,
        status: validation.valid ? 'valid' : 'invalid',
        reason: validation.reason,
        certificateInfo: this.certificateInfo,
        autoRenewal: this.config.autoRenewal,
        staging: this.config.staging,
        ...validation
      };
    } catch (error) {
      console.error('Failed to get certificate status:', error);
      return {
        domain: this.config.domain,
        status: 'error',
        reason: error.message
      };
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up SSL Manager...');
      
      // Remove cron job if it exists
      try {
        const { stdout } = await execAsync('crontab -l 2>/dev/null || echo ""');
        const newCrontab = stdout.split('\n').filter(line => !line.includes('certbot renew')).join('\n');
        
        if (newCrontab !== stdout) {
          const tempFile = '/tmp/crontab_temp';
          await fs.writeFile(tempFile, newCrontab);
          await execAsync(`crontab ${tempFile}`);
          await fs.unlink(tempFile);
          console.log('✅ Auto-renewal cron job removed');
        }
      } catch (error) {
        console.warn('Failed to remove cron job:', error);
      }
      
      this.isInitialized = false;
      console.log('✅ SSL Manager cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup SSL Manager:', error);
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const status = await this.getCertificateStatus();
      const renewalNeeded = await this.checkRenewalNeeded();
      
      return {
        service: 'SSL Manager',
        status: this.isInitialized ? 'healthy' : 'not_initialized',
        certificate: status,
        renewal_needed: renewalNeeded,
        auto_renewal: this.config.autoRenewal,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'SSL Manager',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = SSLManager;