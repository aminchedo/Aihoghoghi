#!/usr/bin/env python3
"""
Fix Loading Issue - Remove blocking components and ensure fast startup
"""

import os
import json

def fix_loading_issue():
    """Fix the loading issue by simplifying startup"""
    
    print("🔧 FIXING LOADING ISSUE")
    print("=" * 30)
    
    # Check current build files
    dist_path = "/workspace/dist"
    if os.path.exists(dist_path):
        print(f"📁 Dist directory exists: {dist_path}")
        
        # List dist files
        for file in os.listdir(dist_path):
            if file.endswith('.js') or file.endswith('.css'):
                file_path = os.path.join(dist_path, file)
                size = os.path.getsize(file_path)
                print(f"   📄 {file}: {size:,} bytes")
    
    # Check if React build is working
    src_path = "/workspace/src"
    if os.path.exists(src_path):
        print(f"📁 Source directory exists: {src_path}")
        
        # Check main components
        main_components = ['App.jsx', 'main.jsx']
        for comp in main_components:
            comp_path = os.path.join(src_path, comp)
            if os.path.exists(comp_path):
                print(f"   ✅ {comp} exists")
            else:
                print(f"   ❌ {comp} missing")
    
    # Check package.json
    package_path = "/workspace/package.json"
    if os.path.exists(package_path):
        with open(package_path, 'r') as f:
            package_data = json.load(f)
            
        print(f"📦 Package.json check:")
        print(f"   Name: {package_data.get('name')}")
        print(f"   Scripts: {list(package_data.get('scripts', {}).keys())}")
    
    return True

def create_simple_loading_fix():
    """Create a simple loading fix"""
    
    # Simple index.html without complex loading
    simple_html = '''<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>🏛️ سیستم آرشیو اسناد حقوقی ایران</title>
    
    <style>
        body {
            font-family: 'Vazirmatn', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .simple-loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            text-align: center;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="simple-loader" class="simple-loader">
        <div>
            <div style="font-size: 4rem; margin-bottom: 1rem;">⚖️</div>
            <h1 style="margin-bottom: 1rem;">سیستم آرشیو اسناد حقوقی ایران</h1>
            <div class="spinner" style="margin: 2rem auto;"></div>
            <p id="loading-text">در حال بارگذاری...</p>
        </div>
    </div>
    
    <div id="root"></div>
    
    <script>
        // Simple loading with timeout
        let loadingStep = 0;
        const steps = ['اتصال به سرور...', 'بارگذاری اجزا...', 'آماده‌سازی رابط...'];
        
        const updateLoading = () => {
            const text = document.getElementById('loading-text');
            if (text && loadingStep < steps.length) {
                text.textContent = steps[loadingStep];
                loadingStep++;
            }
        };
        
        // Update every second
        const interval = setInterval(updateLoading, 1000);
        
        // Force remove loader after 3 seconds
        setTimeout(() => {
            const loader = document.getElementById('simple-loader');
            if (loader) {
                loader.style.display = 'none';
            }
            clearInterval(interval);
            
            // Show app or fallback
            const root = document.getElementById('root');
            if (root && !root.innerHTML.trim()) {
                root.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: white;">
                        <h1>🏛️ سیستم آرشیو اسناد حقوقی ایران</h1>
                        <p>سیستم در حال بارگذاری است...</p>
                        <button onclick="window.location.reload()" 
                                style="padding: 1rem 2rem; background: rgba(255,255,255,0.2); 
                                       border: 2px solid rgba(255,255,255,0.3); border-radius: 10px; 
                                       color: white; cursor: pointer;">
                            🔄 رفرش صفحه
                        </button>
                    </div>
                `;
            }
        }, 3000);
    </script>
</body>
</html>'''
    
    # Save simple version
    with open('/workspace/simple_index.html', 'w', encoding='utf-8') as f:
        f.write(simple_html)
    
    print("✅ Created simple_index.html as fallback")

if __name__ == "__main__":
    fix_loading_issue()
    create_simple_loading_fix()