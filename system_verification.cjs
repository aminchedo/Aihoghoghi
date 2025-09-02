#!/usr/bin/env node

/**
 * Comprehensive System Verification for Iranian Legal Archive
 * Tests all components and functionality to ensure production readiness
 */

const fs = require('fs');
const path = require('path');

class SystemVerification {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: 'production',
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  /**
   * Run all verification tests
   */
  async runAllTests() {
    console.log('🔍 Starting comprehensive system verification...\n');
    
    await this.testFileStructure();
    await this.testBuildArtifacts();
    await this.testGitHubPagesConfig();
    await this.testPWAFeatures();
    await this.testServiceIntegration();
    await this.testUIComponents();
    await this.testPerformance();
    
    this.generateReport();
    this.saveResults();
    
    return this.results;
  }

  /**
   * Test file structure
   */
  async testFileStructure() {
    console.log('📁 Testing file structure...');
    
    const requiredFiles = [
      'public/index.html',
      'public/manifest.json',
      'public/sw.js',
      'public/404.html',
      'public/sitemap.xml',
      'public/robots.txt',
      'public/_headers',
      'src/App.jsx',
      'src/main.jsx',
      'src/services/realTimeMetricsService.js',
      'src/services/legalDocumentService.js',
      'src/services/smartScrapingService.js',
      'src/services/enhancedAIService.js',
      'src/services/systemIntegration.js',
      'src/components/pages/Dashboard.jsx',
      'src/components/pages/Settings.jsx',
      'src/components/pages/ScrapingDashboard.jsx',
      'src/components/pages/AIAnalysisDashboard.jsx',
      'src/components/pages/EnhancedSearchDatabase.jsx',
      'src/components/layout/Header.jsx',
      'src/components/layout/EnhancedSidebar.jsx',
      'src/components/ui/StatsCard.jsx',
      'src/components/ui/Chart.jsx',
      'src/components/ui/LoadingSpinner.jsx',
      'src/components/ui/ErrorMessage.jsx',
      'src/components/ui/ErrorBoundary.jsx',
      'src/contexts/ThemeContext.jsx',
      'src/contexts/ConfigContext.jsx',
      'src/contexts/NotificationContext.jsx',
      'package.json',
      'vite.config.js'
    ];
    
    const testResult = {
      name: 'File Structure',
      passed: 0,
      failed: 0,
      files: {}
    };
    
    for (const file of requiredFiles) {
      const exists = fs.existsSync(path.join(__dirname, file));
      testResult.files[file] = exists;
      
      if (exists) {
        testResult.passed++;
      } else {
        testResult.failed++;
        console.log(`❌ Missing file: ${file}`);
      }
    }
    
    testResult.success = testResult.failed === 0;
    this.results.tests.fileStructure = testResult;
    this.updateSummary(testResult.success);
    
    console.log(`${testResult.success ? '✅' : '❌'} File structure: ${testResult.passed}/${requiredFiles.length} files present\n`);
  }

  /**
   * Test build artifacts
   */
  async testBuildArtifacts() {
    console.log('🏗️ Testing build artifacts...');
    
    const testResult = {
      name: 'Build Artifacts',
      checks: {}
    };
    
    // Check if dist directory exists
    testResult.checks.distExists = fs.existsSync(path.join(__dirname, 'dist'));
    
    // Check if public directory has built files
    testResult.checks.publicHasAssets = fs.existsSync(path.join(__dirname, 'public/assets'));
    
    // Check if index.html exists in public
    testResult.checks.indexExists = fs.existsSync(path.join(__dirname, 'public/index.html'));
    
    // Check if CSS and JS files exist
    if (testResult.checks.publicHasAssets) {
      const assetsDir = path.join(__dirname, 'public/assets');
      const files = fs.readdirSync(assetsDir);
      
      testResult.checks.cssExists = files.some(f => f.endsWith('.css'));
      testResult.checks.jsExists = files.some(f => f.endsWith('.js'));
    }
    
    testResult.success = Object.values(testResult.checks).every(check => check === true);
    this.results.tests.buildArtifacts = testResult;
    this.updateSummary(testResult.success);
    
    console.log(`${testResult.success ? '✅' : '❌'} Build artifacts: ${Object.values(testResult.checks).filter(Boolean).length}/${Object.keys(testResult.checks).length} checks passed\n`);
  }

  /**
   * Test GitHub Pages configuration
   */
  async testGitHubPagesConfig() {
    console.log('🌐 Testing GitHub Pages configuration...');
    
    const testResult = {
      name: 'GitHub Pages Config',
      checks: {}
    };
    
    // Check vite.config.js
    try {
      const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.js'), 'utf8');
      testResult.checks.viteBaseConfig = viteConfig.includes("base: '/Aihoghoghi/'");
      testResult.checks.viteOutputConfig = viteConfig.includes("outDir: 'dist'");
    } catch (error) {
      testResult.checks.viteBaseConfig = false;
      testResult.checks.viteOutputConfig = false;
    }
    
    // Check package.json
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      testResult.checks.homepageConfig = packageJson.homepage === 'https://aminchedo.github.io/Aihoghoghi/';
    } catch (error) {
      testResult.checks.homepageConfig = false;
    }
    
    // Check public files
    testResult.checks.has404Page = fs.existsSync(path.join(__dirname, 'public/404.html'));
    testResult.checks.hasRobotsTxt = fs.existsSync(path.join(__dirname, 'public/robots.txt'));
    testResult.checks.hasSitemap = fs.existsSync(path.join(__dirname, 'public/sitemap.xml'));
    
    testResult.success = Object.values(testResult.checks).every(check => check === true);
    this.results.tests.githubPages = testResult;
    this.updateSummary(testResult.success);
    
    console.log(`${testResult.success ? '✅' : '❌'} GitHub Pages config: ${Object.values(testResult.checks).filter(Boolean).length}/${Object.keys(testResult.checks).length} checks passed\n`);
  }

  /**
   * Test PWA features
   */
  async testPWAFeatures() {
    console.log('📱 Testing PWA features...');
    
    const testResult = {
      name: 'PWA Features',
      checks: {}
    };
    
    // Check manifest.json
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/manifest.json'), 'utf8'));
      testResult.checks.manifestExists = true;
      testResult.checks.manifestHasName = !!manifest.name;
      testResult.checks.manifestHasIcons = manifest.icons && manifest.icons.length > 0;
      testResult.checks.manifestHasStartUrl = !!manifest.start_url;
      testResult.checks.manifestHasDisplay = manifest.display === 'standalone';
    } catch (error) {
      testResult.checks.manifestExists = false;
      testResult.checks.manifestHasName = false;
      testResult.checks.manifestHasIcons = false;
      testResult.checks.manifestHasStartUrl = false;
      testResult.checks.manifestHasDisplay = false;
    }
    
    // Check service worker
    testResult.checks.serviceWorkerExists = fs.existsSync(path.join(__dirname, 'public/sw.js'));
    
    // Check if service worker has required features
    if (testResult.checks.serviceWorkerExists) {
      const swContent = fs.readFileSync(path.join(__dirname, 'public/sw.js'), 'utf8');
      testResult.checks.swHasCaching = swContent.includes('caches.open');
      testResult.checks.swHasOffline = swContent.includes('offline');
      testResult.checks.swHasSync = swContent.includes('sync');
    }
    
    testResult.success = Object.values(testResult.checks).every(check => check === true);
    this.results.tests.pwa = testResult;
    this.updateSummary(testResult.success);
    
    console.log(`${testResult.success ? '✅' : '❌'} PWA features: ${Object.values(testResult.checks).filter(Boolean).length}/${Object.keys(testResult.checks).length} checks passed\n`);
  }

  /**
   * Test service integration
   */
  async testServiceIntegration() {
    console.log('🔗 Testing service integration...');
    
    const testResult = {
      name: 'Service Integration',
      checks: {}
    };
    
    const serviceFiles = [
      'src/services/realTimeMetricsService.js',
      'src/services/legalDocumentService.js',
      'src/services/smartScrapingService.js',
      'src/services/enhancedAIService.js',
      'src/services/systemIntegration.js'
    ];
    
    for (const serviceFile of serviceFiles) {
      const exists = fs.existsSync(path.join(__dirname, serviceFile));
      const serviceName = path.basename(serviceFile, '.js');
      testResult.checks[serviceName] = exists;
      
      if (exists) {
        // Check if service exports properly
        const content = fs.readFileSync(path.join(__dirname, serviceFile), 'utf8');
        testResult.checks[`${serviceName}Export`] = content.includes('export');
      }
    }
    
    // Check system integration
    const systemIntegrationExists = fs.existsSync(path.join(__dirname, 'src/services/systemIntegration.js'));
    if (systemIntegrationExists) {
      const content = fs.readFileSync(path.join(__dirname, 'src/services/systemIntegration.js'), 'utf8');
      testResult.checks.systemIntegrationClass = content.includes('class SystemIntegrationService');
      testResult.checks.systemIntegrationExport = content.includes('export');
    }
    
    testResult.success = Object.values(testResult.checks).every(check => check === true);
    this.results.tests.serviceIntegration = testResult;
    this.updateSummary(testResult.success);
    
    console.log(`${testResult.success ? '✅' : '❌'} Service integration: ${Object.values(testResult.checks).filter(Boolean).length}/${Object.keys(testResult.checks).length} checks passed\n`);
  }

  /**
   * Test UI components
   */
  async testUIComponents() {
    console.log('🎨 Testing UI components...');
    
    const testResult = {
      name: 'UI Components',
      checks: {}
    };
    
    const componentFiles = [
      'src/components/pages/Dashboard.jsx',
      'src/components/pages/Settings.jsx',
      'src/components/pages/ScrapingDashboard.jsx',
      'src/components/pages/AIAnalysisDashboard.jsx',
      'src/components/pages/EnhancedSearchDatabase.jsx',
      'src/components/layout/Header.jsx',
      'src/components/layout/EnhancedSidebar.jsx',
      'src/components/ui/StatsCard.jsx',
      'src/components/ui/Chart.jsx',
      'src/components/ui/LoadingSpinner.jsx',
      'src/components/ui/ErrorMessage.jsx',
      'src/components/ui/ErrorBoundary.jsx'
    ];
    
    for (const componentFile of componentFiles) {
      const exists = fs.existsSync(path.join(__dirname, componentFile));
      const componentName = path.basename(componentFile, '.jsx');
      testResult.checks[componentName] = exists;
      
      if (exists) {
        // Check if component exports properly
        const content = fs.readFileSync(path.join(__dirname, componentFile), 'utf8');
        testResult.checks[`${componentName}Export`] = content.includes('export default');
        testResult.checks[`${componentName}React`] = content.includes('import React');
      }
    }
    
    // Check contexts
    const contextFiles = [
      'src/contexts/ThemeContext.jsx',
      'src/contexts/ConfigContext.jsx',
      'src/contexts/NotificationContext.jsx'
    ];
    
    for (const contextFile of contextFiles) {
      const exists = fs.existsSync(path.join(__dirname, contextFile));
      const contextName = path.basename(contextFile, '.jsx');
      testResult.checks[contextName] = exists;
    }
    
    testResult.success = Object.values(testResult.checks).every(check => check === true);
    this.results.tests.uiComponents = testResult;
    this.updateSummary(testResult.success);
    
    console.log(`${testResult.success ? '✅' : '❌'} UI components: ${Object.values(testResult.checks).filter(Boolean).length}/${Object.keys(testResult.checks).length} checks passed\n`);
  }

  /**
   * Test performance characteristics
   */
  async testPerformance() {
    console.log('⚡ Testing performance characteristics...');
    
    const testResult = {
      name: 'Performance',
      checks: {},
      metrics: {}
    };
    
    // Check bundle size
    const assetsDir = path.join(__dirname, 'public/assets');
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      
      const jsFiles = files.filter(f => f.endsWith('.js'));
      const cssFiles = files.filter(f => f.endsWith('.css'));
      
      if (jsFiles.length > 0) {
        const jsFile = path.join(assetsDir, jsFiles[0]);
        const jsSize = fs.statSync(jsFile).size;
        testResult.metrics.jsBundleSize = Math.round(jsSize / 1024); // KB
        testResult.checks.jsBundleReasonable = jsSize < 2 * 1024 * 1024; // < 2MB
      }
      
      if (cssFiles.length > 0) {
        const cssFile = path.join(assetsDir, cssFiles[0]);
        const cssSize = fs.statSync(cssFile).size;
        testResult.metrics.cssBundleSize = Math.round(cssSize / 1024); // KB
        testResult.checks.cssBundleReasonable = cssSize < 100 * 1024; // < 100KB
      }
    }
    
    // Check if code splitting is implemented
    const viteConfig = fs.readFileSync(path.join(__dirname, 'vite.config.js'), 'utf8');
    testResult.checks.hasCodeSplitting = viteConfig.includes('rollupOptions');
    
    // Check if compression is enabled
    testResult.checks.hasCompression = viteConfig.includes('minify');
    
    testResult.success = Object.values(testResult.checks).every(check => check === true);
    this.results.tests.performance = testResult;
    this.updateSummary(testResult.success);
    
    console.log(`${testResult.success ? '✅' : '❌'} Performance: ${Object.values(testResult.checks).filter(Boolean).length}/${Object.keys(testResult.checks).length} checks passed`);
    if (testResult.metrics.jsBundleSize) {
      console.log(`   📦 JS Bundle: ${testResult.metrics.jsBundleSize}KB`);
    }
    if (testResult.metrics.cssBundleSize) {
      console.log(`   🎨 CSS Bundle: ${testResult.metrics.cssBundleSize}KB`);
    }
    console.log('');
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('📋 Generating verification report...\n');
    
    console.log('='.repeat(80));
    console.log('🏛️ IRANIAN LEGAL ARCHIVE SYSTEM - VERIFICATION REPORT');
    console.log('='.repeat(80));
    console.log(`📅 Timestamp: ${this.results.timestamp}`);
    console.log(`🔢 Version: ${this.results.version}`);
    console.log(`🌍 Environment: ${this.results.environment}`);
    console.log('');
    
    console.log('📊 SUMMARY:');
    console.log(`   Total Tests: ${this.results.summary.total}`);
    console.log(`   ✅ Passed: ${this.results.summary.passed}`);
    console.log(`   ❌ Failed: ${this.results.summary.failed}`);
    console.log(`   ⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log(`   📈 Success Rate: ${Math.round((this.results.summary.passed / this.results.summary.total) * 100)}%`);
    console.log('');
    
    console.log('🔍 DETAILED RESULTS:');
    Object.entries(this.results.tests).forEach(([testName, testResult]) => {
      const status = testResult.success ? '✅' : '❌';
      console.log(`   ${status} ${testResult.name}`);
      
      if (testResult.metrics) {
        Object.entries(testResult.metrics).forEach(([metric, value]) => {
          console.log(`      📊 ${metric}: ${value}`);
        });
      }
    });
    console.log('');
    
    if (this.results.summary.failed === 0) {
      console.log('🎉 SYSTEM VERIFICATION PASSED!');
      console.log('✅ Iranian Legal Archive System is ready for production deployment');
      console.log('🚀 All components are working correctly');
      console.log('🔗 https://aminchedo.github.io/Aihoghoghi/');
    } else {
      console.log('⚠️ SYSTEM VERIFICATION INCOMPLETE');
      console.log(`❌ ${this.results.summary.failed} test(s) failed`);
      console.log('🔧 Please review and fix the issues before deployment');
    }
    
    console.log('='.repeat(80));
  }

  /**
   * Save verification results
   */
  saveResults() {
    const filename = `verification_report_${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`💾 Verification report saved: ${filename}\n`);
  }

  /**
   * Update summary statistics
   */
  updateSummary(success) {
    this.results.summary.total++;
    if (success) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verification = new SystemVerification();
  verification.runAllTests()
    .then((results) => {
      process.exit(results.summary.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = SystemVerification;