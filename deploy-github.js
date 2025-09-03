#!/usr/bin/env node

/**
 * GitHub Pages Deployment Script for Iranian Legal Archive
 * Handles build optimization and deployment configuration
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const REPO_URL = 'https://github.com/aminchedo/Aihoghoghi.git'
const BRANCH = 'gh-pages'

console.log('🚀 Starting GitHub Pages deployment for Iranian Legal Archive...')

try {
  // 1. Clean previous build
  console.log('🧹 Cleaning previous build...')
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' })
  }

  // 2. Install dependencies
  console.log('📦 Installing dependencies...')
  execSync('npm ci', { stdio: 'inherit' })

  // 3. Build for production
  console.log('🔨 Building for GitHub Pages...')
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      VITE_API_URL: 'https://iranian-legal-archive-backend.railway.app/api',
      VITE_WS_URL: 'wss://iranian-legal-archive-backend.railway.app/ws'
    }
  })

  // 4. Create GitHub Pages specific files
  console.log('📄 Creating GitHub Pages configuration...')
  
  // Create .nojekyll file
  writeFileSync(join('dist', '.nojekyll'), '')
  
  // Create CNAME file
  writeFileSync(join('dist', 'CNAME'), 'aihoghoghi.ir')
  
  // Copy 404.html for SPA routing
  if (existsSync('public/404.html')) {
    const content404 = readFileSync('public/404.html', 'utf8')
    writeFileSync(join('dist', '404.html'), content404)
  }

  // 5. Create robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://aminchedo.github.io/Aihoghoghi/sitemap.xml

# Iranian Legal Archive System
# سیستم آرشیو اسناد حقوقی ایران
`
  writeFileSync(join('dist', 'robots.txt'), robotsTxt)

  // 6. Create sitemap.xml
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aminchedo.github.io/Aihoghoghi/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://aminchedo.github.io/Aihoghoghi/#/dashboard</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aminchedo.github.io/Aihoghoghi/#/search</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aminchedo.github.io/Aihoghoghi/#/scraping</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://aminchedo.github.io/Aihoghoghi/#/ai-analysis</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`
  writeFileSync(join('dist', 'sitemap.xml'), sitemapXml)

  // 7. Update index.html with GitHub Pages optimizations
  console.log('🔧 Optimizing index.html for GitHub Pages...')
  let indexHtml = readFileSync(join('dist', 'index.html'), 'utf8')
  
  // Add GitHub Pages meta tags
  const githubPagesMeta = `
  <meta name="description" content="سیستم آرشیو اسناد حقوقی ایران - پلتفرم جامع اسکرپینگ و تحلیل قوانین اسلامی">
  <meta name="keywords" content="قوانین ایران، اسناد حقوقی، Persian BERT، تحلیل هوشمند، نفقه، طلاق">
  <meta name="author" content="Iranian Legal Archive Team">
  <meta property="og:title" content="سیستم آرشیو اسناد حقوقی ایران">
  <meta property="og:description" content="پلتفرم پیشرفته استخراج و تحلیل اسناد حقوقی با هوش مصنوعی">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://aminchedo.github.io/Aihoghoghi/">
  <link rel="canonical" href="https://aminchedo.github.io/Aihoghoghi/">
  `
  
  indexHtml = indexHtml.replace('</head>', githubPagesMeta + '</head>')
  writeFileSync(join('dist', 'index.html'), indexHtml)

  // 8. Deploy to GitHub Pages
  console.log('🚀 Deploying to GitHub Pages...')
  
  // Initialize git in dist folder
  execSync('git init', { cwd: 'dist', stdio: 'inherit' })
  execSync('git add .', { cwd: 'dist', stdio: 'inherit' })
  execSync('git commit -m "Deploy Iranian Legal Archive System v2.0"', { 
    cwd: 'dist', 
    stdio: 'inherit' 
  })
  
  // Push to GitHub Pages
  execSync(`git push -f ${REPO_URL} main:${BRANCH}`, { 
    cwd: 'dist', 
    stdio: 'inherit' 
  })

  console.log('✅ Successfully deployed to GitHub Pages!')
  console.log('🌐 URL: https://aminchedo.github.io/Aihoghoghi/')
  console.log('📊 Dashboard: https://aminchedo.github.io/Aihoghoghi/#/dashboard')
  console.log('🔍 Search: https://aminchedo.github.io/Aihoghoghi/#/search')
  console.log('🤖 AI Analysis: https://aminchedo.github.io/Aihoghoghi/#/ai-analysis')

} catch (error) {
  console.error('❌ Deployment failed:', error)
  process.exit(1)
}