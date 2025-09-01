"""
Intelligent DNS Manager for Iranian Legal Archive System
Provides DoH (DNS over HTTPS) support with Iranian and international resolvers
"""

import logging
import random
import socket
from typing import List

try:
    import dns.resolver
    import dns.exception
    DNS_AVAILABLE = True
except ImportError:
    DNS_AVAILABLE = False
    logging.warning("dnspython not available, DNS features disabled")

try:
    from requests_doh import RequestsDNSResolver, DOHResolver
    DOH_AVAILABLE = True
except ImportError:
    DOH_AVAILABLE = False
    logging.warning("requests-doh not available, falling back to standard DNS")

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logging.warning("requests not available, DNS manager disabled")

logger = logging.getLogger(__name__)


class IntelligentDNSManager:
    """مدیریت هوشمند DNS با قابلیت تعویض خودکار"""
    
    def __init__(self):
        self.iranian_doh_servers = [
            "https://free.shecan.ir/dns-query",
            "https://dns.403.online/dns-query", 
            "https://dns.begzar.ir/dns-query",
            "https://dns1.server.ir/dns-query"
        ]
        
        self.international_doh_servers = [
            "https://cloudflare-dns.com/dns-query",
            "https://dns.google/dns-query",
            "https://dns.quad9.net/dns-query"
        ]
        
        self.public_dns_servers = [
            "8.8.8.8", "8.8.4.4",  # Google
            "1.1.1.1", "1.0.0.1",  # Cloudflare
            "9.9.9.9", "149.112.112.112",  # Quad9
            "185.55.226.26", "185.55.225.25"  # Shecan
        ]
        
        self.current_strategy = "hybrid"
        self.successful_servers = []
        self.failed_servers = []
        
        logger.info(f"DNS Manager initialized with {len(self.iranian_doh_servers + self.international_doh_servers)} DoH servers")

    def test_dns_server(self, dns_server: str, test_domain: str = "google.com") -> bool:
        """تست کارکرد DNS server"""
        if not DNS_AVAILABLE:
            return False
            
        try:
            resolver = dns.resolver.Resolver()
            resolver.nameservers = [dns_server]
            resolver.timeout = 3
            resolver.lifetime = 5
            
            answers = resolver.resolve(test_domain, 'A')
            return len(answers) > 0
        except:
            return False

    def get_best_dns_servers(self, max_test: int = 5) -> List[str]:
        """یافتن بهترین DNS serverها"""
        working_servers = []
        
        # تست DNS های عمومی
        for dns in self.public_dns_servers[:max_test]:
            if self.test_dns_server(dns):
                working_servers.append(dns)
                
        logger.info(f"Found {len(working_servers)} working DNS servers")
        return working_servers

    def setup_custom_dns_resolution(self, session) -> bool:
        """تنظیم DNS سفارشی برای session"""
        try:
            working_dns = self.get_best_dns_servers(3)
            if working_dns:
                # اگر امکان DoH وجود دارد
                if DOH_AVAILABLE and self.iranian_doh_servers:
                    try:
                        doh_resolver = DOHResolver(random.choice(self.iranian_doh_servers))
                        dns_resolver = RequestsDNSResolver(doh_resolver)
                        session.mount('http://', dns_resolver)
                        session.mount('https://', dns_resolver)
                        logger.info("DoH DNS resolver configured")
                        return True
                    except Exception as e:
                        logger.warning(f"DoH setup failed: {e}")
                
                # Fallback به DNS عادی
                if DNS_AVAILABLE:
                    original_getaddrinfo = socket.getaddrinfo
                    
                    def custom_getaddrinfo(host, port, *args, **kwargs):
                        for dns_server in working_dns:
                            try:
                                resolver = dns.resolver.Resolver()
                                resolver.nameservers = [dns_server]
                                answers = resolver.resolve(host, 'A')
                                if answers:
                                    ip = str(answers[0])
                                    return original_getaddrinfo(ip, port, *args, **kwargs)
                            except:
                                continue
                        return original_getaddrinfo(host, port, *args, **kwargs)
                    
                    socket.getaddrinfo = custom_getaddrinfo
                    logger.info("Custom DNS resolution configured")
                    return True
                
        except Exception as e:
            logger.error(f"DNS setup failed: {e}")
            
        return False

    def reset_dns_resolution(self):
        """بازنشانی DNS به حالت پیش‌فرض"""
        try:
            import socket
            if hasattr(socket, '_original_getaddrinfo'):
                socket.getaddrinfo = socket._original_getaddrinfo
                logger.info("DNS resolution reset to default")
        except Exception as e:
            logger.error(f"Failed to reset DNS: {e}")

    def get_status(self) -> dict:
        """دریافت وضعیت DNS manager"""
        return {
            "current_strategy": self.current_strategy,
            "doh_available": DOH_AVAILABLE,
            "dns_available": DNS_AVAILABLE,
            "iranian_doh_count": len(self.iranian_doh_servers),
            "international_doh_count": len(self.international_doh_servers),
            "public_dns_count": len(self.public_dns_servers),
            "successful_servers": len(self.successful_servers),
            "failed_servers": len(self.failed_servers)
        }