#!/bin/bash

echo "🚀 Testing Iranian Legal Archive System Deployments"
echo "=================================================="

# Test Frontend (GitHub Pages)
echo ""
echo "📱 Testing Frontend Routes:"
echo "--------------------------"

FRONTEND_BASE="https://aminchedo.github.io/Aihoghoghi"

# Test main page
echo -n "Main page: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_BASE/")
if [ "$STATUS" = "200" ]; then
    echo "✅ $STATUS"
else
    echo "❌ $STATUS"
fi

# Test dashboard route
echo -n "Dashboard: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_BASE/dashboard")
if [ "$STATUS" = "200" ]; then
    echo "✅ $STATUS"
else
    echo "❌ $STATUS (SPA routing may need GitHub Pages deployment)"
fi

# Test search route
echo -n "Search: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_BASE/search")
if [ "$STATUS" = "200" ]; then
    echo "✅ $STATUS"
else
    echo "❌ $STATUS (SPA routing may need GitHub Pages deployment)"
fi

# Test Backend (Vercel)
echo ""
echo "🔧 Testing Backend Endpoints:"
echo "-----------------------------"

BACKEND_BASE="https://aihoghoghi-j68z.vercel.app"

# Test health endpoint
echo -n "Health endpoint: "
HEALTH_RESPONSE=$(curl -s "$BACKEND_BASE/api/health" 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✅ Working - Response: $HEALTH_RESPONSE"
else
    echo "❌ Failed - Response: $HEALTH_RESPONSE"
fi

# Test AI analyze endpoint
echo -n "AI Analyze endpoint: "
AI_RESPONSE=$(curl -s -X POST "$BACKEND_BASE/api/ai-analyze" \
    -H "Content-Type: application/json" \
    -d '{"text":"این یک متن قانونی است"}' 2>&1)
if echo "$AI_RESPONSE" | grep -q "category"; then
    echo "✅ Working - Response: $AI_RESPONSE"
else
    echo "❌ Failed - Response: $AI_RESPONSE"
fi

echo ""
echo "🔗 Deployment URLs:"
echo "Frontend: $FRONTEND_BASE"
echo "Backend Health: $BACKEND_BASE/api/health"
echo "Backend AI: $BACKEND_BASE/api/ai-analyze"

echo ""
echo "📊 Summary:"
echo "Frontend main page: $(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_BASE/")"
echo "Backend status: $(if curl -s "$BACKEND_BASE/api/health" | grep -q "ok"; then echo "✅ Working"; else echo "❌ Not deployed"; fi)"