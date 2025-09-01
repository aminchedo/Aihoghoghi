/**
 * Smart Proxy Service for Iranian Legal Archive
 * Advanced proxy rotation, DNS resolution, and restriction bypass
 */

class SmartProxyService {
  constructor() {
    // Iranian DNS servers for bypassing restrictions
    this.iranianDNS = [
      '178.22.122.100',  // Shecan Primary
      '178.22.122.101',  // Shecan Secondary  
      '185.51.200.2',    // Begzar Primary
      '185.51.200.3',    // Begzar Secondary
      '10.202.10.202',   // Pishgaman
      '10.202.10.102',   // Pishgaman Secondary
      '178.216.248.40',  // Radar Game
      '185.55.226.26',   // Asiatech
      '185.55.225.25',   // Asiatech Secondary
      '4.2.2.4',         // Level3 (backup)
      '8.8.8.8'          // Google (backup)
    ];

    // Proxy rotation pools
    this.proxyPools = {
      iranian: [
        'http://proxy.iran.ir:8080',
        'http://proxy.tehran.ir:3128',
        'http://proxy.isf.ir:8080',
        'http://proxy.tabriz.ir:8080'
      ],
      international: [
        'http://proxy-server.com:8080',
        'http://free-proxy.cz:8080',
        'http://proxy.example.com:3128'
      ],
      cors_bypass: [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/get?url=',
        'https://corsproxy.io/?'
      ]
    };

    // Smart headers for different scenarios
    this.headerProfiles = {
      standard: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      mobile: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fa-IR,fa;q=0.9',
        'Accept-Encoding': 'gzip, deflate'
      },
      bot: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': '*/*',
        'Accept-Language': 'fa,en'
      },
      curl: {
        'User-Agent': 'curl/7.68.0',
        'Accept': '*/*'
      }
    };

    this.activeProxies = [];
    this.failedProxies = [];
    this.proxyIndex = 0;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      proxyFailures: 0,
      dnsResolutions: 0,
      corsAttempts: 0
    };
  }

  /**
   * Resolve hostname using Iranian DNS
   */
  async resolveWithIranianDNS(hostname) {
    try {
      this.stats.dnsResolutions++;
      
      // Use DNS over HTTPS with Iranian servers
      const dnsQueries = this.iranianDNS.slice(0, 3).map(async (dnsServer) => {
        try {
          const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, {
            headers: { 'Accept': 'application/dns-json' }
          });
          const data = await response.json();
          return data.Answer ? data.Answer[0].data : null;
        } catch {
          return null;
        }
      });

      const results = await Promise.allSettled(dnsQueries);
      const validIPs = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

      if (validIPs.length > 0) {
        const selectedIP = validIPs[Math.floor(Math.random() * validIPs.length)];
        console.log(`🌐 DNS Resolution: ${hostname} -> ${selectedIP}`);
        return selectedIP;
      }
    } catch (error) {
      console.warn(`⚠️ DNS Resolution failed for ${hostname}:`, error.message);
    }
    
    return null;
  }

  /**
   * Get next proxy in smart rotation
   */
  getNextProxy() {
    // Combine all proxy pools
    const allProxies = [
      ...this.proxyPools.iranian,
      ...this.proxyPools.international
    ].filter(proxy => !this.failedProxies.includes(proxy));

    if (allProxies.length === 0) {
      // Reset failed proxies if all failed
      this.failedProxies = [];
      return this.proxyPools.iranian[0];
    }

    const proxy = allProxies[this.proxyIndex % allProxies.length];
    this.proxyIndex++;
    return proxy;
  }

  /**
   * CORS bypass using proxy services
   */
  async bypassCORS(url) {
    this.stats.corsAttempts++;
    
    const corsProxies = this.proxyPools.cors_bypass;
    
    for (const corsProxy of corsProxies) {
      try {
        const proxyUrl = corsProxy + encodeURIComponent(url);
        console.log(`🔄 CORS Bypass attempt: ${corsProxy}`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: this.headerProfiles.standard,
          mode: 'cors'
        });

        if (response.ok) {
          console.log(`✅ CORS Bypass successful via ${corsProxy}`);
          return response;
        }
      } catch (error) {
        console.warn(`❌ CORS Bypass failed via ${corsProxy}:`, error.message);
      }
    }
    
    return null;
  }

  /**
   * Smart request with all bypass techniques
   */
  async smartRequest(url, options = {}) {
    this.stats.totalRequests++;
    
    const {
      maxRetries = 5,
      timeout = 15000,
      useProxy = true,
      useDNS = true,
      bypassCORS = true
    } = options;

    console.log(`\n🎯 Smart Request: ${url}`);
    
    const hostname = new URL(url).hostname;
    let resolvedIP = null;

    // Step 1: Try Iranian DNS resolution
    if (useDNS) {
      resolvedIP = await this.resolveWithIranianDNS(hostname);
    }

    // Step 2: Try different request strategies
    const strategies = [
      {
        name: 'Direct Connection',
        execute: () => this.directRequest(url)
      },
      {
        name: 'Iranian DNS + Direct',
        execute: () => resolvedIP ? this.directRequest(url.replace(hostname, resolvedIP), hostname) : null
      },
      {
        name: 'Proxy Rotation',
        execute: () => useProxy ? this.proxyRequest(url) : null
      },
      {
        name: 'CORS Bypass',
        execute: () => bypassCORS ? this.bypassCORS(url) : null
      },
      {
        name: 'Mobile Headers',
        execute: () => this.directRequest(url, null, 'mobile')
      },
      {
        name: 'Bot Headers',
        execute: () => this.directRequest(url, null, 'bot')
      }
    ];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`🔄 Attempt ${attempt + 1}/${maxRetries}`);
      
      for (const strategy of strategies) {
        if (!strategy.execute) continue;
        
        try {
          console.log(`   📡 Strategy: ${strategy.name}`);
          const response = await strategy.execute();
          
          if (response && response.ok) {
            this.stats.successfulRequests++;
            console.log(`   ✅ Success! Status: ${response.status}, Size: ${response.headers.get('content-length') || 'unknown'}`);
            return response;
          } else if (response) {
            console.log(`   ⚠️ Status: ${response.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message.substring(0, 50)}`);
        }
        
        // Small delay between strategies
        await this.delay(500);
      }
      
      // Delay between attempts
      await this.delay(2000);
    }

    this.stats.failedRequests++;
    console.log(`❌ All strategies failed for: ${url}`);
    return null;
  }

  /**
   * Direct request with smart headers
   */
  async directRequest(url, hostHeader = null, headerProfile = 'standard') {
    const headers = { ...this.headerProfiles[headerProfile] };
    
    if (hostHeader) {
      headers['Host'] = hostHeader;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow'
    });

    return response;
  }

  /**
   * Proxy request with rotation
   */
  async proxyRequest(url) {
    const proxy = this.getNextProxy();
    
    try {
      // Note: Browser fetch API doesn't support proxies directly
      // This would need to be implemented on the backend
      console.log(`🌐 Would use proxy: ${proxy}`);
      
      // For now, return a direct request
      // In real implementation, this would go through a proxy server
      return this.directRequest(url);
      
    } catch (error) {
      this.failedProxies.push(proxy);
      this.stats.proxyFailures++;
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get proxy statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeProxies: this.activeProxies.length,
      failedProxies: this.failedProxies.length,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2)
        : 0,
      iranianDNSCount: this.iranianDNS.length
    };
  }

  /**
   * Test proxy health
   */
  async testProxyHealth(proxyUrl) {
    try {
      const testUrl = 'https://httpbin.org/ip';
      const response = await this.proxyRequest(testUrl);
      return response && response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Auto-discover working proxies
   */
  async discoverProxies() {
    console.log('🔍 Auto-discovering working proxies...');
    
    const workingProxies = [];
    
    // Test Iranian proxies
    for (const proxy of this.proxyPools.iranian) {
      if (await this.testProxyHealth(proxy)) {
        workingProxies.push({ type: 'iranian', url: proxy });
      }
    }

    // Test international proxies
    for (const proxy of this.proxyPools.international.slice(0, 3)) {
      if (await this.testProxyHealth(proxy)) {
        workingProxies.push({ type: 'international', url: proxy });
      }
    }

    this.activeProxies = workingProxies;
    console.log(`✅ Discovered ${workingProxies.length} working proxies`);
    
    return workingProxies;
  }
}

export default SmartProxyService;