#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * Tests all critical functionality of the Iranian Legal Archive System
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ProductionVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'TESTING',
      tests: [],
      summary: {}
    };
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${status}: ${message}`);
    this.results.tests.push({
      timestamp,
      message,
      status
    });
  }

  async verifyFileStructure() {
    this.log('🔍 Verifying file structure...', 'TEST');
    
    const criticalFiles = [
      'dist/index.html',
      'dist/404.html', 
      'dist/.nojekyll',
      'dist/manifest.json',
      'dist/_headers',
      'package.json',
      'vite.config.js',
      '.github/workflows/deploy-fixed.yml'
    ];

    let passed = 0;
    let failed = 0;

    for (const file of criticalFiles) {
      const fullPath = join(__dirname, file);
      if (existsSync(fullPath)) {
        this.log(`✅ ${file} exists`, 'PASS');
        passed++;
      } else {
        this.log(`❌ ${file} missing`, 'FAIL');
        failed++;
      }
    }

    return { passed, failed, total: criticalFiles.length };
  }

  async verifyViteConfig() {
    this.log('🔧 Verifying Vite configuration...', 'TEST');
    
    try {
      const configPath = join(__dirname, 'vite.config.js');
      const configContent = readFileSync(configPath, 'utf8');
      
      const checks = [
        { pattern: "base: '/Aihoghoghi/'", description: 'Base path configured' },
        { pattern: 'outDir: \'dist\'', description: 'Output directory configured' },
        { pattern: 'copyPublicDir: true', description: 'Public directory copying enabled' }
      ];

      let passed = 0;
      for (const check of checks) {
        if (configContent.includes(check.pattern)) {
          this.log(`✅ ${check.description}`, 'PASS');
          passed++;
        } else {
          this.log(`❌ ${check.description}`, 'FAIL');
        }
      }

      return { passed, failed: checks.length - passed, total: checks.length };
    } catch (error) {
      this.log(`❌ Failed to read vite.config.js: ${error.message}`, 'FAIL');
      return { passed: 0, failed: 1, total: 1 };
    }
  }

  async verifyPackageJson() {
    this.log('📦 Verifying package.json configuration...', 'TEST');
    
    try {
      const packagePath = join(__dirname, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      
      const checks = [
        { key: 'homepage', expected: 'https://aminchedo.github.io/Aihoghoghi/', description: 'Homepage URL configured' },
        { key: 'name', expected: 'iranian-legal-archive-ui', description: 'Package name correct' },
        { key: 'version', expected: '2.0.0', description: 'Version correct' }
      ];

      let passed = 0;
      for (const check of checks) {
        if (packageJson[check.key] === check.expected) {
          this.log(`✅ ${check.description}`, 'PASS');
          passed++;
        } else {
          this.log(`❌ ${check.description}: expected "${check.expected}", got "${packageJson[check.key]}"`, 'FAIL');
        }
      }

      return { passed, failed: checks.length - passed, total: checks.length };
    } catch (error) {
      this.log(`❌ Failed to read package.json: ${error.message}`, 'FAIL');
      return { passed: 0, failed: 1, total: 1 };
    }
  }

  async verify404Html() {
    this.log('🔄 Verifying 404.html SPA routing...', 'TEST');
    
    try {
      const htmlPath = join(__dirname, 'dist/404.html');
      const htmlContent = readFileSync(htmlPath, 'utf8');
      
      const checks = [
        { pattern: 'lang="fa"', description: 'Persian language configured' },
        { pattern: 'dir="rtl"', description: 'RTL direction configured' },
        { pattern: 'Vazirmatn', description: 'Persian font configured' },
        { pattern: '/Aihoghoghi/', description: 'Base path redirect configured' }
      ];

      let passed = 0;
      for (const check of checks) {
        if (htmlContent.includes(check.pattern)) {
          this.log(`✅ ${check.description}`, 'PASS');
          passed++;
        } else {
          this.log(`❌ ${check.description}`, 'FAIL');
        }
      }

      return { passed, failed: checks.length - passed, total: checks.length };
    } catch (error) {
      this.log(`❌ Failed to read 404.html: ${error.message}`, 'FAIL');
      return { passed: 0, failed: 1, total: 1 };
    }
  }

  async verifyAssetSizes() {
    this.log('📊 Verifying asset sizes for performance...', 'TEST');
    
    const limits = {
      'dist/index.html': 5000, // 5KB limit
      'dist/404.html': 5000,   // 5KB limit
      'dist/manifest.json': 2000 // 2KB limit
    };

    let passed = 0;
    let failed = 0;

    for (const [file, limit] of Object.entries(limits)) {
      const fullPath = join(__dirname, file);
      if (existsSync(fullPath)) {
        const stats = readFileSync(fullPath);
        const size = stats.length;
        
        if (size <= limit) {
          this.log(`✅ ${file}: ${size} bytes (within ${limit} limit)`, 'PASS');
          passed++;
        } else {
          this.log(`❌ ${file}: ${size} bytes (exceeds ${limit} limit)`, 'FAIL');
          failed++;
        }
      } else {
        this.log(`❌ ${file}: File not found`, 'FAIL');
        failed++;
      }
    }

    return { passed, failed, total: Object.keys(limits).length };
  }

  async runAllTests() {
    this.log('🚀 Starting production verification tests...', 'START');
    
    const testResults = [
      await this.verifyFileStructure(),
      await this.verifyViteConfig(),
      await this.verifyPackageJson(),
      await this.verify404Html(),
      await this.verifyAssetSizes()
    ];

    const totalPassed = testResults.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = testResults.reduce((sum, result) => sum + result.failed, 0);
    const totalTests = testResults.reduce((sum, result) => sum + result.total, 0);

    this.results.summary = {
      total_tests: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      success_rate: ((totalPassed / totalTests) * 100).toFixed(1) + '%'
    };

    if (totalFailed === 0) {
      this.results.status = 'PRODUCTION_READY';
      this.log('🎉 ALL TESTS PASSED - PRODUCTION READY!', 'SUCCESS');
    } else {
      this.results.status = 'ISSUES_FOUND';
      this.log(`⚠️ ${totalFailed} tests failed - needs attention`, 'WARNING');
    }

    this.log(`📊 Final Results: ${totalPassed}/${totalTests} tests passed (${this.results.summary.success_rate})`, 'SUMMARY');
    
    return this.results;
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new ProductionVerifier();
  const results = await verifier.runAllTests();
  
  console.log('\n' + '='.repeat(50));
  console.log('PRODUCTION VERIFICATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Status: ${results.status}`);
  console.log(`Tests: ${results.summary.passed}/${results.summary.total} passed`);
  console.log(`Success Rate: ${results.summary.success_rate}`);
  console.log('='.repeat(50));
  
  process.exit(results.summary.failed === 0 ? 0 : 1);
}

export default ProductionVerifier;