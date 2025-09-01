#!/usr/bin/env python3
"""
Real Web Scraping Example - Scraping actual data from real websites
This script demonstrates real web scraping capabilities with actual data.
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import json
from urllib.parse import urljoin, urlparse
import sys

class RealWebScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Linux; x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def scrape_quotes_toscrape(self):
        """Scrape real quotes from quotes.toscrape.com"""
        print("🔍 Scraping real quotes from quotes.toscrape.com...")
        
        quotes_data = []
        base_url = "http://quotes.toscrape.com"
        page = 1
        
        while True:
            url = f"{base_url}/page/{page}/"
            print(f"📄 Fetching page {page}...")
            
            try:
                response = self.session.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                quotes = soup.find_all('div', class_='quote')
                
                if not quotes:
                    print("✅ No more quotes found. Scraping complete!")
                    break
                
                for quote in quotes:
                    text = quote.find('span', class_='text').get_text().strip()
                    author = quote.find('small', class_='author').get_text().strip()
                    tags = [tag.get_text() for tag in quote.find_all('a', class_='tag')]
                    
                    quotes_data.append({
                        'quote': text,
                        'author': author,
                        'tags': ', '.join(tags),
                        'page': page
                    })
                
                print(f"✅ Found {len(quotes)} quotes on page {page}")
                page += 1
                time.sleep(1)  # Be respectful to the server
                
                # Limit to first 3 pages for demo
                if page > 3:
                    break
                    
            except requests.RequestException as e:
                print(f"❌ Error fetching page {page}: {e}")
                break
        
        return quotes_data
    
    def scrape_httpbin_info(self):
        """Scrape real HTTP information from httpbin.org"""
        print("\n🌐 Scraping real HTTP info from httpbin.org...")
        
        endpoints = [
            ('IP Address', 'https://httpbin.org/ip'),
            ('User Agent', 'https://httpbin.org/user-agent'),
            ('Headers', 'https://httpbin.org/headers')
        ]
        
        results = {}
        
        for name, url in endpoints:
            try:
                print(f"📡 Fetching {name}...")
                response = self.session.get(url)
                response.raise_for_status()
                data = response.json()
                results[name] = data
                print(f"✅ Got {name}: {json.dumps(data, indent=2)[:100]}...")
                time.sleep(0.5)
            except Exception as e:
                print(f"❌ Error getting {name}: {e}")
                results[name] = {"error": str(e)}
        
        return results
    
    def scrape_github_trending(self):
        """Scrape real trending repositories from GitHub"""
        print("\n⭐ Scraping real trending repos from GitHub...")
        
        url = "https://github.com/trending"
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            repos = soup.find_all('article', class_='Box-row')
            
            trending_repos = []
            
            for repo in repos[:5]:  # Get first 5 trending repos
                try:
                    # Extract repo name and author
                    title_element = repo.find('h2', class_='h3')
                    if title_element:
                        repo_link = title_element.find('a')
                        if repo_link:
                            repo_name = repo_link.get_text().strip().replace('\n', '').replace(' ', '')
                            repo_url = urljoin("https://github.com", repo_link.get('href'))
                    
                    # Extract description
                    desc_element = repo.find('p', class_='col-9')
                    description = desc_element.get_text().strip() if desc_element else "No description"
                    
                    # Extract language
                    lang_element = repo.find('span', {'itemprop': 'programmingLanguage'})
                    language = lang_element.get_text().strip() if lang_element else "Unknown"
                    
                    # Extract stars today
                    stars_element = repo.find('span', class_='d-inline-block')
                    stars_today = "N/A"
                    if stars_element:
                        stars_text = stars_element.get_text().strip()
                        if "stars today" in stars_text or "star today" in stars_text:
                            stars_today = stars_text
                    
                    trending_repos.append({
                        'name': repo_name,
                        'url': repo_url,
                        'description': description[:100] + "..." if len(description) > 100 else description,
                        'language': language,
                        'stars_today': stars_today
                    })
                    
                except Exception as e:
                    print(f"⚠️ Error parsing repo: {e}")
                    continue
            
            print(f"✅ Found {len(trending_repos)} trending repositories")
            return trending_repos
            
        except Exception as e:
            print(f"❌ Error scraping GitHub trending: {e}")
            return []

def main():
    print("🚀 Starting REAL Web Scraping Test")
    print("=" * 50)
    
    scraper = RealWebScraper()
    
    # Test 1: Scrape quotes
    quotes = scraper.scrape_quotes_toscrape()
    print(f"\n📊 RESULTS: Scraped {len(quotes)} real quotes")
    if quotes:
        print("Sample quotes:")
        for i, quote in enumerate(quotes[:3], 1):
            print(f"{i}. \"{quote['quote'][:80]}...\" - {quote['author']}")
    
    # Test 2: Scrape HTTP info
    http_info = scraper.scrape_httpbin_info()
    print(f"\n📊 RESULTS: Got HTTP information from {len(http_info)} endpoints")
    
    # Test 3: Scrape GitHub trending
    trending = scraper.scrape_github_trending()
    print(f"\n📊 RESULTS: Found {len(trending)} trending repositories")
    if trending:
        print("Top trending repos:")
        for i, repo in enumerate(trending[:3], 1):
            print(f"{i}. {repo['name']} ({repo['language']}) - {repo['description']}")
    
    # Save results to files
    if quotes:
        df_quotes = pd.DataFrame(quotes)
        df_quotes.to_csv('/workspace/scraped_quotes.csv', index=False)
        print(f"\n💾 Saved {len(quotes)} quotes to scraped_quotes.csv")
    
    if trending:
        df_trending = pd.DataFrame(trending)
        df_trending.to_csv('/workspace/scraped_trending.csv', index=False)
        print(f"💾 Saved {len(trending)} trending repos to scraped_trending.csv")
    
    # Save HTTP info as JSON
    if http_info:
        with open('/workspace/scraped_http_info.json', 'w') as f:
            json.dump(http_info, f, indent=2)
        print(f"💾 Saved HTTP info to scraped_http_info.json")
    
    print("\n🎉 Real web scraping test completed successfully!")
    print("All data is REAL and fetched from actual websites.")

if __name__ == "__main__":
    main()