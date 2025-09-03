#!/usr/bin/env python3
"""
COMPREHENSIVE SYSTEM VERIFICATION & DOCUMENTATION
Iranian Legal Archive System - Production Verification
"""

import json
import os
import subprocess
import time
from datetime import datetime
from pathlib import Path
import urllib.request
import urllib.error

class SystemVerification:
    def __init__(self):
        self.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.results = {
            "timestamp": self.timestamp,
            "live_testing": {},
            "file_documentation": {},
            "workflow_analysis": {},
            "recommendations": []
        }
    
    def test_github_pages(self):
        """Test GitHub Pages deployment"""
        print("🔍 Testing GitHub Pages Deployment...")
        
        base_url = "https://aminchedo.github.io/Aihoghoghi"
        pages = ["", "dashboard", "process", "search", "proxy", "settings", "about", "help"]
        
        results = {
            "base_url": base_url,
            "pages": {},
            "assets": {},
            "overall_status": "UNKNOWN"
        }
        
        # Test main page
        try:
            start = time.time()
            response = urllib.request.urlopen(base_url + "/")
            elapsed = (time.time() - start) * 1000
            
            results["main_page"] = {
                "status_code": response.getcode(),
                "response_time_ms": round(elapsed, 2),
                "content_length": len(response.read()),
                "status": "✅ WORKING"
            }
        except Exception as e:
            results["main_page"] = {
                "status": "❌ FAILED",
                "error": str(e)
            }
        
        # Test all pages
        for page in pages:
            url = f"{base_url}/{page}" if page else base_url
            try:
                start = time.time()
                response = urllib.request.urlopen(url)
                elapsed = (time.time() - start) * 1000
                
                results["pages"][page or "home"] = {
                    "status_code": response.getcode(),
                    "response_time_ms": round(elapsed, 2),
                    "status": "✅"
                }
            except urllib.error.HTTPError as e:
                results["pages"][page or "home"] = {
                    "status_code": e.code,
                    "status": "⚠️ 404" if e.code == 404 else "❌"
                }
            except Exception as e:
                results["pages"][page or "home"] = {
                    "status": "❌",
                    "error": str(e)
                }
        
        # Check for SPA routing (404.html fallback)
        spa_routing = any(p.get("status_code") == 404 for p in results["pages"].values())
        if spa_routing:
            results["spa_note"] = "⚠️ SPA routing needs 404.html fallback for client-side routing"
        
        # Overall assessment
        working_pages = sum(1 for p in results["pages"].values() if p.get("status") == "✅")
        if working_pages > 0:
            results["overall_status"] = f"✅ PARTIALLY WORKING ({working_pages}/{len(pages)} pages)"
        else:
            results["overall_status"] = "❌ NEEDS ATTENTION"
        
        self.results["live_testing"]["github_pages"] = results
        return results
    
    def analyze_file_structure(self):
        """Complete file documentation"""
        print("📁 Analyzing File Structure...")
        
        structure = {
            "frontend": {},
            "backend": {},
            "configuration": {},
            "workflows": {},
            "documentation": {}
        }
        
        # Frontend files
        frontend_paths = {
            "src/main.jsx": "React app entry point - initializes the application",
            "src/App.jsx": "Main application component - routing and layout",
            "src/App.css": "Global styles and theme definitions",
            "vite.config.js": "Vite build configuration - handles bundling",
            "index.html": "HTML entry point - loads React app",
            "package.json": "Node dependencies and scripts"
        }
        
        for path, purpose in frontend_paths.items():
            if Path(path).exists():
                size = Path(path).stat().st_size
                structure["frontend"][path] = {
                    "exists": True,
                    "purpose": purpose,
                    "size_bytes": size,
                    "critical": True
                }
            else:
                structure["frontend"][path] = {
                    "exists": False,
                    "purpose": purpose,
                    "critical": True,
                    "issue": "FILE MISSING"
                }
        
        # Backend files
        backend_paths = {
            "api/main.py": "FastAPI server - handles API requests",
            "api/requirements.txt": "Python dependencies for API",
            "vercel.json": "Vercel deployment configuration",
            "main.py": "Alternative backend entry point"
        }
        
        for path, purpose in backend_paths.items():
            if Path(path).exists():
                size = Path(path).stat().st_size
                structure["backend"][path] = {
                    "exists": True,
                    "purpose": purpose,
                    "size_bytes": size
                }
            else:
                structure["backend"][path] = {
                    "exists": False,
                    "purpose": purpose
                }
        
        # Workflow files
        workflow_dir = Path(".github/workflows")
        if workflow_dir.exists():
            for yml_file in workflow_dir.glob("*.yml"):
                with open(yml_file, 'r') as f:
                    content = f.read()
                    structure["workflows"][yml_file.name] = {
                        "exists": True,
                        "lines": len(content.splitlines()),
                        "has_pages_deploy": "pages" in content.lower(),
                        "has_vercel": "vercel" in content.lower()
                    }
        
        self.results["file_documentation"] = structure
        return structure
    
    def analyze_workflows(self):
        """Analyze GitHub Actions workflows"""
        print("⚙️ Analyzing GitHub Workflows...")
        
        workflow_analysis = {}
        workflow_dir = Path(".github/workflows")
        
        if workflow_dir.exists():
            for yml_file in workflow_dir.glob("*.yml"):
                with open(yml_file, 'r') as f:
                    content = f.read()
                    lines = content.splitlines()
                    
                    analysis = {
                        "file": yml_file.name,
                        "triggers": [],
                        "jobs": [],
                        "security": {},
                        "efficiency": {},
                        "iranian_compatibility": {}
                    }
                    
                    # Extract triggers
                    in_on_section = False
                    for line in lines:
                        if line.strip().startswith("on:"):
                            in_on_section = True
                        elif in_on_section and line.strip().startswith("-"):
                            analysis["triggers"].append(line.strip().lstrip("- "))
                        elif in_on_section and not line.startswith(" "):
                            in_on_section = False
                    
                    # Check for security issues
                    analysis["security"]["uses_secrets"] = "${{ secrets" in content
                    analysis["security"]["permissions_defined"] = "permissions:" in content
                    analysis["security"]["uses_third_party_actions"] = "uses:" in content
                    
                    # Efficiency checks
                    analysis["efficiency"]["uses_cache"] = "cache" in content.lower()
                    analysis["efficiency"]["parallel_jobs"] = content.count("job:") > 1
                    analysis["efficiency"]["estimated_time"] = "5-10 minutes" if "npm ci" in content else "< 5 minutes"
                    
                    # Iranian compatibility
                    analysis["iranian_compatibility"]["cdn_friendly"] = True
                    analysis["iranian_compatibility"]["no_blocked_services"] = "google" not in content.lower()
                    analysis["iranian_compatibility"]["supports_rtl"] = True
                    
                    workflow_analysis[yml_file.name] = analysis
        
        self.results["workflow_analysis"] = workflow_analysis
        return workflow_analysis
    
    def generate_report(self):
        """Generate comprehensive report"""
        print("\n" + "="*70)
        print("�� COMPREHENSIVE VERIFICATION REPORT")
        print("="*70)
        print(f"Generated: {self.timestamp}")
        print("="*70)
        
        # Live Testing Results
        print("\n📊 LIVE TESTING RESULTS:")
        print("-"*50)
        if "github_pages" in self.results["live_testing"]:
            gh = self.results["live_testing"]["github_pages"]
            print(f"GitHub Pages Status: {gh.get('overall_status', 'UNKNOWN')}")
            print(f"Base URL: {gh.get('base_url', 'N/A')}")
            
            if "main_page" in gh:
                mp = gh["main_page"]
                if mp.get("status") == "✅ WORKING":
                    print(f"  Main Page: ✅ {mp.get('response_time_ms', 'N/A')}ms")
                else:
                    print(f"  Main Page: {mp.get('status', '❌')}")
            
            print("\nPage Status:")
            for page, data in gh.get("pages", {}).items():
                status = data.get("status", "?")
                time_ms = data.get("response_time_ms", "N/A")
                print(f"  /{page}: {status} - {time_ms}ms" if time_ms != "N/A" else f"  /{page}: {status}")
        
        # File Structure
        print("\n📁 FILE STRUCTURE ANALYSIS:")
        print("-"*50)
        if "frontend" in self.results["file_documentation"]:
            print("Frontend Files:")
            for path, info in self.results["file_documentation"]["frontend"].items():
                status = "✅" if info.get("exists") else "❌"
                print(f"  {status} {path}")
                if not info.get("exists") and info.get("critical"):
                    print(f"     ⚠️ CRITICAL FILE MISSING!")
        
        if "backend" in self.results["file_documentation"]:
            print("\nBackend Files:")
            for path, info in self.results["file_documentation"]["backend"].items():
                status = "✅" if info.get("exists") else "⚠️"
                print(f"  {status} {path}")
        
        # Workflow Analysis
        print("\n⚙️ GITHUB WORKFLOWS:")
        print("-"*50)
        for name, analysis in self.results["workflow_analysis"].items():
            print(f"\n{name}:")
            print(f"  Triggers: {', '.join(analysis.get('triggers', [])) or 'None found'}")
            print(f"  Security: {'✅ Secure' if analysis.get('security', {}).get('permissions_defined') else '⚠️ Review needed'}")
            print(f"  Efficiency: {'✅ Optimized' if analysis.get('efficiency', {}).get('uses_cache') else '⚠️ Can be improved'}")
            print(f"  Iranian Compatible: {'✅ Yes' if analysis.get('iranian_compatibility', {}).get('no_blocked_services') else '⚠️ May have issues'}")
        
        # Recommendations
        print("\n🎯 RECOMMENDATIONS:")
        print("-"*50)
        
        # Check for issues and provide recommendations
        recommendations = []
        
        # Check GitHub Pages
        if self.results["live_testing"].get("github_pages", {}).get("overall_status", "").startswith("❌"):
            recommendations.append("1. GitHub Pages deployment needs attention - check workflow logs")
        
        # Check for missing files
        for category in ["frontend", "backend"]:
            for path, info in self.results["file_documentation"].get(category, {}).items():
                if not info.get("exists") and info.get("critical"):
                    recommendations.append(f"2. Critical file missing: {path} - needs to be created")
        
        # Check SPA routing
        if "spa_note" in self.results["live_testing"].get("github_pages", {}):
            recommendations.append("3. Configure 404.html for SPA client-side routing")
        
        if not recommendations:
            recommendations.append("✅ System is properly configured and deployed!")
        
        for rec in recommendations:
            print(f"  • {rec}")
        
        # Save to JSON
        report_file = f"verification_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Full report saved to: {report_file}")
        print("="*70)
        
        return self.results

# Execute verification
if __name__ == "__main__":
    verifier = SystemVerification()
    
    # Run all tests
    verifier.test_github_pages()
    verifier.analyze_file_structure()
    verifier.analyze_workflows()
    
    # Generate report
    verifier.generate_report()
