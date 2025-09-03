#!/usr/bin/env python3
"""
Vercel Deployment Fix Verification Script
Ensures the configuration is correct before deployment
"""

import json
import os
import sys
from pathlib import Path

def verify_vercel_config():
    """Verify vercel.json configuration is fixed"""
    results = {
        "status": "checking",
        "checks": {},
        "errors": [],
        "warnings": []
    }
    
    # Check 1: vercel.json exists
    vercel_path = Path("vercel.json")
    if not vercel_path.exists():
        results["errors"].append("vercel.json not found")
        results["status"] = "failed"
        return results
    
    # Check 2: Load and parse JSON
    try:
        with open(vercel_path, 'r') as f:
            config = json.load(f)
        results["checks"]["json_valid"] = True
    except json.JSONDecodeError as e:
        results["errors"].append(f"Invalid JSON: {e}")
        results["status"] = "failed"
        return results
    
    # Check 3: Verify no conflict between functions and builds
    has_functions = "functions" in config
    has_builds = "builds" in config
    
    if has_functions and has_builds:
        results["errors"].append("CRITICAL: Both 'functions' and 'builds' properties exist - this will fail!")
        results["status"] = "failed"
        results["checks"]["no_conflict"] = False
    elif not has_functions and not has_builds:
        results["warnings"].append("Neither 'functions' nor 'builds' found - may need configuration")
        results["checks"]["no_conflict"] = True
    else:
        results["checks"]["no_conflict"] = True
        results["checks"]["using_functions"] = has_functions
        results["checks"]["using_builds"] = has_builds
    
    # Check 4: Verify api/main.py exists
    api_main = Path("api/main.py")
    if api_main.exists():
        results["checks"]["api_main_exists"] = True
        
        # Check for handler export
        with open(api_main, 'r') as f:
            content = f.read()
            if "handler = app" in content or "handler=app" in content:
                results["checks"]["handler_export"] = True
            else:
                results["warnings"].append("api/main.py missing 'handler = app' export")
                results["checks"]["handler_export"] = False
    else:
        results["errors"].append("api/main.py not found")
        results["checks"]["api_main_exists"] = False
    
    # Check 5: Verify requirements.txt in api directory
    api_requirements = Path("api/requirements.txt")
    results["checks"]["api_requirements_exists"] = api_requirements.exists()
    if not api_requirements.exists():
        results["warnings"].append("api/requirements.txt not found - Vercel may not install dependencies")
    
    # Check 6: Verify routes configuration
    if "routes" in config:
        results["checks"]["routes_configured"] = True
        # Check for health endpoint
        health_route_found = any(
            "/health" in route.get("src", "") 
            for route in config.get("routes", [])
        )
        results["checks"]["health_route"] = health_route_found
    else:
        results["warnings"].append("No routes configured in vercel.json")
        results["checks"]["routes_configured"] = False
    
    # Determine overall status
    if results["errors"]:
        results["status"] = "❌ FAILED - Critical errors found"
    elif results["warnings"]:
        results["status"] = "⚠️ PASSED with warnings"
    else:
        results["status"] = "✅ PASSED - Ready to deploy"
    
    return results

def print_results(results):
    """Print verification results in a formatted way"""
    print("\n" + "="*60)
    print("🔍 VERCEL DEPLOYMENT FIX VERIFICATION REPORT")
    print("="*60)
    
    print(f"\n📊 Overall Status: {results['status']}")
    
    if results["checks"]:
        print("\n✅ Checks Passed:")
        for check, value in results["checks"].items():
            if value is True:
                print(f"  • {check.replace('_', ' ').title()}: ✓")
    
    if results["warnings"]:
        print("\n⚠️ Warnings:")
        for warning in results["warnings"]:
            print(f"  • {warning}")
    
    if results["errors"]:
        print("\n❌ Critical Errors:")
        for error in results["errors"]:
            print(f"  • {error}")
    
    # Configuration summary
    print("\n📋 Configuration Summary:")
    try:
        with open("vercel.json", 'r') as f:
            config = json.load(f)
        
        if "functions" in config:
            print("  • Using: Modern Functions approach ✓")
            for func, settings in config.get("functions", {}).items():
                print(f"    - {func}: {settings}")
        elif "builds" in config:
            print("  • Using: Legacy Builds approach")
        
        if "routes" in config:
            print(f"  • Routes configured: {len(config['routes'])} routes")
        
        if "env" in config:
            print(f"  • Environment variables: {list(config['env'].keys())}")
    except:
        pass
    
    print("\n" + "="*60)
    
    # Deployment commands
    if "FAILED" not in results["status"]:
        print("\n🚀 READY TO DEPLOY! Run these commands:")
        print("  1. vercel --prod          # Deploy to production")
        print("  2. vercel --prod --debug  # Deploy with verbose logging")
        print("\n📝 After deployment, test with:")
        print("  curl https://your-app.vercel.app/api/health")
    else:
        print("\n⛔ FIX REQUIRED before deployment!")
        print("  Review the errors above and run this script again.")
    
    print("="*60 + "\n")

if __name__ == "__main__":
    os.chdir("/workspace")
    results = verify_vercel_config()
    print_results(results)
    
    # Exit with appropriate code
    if "FAILED" in results["status"]:
        sys.exit(1)
    else:
        sys.exit(0)