#!/bin/bash

# REAL FILE SYSTEM VERIFICATION
# Verify actual project structure and build artifacts

echo "📁 REAL FILE SYSTEM VERIFICATION"
echo "================================"
echo "Checking actual project structure and build artifacts"
echo "================================"

timestamp=$(date +"%Y%m%d_%H%M%S")
results_file="FILE_SYSTEM_CHECK_${timestamp}.json"

# Start JSON results
echo "{" > $results_file
echo "  \"test_timestamp\": \"$(date -Iseconds)\"," >> $results_file
echo "  \"file_checks\": [" >> $results_file

# Key files to check
declare -a files_to_check=(
    "package.json"
    "package-lock.json"
    "vite.config.js"
    "tailwind.config.js"
    "src/main.jsx"
    "src/App.jsx"
    "public/index.html"
    "public/404.html"
    "public/manifest.json"
    "web_ui/index.html"
    "web_ui/script.js"
    "web_ui/styles.css"
    "vercel.json"
    "requirements.txt"
)

first_check=true
files_present=0
total_files=${#files_to_check[@]}
total_size=0

echo "📋 FILE EXISTENCE CHECK:"
echo "========================"

for file in "${files_to_check[@]}"; do
    if [ "$first_check" = false ]; then
        echo "    ," >> $results_file
    fi
    first_check=false
    
    echo "    {" >> $results_file
    echo "      \"file_path\": \"$file\"," >> $results_file
    
    if [ -f "$file" ]; then
        size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        human_size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}' || echo "0B")
        modified=$(stat -c %y "$file" 2>/dev/null || echo "unknown")
        
        echo "      \"exists\": true," >> $results_file
        echo "      \"size_bytes\": $size," >> $results_file
        echo "      \"size_human\": \"$human_size\"," >> $results_file
        echo "      \"modified\": \"$modified\"" >> $results_file
        
        echo "✅ $file ($human_size)"
        files_present=$((files_present + 1))
        total_size=$((total_size + size))
    else
        echo "      \"exists\": false," >> $results_file
        echo "      \"size_bytes\": 0," >> $results_file
        echo "      \"size_human\": \"0B\"," >> $results_file
        echo "      \"modified\": \"\"" >> $results_file
        
        echo "❌ $file (MISSING)"
    fi
    
    echo "    }" >> $results_file
done

echo ""
echo "📁 DIRECTORY STRUCTURE CHECK:"
echo "============================="

# Check key directories
declare -a directories=(
    "src"
    "src/components"
    "src/hooks" 
    "src/services"
    "src/utils"
    "public"
    "public/assets"
    "web_ui"
    "node_modules"
    "dist"
)

echo "  ]," >> $results_file
echo "  \"directory_checks\": [" >> $results_file

first_dir=true
dirs_present=0

for dir in "${directories[@]}"; do
    if [ "$first_dir" = false ]; then
        echo "    ," >> $results_file
    fi
    first_dir=false
    
    echo "    {" >> $results_file
    echo "      \"directory_path\": \"$dir\"," >> $results_file
    
    if [ -d "$dir" ]; then
        file_count=$(find "$dir" -type f 2>/dev/null | wc -l)
        dir_size=$(du -sh "$dir" 2>/dev/null | cut -f1 || echo "0B")
        
        echo "      \"exists\": true," >> $results_file
        echo "      \"file_count\": $file_count," >> $results_file
        echo "      \"size\": \"$dir_size\"" >> $results_file
        
        echo "✅ $dir/ ($file_count files, $dir_size)"
        dirs_present=$((dirs_present + 1))
    else
        echo "      \"exists\": false," >> $results_file
        echo "      \"file_count\": 0," >> $results_file
        echo "      \"size\": \"0B\"" >> $results_file
        
        echo "❌ $dir/ (MISSING)"
    fi
    
    echo "    }" >> $results_file
done

echo ""
echo "🔍 BUILD ARTIFACTS CHECK:"
echo "========================="

# Check for build outputs
build_artifacts=()
build_size=0

if [ -d "dist" ]; then
    echo "✅ dist/ folder exists"
    dist_files=$(find dist -type f 2>/dev/null | wc -l)
    dist_size=$(du -sh dist 2>/dev/null | cut -f1 || echo "0B")
    echo "   📁 Files: $dist_files"
    echo "   📏 Size: $dist_size"
    
    # Check for specific build files
    if [ -f "dist/index.html" ]; then
        echo "   ✅ dist/index.html"
        build_artifacts+=("dist/index.html")
    fi
    
    if [ -d "dist/assets" ]; then
        asset_files=$(find dist/assets -type f 2>/dev/null | wc -l)
        echo "   ✅ dist/assets/ ($asset_files files)"
        build_artifacts+=("dist/assets")
    fi
else
    echo "❌ dist/ folder missing"
fi

# Check web_ui as alternative build
if [ -f "web_ui/index.html" ]; then
    web_ui_size=$(stat -c%s "web_ui/index.html" 2>/dev/null || echo "0")
    echo "✅ web_ui/index.html ($(ls -lh web_ui/index.html | awk '{print $5}'))"
    build_artifacts+=("web_ui/index.html")
fi

echo ""
echo "🔤 PERSIAN CONTENT CHECK:"
echo "========================"

# Check for Persian content in key files
persian_files=()
if [ -f "src/App.jsx" ]; then
    persian_count=$(grep -o '[ا-ی]' src/App.jsx 2>/dev/null | wc -l || echo "0")
    echo "📄 src/App.jsx: $persian_count Persian characters"
    if [ $persian_count -gt 10 ]; then
        persian_files+=("src/App.jsx")
    fi
fi

if [ -f "web_ui/index.html" ]; then
    persian_count=$(grep -o '[ا-ی]' web_ui/index.html 2>/dev/null | wc -l || echo "0")
    echo "📄 web_ui/index.html: $persian_count Persian characters"
    if [ $persian_count -gt 10 ]; then
        persian_files+=("web_ui/index.html")
    fi
fi

if [ -f "public/index.html" ]; then
    persian_count=$(grep -o '[ا-ی]' public/index.html 2>/dev/null | wc -l || echo "0")
    echo "📄 public/index.html: $persian_count Persian characters"
    if [ $persian_count -gt 10 ]; then
        persian_files+=("public/index.html")
    fi
fi

echo ""
echo "⚙️ DEPENDENCY CHECK:"
echo "===================="

# Check package.json dependencies
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    
    # Count dependencies
    deps=$(grep -c '".*":' package.json 2>/dev/null || echo "0")
    echo "   📦 Dependencies entries: $deps"
    
    # Check for key dependencies
    if grep -q "react" package.json 2>/dev/null; then
        echo "   ✅ React dependency found"
    fi
    
    if grep -q "vite" package.json 2>/dev/null; then
        echo "   ✅ Vite dependency found"
    fi
    
    if grep -q "tailwind" package.json 2>/dev/null; then
        echo "   ✅ Tailwind dependency found"
    fi
fi

# Check node_modules
if [ -d "node_modules" ]; then
    node_modules_size=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "0B")
    node_modules_count=$(find node_modules -maxdepth 1 -type d 2>/dev/null | wc -l || echo "0")
    echo "✅ node_modules/ ($node_modules_size, $node_modules_count packages)"
else
    echo "❌ node_modules/ missing"
fi

# Complete JSON structure
echo "  ]," >> $results_file
echo "  \"summary\": {" >> $results_file
echo "    \"files_present\": $files_present," >> $results_file
echo "    \"total_files_checked\": $total_files," >> $results_file
echo "    \"directories_present\": $dirs_present," >> $results_file
echo "    \"total_directories_checked\": ${#directories[@]}," >> $results_file
echo "    \"build_artifacts_found\": ${#build_artifacts[@]}," >> $results_file
echo "    \"persian_files_found\": ${#persian_files[@]}," >> $results_file
echo "    \"total_project_size_bytes\": $total_size" >> $results_file
echo "  }" >> $results_file
echo "}" >> $results_file

echo ""
echo "================================"
echo "🎯 FILE SYSTEM CHECK RESULTS:"
echo "================================"
echo "📅 Test Date: $(date -Iseconds)"
echo "📁 Files present: $files_present/$total_files"
echo "📂 Directories present: $dirs_present/${#directories[@]}"
echo "🏗️ Build artifacts: ${#build_artifacts[@]}"
echo "🔤 Persian content files: ${#persian_files[@]}"
echo "📏 Total project size: $(echo $total_size | awk '{print $1/1024/1024 " MB"}')"
echo "💾 Results saved to: $results_file"

# Calculate overall health
file_health=$((files_present * 100 / total_files))
dir_health=$((dirs_present * 100 / ${#directories[@]}))
overall_health=$(((file_health + dir_health) / 2))

echo ""
echo "📊 PROJECT HEALTH:"
echo "=================="
echo "📁 File completeness: $file_health%"
echo "📂 Directory structure: $dir_health%"
echo "🎯 Overall health: $overall_health%"

if [ $overall_health -gt 80 ]; then
    echo "✅ Project structure is HEALTHY"
elif [ $overall_health -gt 60 ]; then
    echo "⚠️ Project structure has MINOR ISSUES"
else
    echo "❌ Project structure has MAJOR ISSUES"
fi

echo ""
echo "✅ FILE SYSTEM VERIFICATION COMPLETED"
echo "📄 Full detailed results available in: $results_file"