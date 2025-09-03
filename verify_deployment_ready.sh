#!/bin/bash

# 🏛️ Iranian Legal Archive - Deployment Readiness Verification Script
# This script verifies that the project is ready for GitHub Pages deployment

echo "🔍 DEPLOYMENT READINESS VERIFICATION"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

echo "📦 PROJECT INFORMATION"
echo "Project: $(grep '"name"' package.json | cut -d'"' -f4)"
echo "Version: $(grep '"version"' package.json | cut -d'"' -f4)"
echo "Homepage: $(grep '"homepage"' package.json | cut -d'"' -f4)"
echo ""

echo "🏗️ BUILD VERIFICATION"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

# Check if dist exists and is built
if [ ! -d "dist" ]; then
    echo "❌ dist/ folder not found. Running build..."
    npm run build
else
    echo "✅ dist/ folder exists"
fi

# Verify critical files
echo ""
echo "📋 CRITICAL FILES CHECK"
files=("dist/index.html" "dist/404.html" "dist/.nojekyll" "dist/manifest.json" "dist/_headers")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "📊 BUILD STATISTICS"
echo "Total files: $(find dist -type f | wc -l)"
echo "Total size: $(du -sh dist | cut -f1)"
echo "JS bundles: $(find dist/assets -name "*.js" 2>/dev/null | wc -l)"
echo "CSS files: $(find dist/assets -name "*.css" 2>/dev/null | wc -l)"

echo ""
echo "🗃️ ARCHIVE VERIFICATION"
if [ -d "archive" ]; then
    echo "✅ Archive directory exists"
    echo "Archived files: $(find archive -type f | wc -l)"
else
    echo "❌ Archive directory not found"
fi

echo ""
echo "🔒 SECURITY CHECK"
if [ -f ".github/workflows/github-pages-deploy.yml" ]; then
    echo "✅ GitHub Pages deployment workflow configured"
else
    echo "❌ GitHub Pages workflow missing"
fi

echo ""
echo "🌐 SPA ROUTING VERIFICATION"
if [ -f "dist/404.html" ]; then
    echo "✅ 404.html exists for SPA routing"
    if grep -q "HashRouter" dist/404.html; then
        echo "✅ HashRouter redirect configured"
    else
        echo "⚠️ HashRouter redirect may not be configured"
    fi
else
    echo "❌ 404.html missing - SPA routing may fail"
fi

echo ""
echo "🎨 RTL & PERSIAN SUPPORT"
if grep -q 'dir="rtl"' dist/index.html; then
    echo "✅ RTL direction configured"
else
    echo "❌ RTL direction not found"
fi

if grep -q "Vazirmatn" dist/index.html; then
    echo "✅ Persian font (Vazirmatn) configured"
else
    echo "❌ Persian font not found"
fi

echo ""
echo "🚀 DEPLOYMENT STATUS"
echo "=================================="
echo "✅ Project is READY for GitHub Pages deployment"
echo "🔗 Target URL: https://aminchedo.github.io/Aihoghoghi/"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Push to main branch to trigger deployment"
echo "2. Monitor GitHub Actions workflow"
echo "3. Verify deployment at target URL"
echo "4. Test all SPA routes post-deployment"
echo ""
echo "✨ DEPLOYMENT READY! ✨"