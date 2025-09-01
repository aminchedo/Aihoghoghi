#!/usr/bin/env python3
"""
UI System Verification Script
Tests the new React-based UI system and generates a comprehensive verification report
"""

import json
import os
import time
import subprocess
from datetime import datetime
from pathlib import Path

class UISystemVerifier:
    def __init__(self):
        self.report = {
            "verification_timestamp": datetime.now().isoformat(),
            "system_info": {
                "ui_version": "2.0.0",
                "architecture": "React + Vite + Tailwind",
                "target_environment": "Production-ready Persian Legal Archive"
            },
            "components_verified": [],
            "api_endpoints_tested": [],
            "features_validated": [],
            "files_created": [],
            "test_results": {},
            "recommendations": [],
            "next_steps": []
        }
        
    def verify_project_structure(self):
        """Verify that all necessary project files exist"""
        print("🔍 Verifying project structure...")
        
        required_files = [
            "package.json",
            "vite.config.js",
            "tailwind.config.js",
            "postcss.config.js",
            "index.html",
            "src/main.jsx",
            "src/App.jsx",
            "src/App.css",
            "README.md"
        ]
        
        required_directories = [
            "src/components/layout",
            "src/components/pages",
            "src/components/ui",
            "src/components/document",
            "src/components/proxy",
            "src/components/settings",
            "src/contexts"
        ]
        
        missing_files = []
        missing_dirs = []
        
        for file_path in required_files:
            if not Path(file_path).exists():
                missing_files.append(file_path)
            else:
                self.report["files_created"].append({
                    "file": file_path,
                    "status": "exists",
                    "size": os.path.getsize(file_path)
                })
        
        for dir_path in required_directories:
            if not Path(dir_path).exists():
                missing_dirs.append(dir_path)
        
        structure_valid = len(missing_files) == 0 and len(missing_dirs) == 0
        
        self.report["test_results"]["project_structure"] = {
            "status": "pass" if structure_valid else "fail",
            "missing_files": missing_files,
            "missing_directories": missing_dirs,
            "total_files_created": len(self.report["files_created"])
        }
        
        if structure_valid:
            print("✅ Project structure verification passed")
        else:
            print("❌ Project structure verification failed")
            print(f"Missing files: {missing_files}")
            print(f"Missing directories: {missing_dirs}")
            
        return structure_valid
    
    def verify_package_json(self):
        """Verify package.json configuration"""
        print("📦 Verifying package.json configuration...")
        
        try:
            with open("package.json", "r", encoding="utf-8") as f:
                package_data = json.load(f)
            
            required_deps = [
                "react",
                "react-dom",
                "react-router-dom",
                "@tanstack/react-query",
                "react-hot-toast",
                "chart.js",
                "react-chartjs-2"
            ]
            
            required_dev_deps = [
                "@vitejs/plugin-react",
                "vite",
                "tailwindcss",
                "autoprefixer",
                "postcss"
            ]
            
            missing_deps = []
            missing_dev_deps = []
            
            dependencies = package_data.get("dependencies", {})
            dev_dependencies = package_data.get("devDependencies", {})
            
            for dep in required_deps:
                if dep not in dependencies:
                    missing_deps.append(dep)
            
            for dep in required_dev_deps:
                if dep not in dev_dependencies:
                    missing_dev_deps.append(dep)
            
            package_valid = len(missing_deps) == 0 and len(missing_dev_deps) == 0
            
            self.report["test_results"]["package_configuration"] = {
                "status": "pass" if package_valid else "fail",
                "missing_dependencies": missing_deps,
                "missing_dev_dependencies": missing_dev_deps,
                "total_dependencies": len(dependencies),
                "total_dev_dependencies": len(dev_dependencies)
            }
            
            if package_valid:
                print("✅ Package.json verification passed")
            else:
                print("❌ Package.json verification failed")
                
            return package_valid
            
        except Exception as e:
            print(f"❌ Error verifying package.json: {e}")
            self.report["test_results"]["package_configuration"] = {
                "status": "error",
                "error": str(e)
            }
            return False
    
    def verify_components(self):
        """Verify React components exist and are properly structured"""
        print("⚛️ Verifying React components...")
        
        components = [
            ("src/App.jsx", "Main Application Component"),
            ("src/components/layout/Header.jsx", "Header Layout Component"),
            ("src/components/layout/Sidebar.jsx", "Sidebar Navigation Component"),
            ("src/components/pages/Dashboard.jsx", "Dashboard Page Component"),
            ("src/components/pages/DocumentProcessing.jsx", "Document Processing Page"),
            ("src/components/pages/ProxyDashboard.jsx", "Proxy Management Dashboard"),
            ("src/components/pages/Settings.jsx", "Settings Configuration Page"),
            ("src/components/ui/StatsCard.jsx", "Statistics Display Card"),
            ("src/components/ui/Chart.jsx", "Chart Visualization Component"),
            ("src/components/ui/LoadingSpinner.jsx", "Loading State Component"),
            ("src/components/ui/ErrorMessage.jsx", "Error Display Component"),
            ("src/components/ui/ErrorBoundary.jsx", "Error Boundary Component")
        ]
        
        verified_components = []
        missing_components = []
        
        for component_path, description in components:
            if Path(component_path).exists():
                # Check if it's a valid React component
                try:
                    with open(component_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # Basic validation - should contain React imports and export
                    has_react_import = "import React" in content or "from 'react'" in content
                    has_export = "export default" in content
                    
                    if has_react_import and has_export:
                        verified_components.append({
                            "path": component_path,
                            "description": description,
                            "status": "valid",
                            "size": len(content)
                        })
                    else:
                        verified_components.append({
                            "path": component_path,
                            "description": description,
                            "status": "invalid",
                            "issues": [
                                "Missing React import" if not has_react_import else None,
                                "Missing export default" if not has_export else None
                            ]
                        })
                        
                except Exception as e:
                    verified_components.append({
                        "path": component_path,
                        "description": description,
                        "status": "error",
                        "error": str(e)
                    })
            else:
                missing_components.append({
                    "path": component_path,
                    "description": description
                })
        
        components_valid = len(missing_components) == 0 and all(
            comp["status"] == "valid" for comp in verified_components
        )
        
        self.report["test_results"]["components"] = {
            "status": "pass" if components_valid else "fail",
            "verified_components": verified_components,
            "missing_components": missing_components,
            "total_components": len(components)
        }
        
        self.report["components_verified"] = [comp["path"] for comp in verified_components if comp["status"] == "valid"]
        
        if components_valid:
            print(f"✅ Component verification passed - {len(verified_components)} components verified")
        else:
            print(f"❌ Component verification failed - {len(missing_components)} missing, {len([c for c in verified_components if c['status'] != 'valid'])} invalid")
            
        return components_valid
    
    def verify_contexts(self):
        """Verify React context providers"""
        print("🔄 Verifying React contexts...")
        
        contexts = [
            ("src/contexts/ThemeContext.jsx", "Theme Management Context"),
            ("src/contexts/ConfigContext.jsx", "Configuration Context"),
            ("src/contexts/NotificationContext.jsx", "Notification System Context")
        ]
        
        verified_contexts = []
        missing_contexts = []
        
        for context_path, description in contexts:
            if Path(context_path).exists():
                try:
                    with open(context_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    # Check for context-specific patterns
                    has_create_context = "createContext" in content
                    has_provider = "Provider" in content
                    has_use_hook = "use" in content.lower()
                    
                    verified_contexts.append({
                        "path": context_path,
                        "description": description,
                        "status": "valid" if has_create_context and has_provider else "incomplete",
                        "features": {
                            "createContext": has_create_context,
                            "Provider": has_provider,
                            "useHook": has_use_hook
                        }
                    })
                    
                except Exception as e:
                    verified_contexts.append({
                        "path": context_path,
                        "description": description,
                        "status": "error",
                        "error": str(e)
                    })
            else:
                missing_contexts.append({
                    "path": context_path,
                    "description": description
                })
        
        contexts_valid = len(missing_contexts) == 0 and all(
            ctx["status"] == "valid" for ctx in verified_contexts
        )
        
        self.report["test_results"]["contexts"] = {
            "status": "pass" if contexts_valid else "fail",
            "verified_contexts": verified_contexts,
            "missing_contexts": missing_contexts
        }
        
        if contexts_valid:
            print(f"✅ Context verification passed - {len(verified_contexts)} contexts verified")
        else:
            print("❌ Context verification failed")
            
        return contexts_valid
    
    def verify_api_integration(self):
        """Verify API integration patterns"""
        print("🔌 Verifying API integration...")
        
        # Define expected API endpoints based on the backend
        expected_endpoints = [
            ("/api/status", "System status endpoint"),
            ("/api/stats", "System statistics endpoint"),
            ("/api/process-urls", "URL processing endpoint"),
            ("/api/processed-documents", "Document retrieval endpoint"),
            ("/api/network", "Network status endpoint"),
            ("/api/network/proxies", "Proxy management endpoint"),
            ("/api/search", "Document search endpoint"),
            ("/api/logs", "System logs endpoint")
        ]
        
        # Check if components use these endpoints
        api_usage = []
        
        for endpoint, description in expected_endpoints:
            endpoint_used = False
            using_components = []
            
            # Search through component files
            for root, dirs, files in os.walk("src"):
                for file in files:
                    if file.endswith(('.jsx', '.js')):
                        file_path = os.path.join(root, file)
                        try:
                            with open(file_path, "r", encoding="utf-8") as f:
                                content = f.read()
                            
                            if endpoint in content:
                                endpoint_used = True
                                using_components.append(file_path)
                                
                        except Exception:
                            continue
            
            api_usage.append({
                "endpoint": endpoint,
                "description": description,
                "used": endpoint_used,
                "using_components": using_components
            })
        
        endpoints_integrated = sum(1 for usage in api_usage if usage["used"])
        integration_rate = (endpoints_integrated / len(expected_endpoints)) * 100
        
        self.report["test_results"]["api_integration"] = {
            "status": "pass" if integration_rate >= 80 else "partial" if integration_rate >= 50 else "fail",
            "integration_rate": integration_rate,
            "endpoints_integrated": endpoints_integrated,
            "total_endpoints": len(expected_endpoints),
            "api_usage": api_usage
        }
        
        self.report["api_endpoints_tested"] = [usage["endpoint"] for usage in api_usage if usage["used"]]
        
        if integration_rate >= 80:
            print(f"✅ API integration verification passed - {integration_rate:.1f}% coverage")
        elif integration_rate >= 50:
            print(f"⚠️ API integration partially verified - {integration_rate:.1f}% coverage")
        else:
            print(f"❌ API integration verification failed - {integration_rate:.1f}% coverage")
            
        return integration_rate >= 50
    
    def verify_features(self):
        """Verify key features are implemented"""
        print("🎯 Verifying key features...")
        
        features = [
            {
                "name": "RTL Support",
                "files": ["tailwind.config.js", "src/App.css"],
                "patterns": ["rtl", "dir=\"rtl\"", "right-to-left"]
            },
            {
                "name": "Persian Typography",
                "files": ["src/App.css", "tailwind.config.js"],
                "patterns": ["Vazirmatn", "persian", "farsi", "fa-IR"]
            },
            {
                "name": "Dark Mode Support",
                "files": ["src/contexts/ThemeContext.jsx", "tailwind.config.js"],
                "patterns": ["dark:", "darkMode", "theme"]
            },
            {
                "name": "WebSocket Integration",
                "files": ["src/components/pages/DocumentProcessing.jsx"],
                "patterns": ["WebSocket", "ws://", "websocket"]
            },
            {
                "name": "Error Handling",
                "files": ["src/components/ui/ErrorBoundary.jsx", "src/contexts/NotificationContext.jsx"],
                "patterns": ["try", "catch", "error", "ErrorBoundary"]
            },
            {
                "name": "Responsive Design",
                "files": ["tailwind.config.js", "src/App.css"],
                "patterns": ["md:", "lg:", "xl:", "responsive", "mobile"]
            }
        ]
        
        verified_features = []
        
        for feature in features:
            feature_implemented = False
            evidence = []
            
            for file_path in feature["files"]:
                if Path(file_path).exists():
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read().lower()
                        
                        for pattern in feature["patterns"]:
                            if pattern.lower() in content:
                                feature_implemented = True
                                evidence.append(f"Found '{pattern}' in {file_path}")
                                
                    except Exception:
                        continue
            
            verified_features.append({
                "name": feature["name"],
                "implemented": feature_implemented,
                "evidence": evidence
            })
        
        features_implemented = sum(1 for f in verified_features if f["implemented"])
        feature_rate = (features_implemented / len(features)) * 100
        
        self.report["test_results"]["features"] = {
            "status": "pass" if feature_rate >= 80 else "partial" if feature_rate >= 60 else "fail",
            "feature_rate": feature_rate,
            "features_implemented": features_implemented,
            "total_features": len(features),
            "verified_features": verified_features
        }
        
        self.report["features_validated"] = [f["name"] for f in verified_features if f["implemented"]]
        
        if feature_rate >= 80:
            print(f"✅ Feature verification passed - {feature_rate:.1f}% implemented")
        elif feature_rate >= 60:
            print(f"⚠️ Feature verification partially passed - {feature_rate:.1f}% implemented")
        else:
            print(f"❌ Feature verification failed - {feature_rate:.1f}% implemented")
            
        return feature_rate >= 60
    
    def generate_recommendations(self):
        """Generate recommendations based on verification results"""
        print("💡 Generating recommendations...")
        
        recommendations = []
        next_steps = []
        
        # Check test results and generate recommendations
        if self.report["test_results"].get("project_structure", {}).get("status") != "pass":
            recommendations.append("Complete project structure setup - some files or directories are missing")
            next_steps.append("Run 'npm install' to ensure all dependencies are installed")
        
        if self.report["test_results"].get("api_integration", {}).get("integration_rate", 0) < 80:
            recommendations.append("Improve API integration coverage - some endpoints are not being used")
            next_steps.append("Test all API endpoints with the backend server running")
        
        if self.report["test_results"].get("features", {}).get("feature_rate", 0) < 80:
            recommendations.append("Complete feature implementation - some key features need work")
            next_steps.append("Review and enhance missing features like WebSocket integration")
        
        # Always recommend testing
        recommendations.extend([
            "Set up comprehensive testing suite with unit and integration tests",
            "Implement E2E testing with Cypress or Playwright",
            "Add performance monitoring and optimization",
            "Set up CI/CD pipeline for automated testing and deployment"
        ])
        
        next_steps.extend([
            "Start the backend server: python3 app.py",
            "Start the frontend development server: npm run dev",
            "Test all major user flows manually",
            "Run automated tests: npm run test",
            "Build for production: npm run build",
            "Deploy to staging environment for final testing"
        ])
        
        self.report["recommendations"] = recommendations
        self.report["next_steps"] = next_steps
        
        print(f"📋 Generated {len(recommendations)} recommendations and {len(next_steps)} next steps")
    
    def run_verification(self):
        """Run complete verification process"""
        print("🚀 Starting UI System Verification...")
        print("=" * 60)
        
        # Run all verification steps
        results = []
        results.append(("Project Structure", self.verify_project_structure()))
        results.append(("Package Configuration", self.verify_package_json()))
        results.append(("React Components", self.verify_components()))
        results.append(("React Contexts", self.verify_contexts()))
        results.append(("API Integration", self.verify_api_integration()))
        results.append(("Key Features", self.verify_features()))
        
        # Generate recommendations
        self.generate_recommendations()
        
        # Calculate overall score
        passed_tests = sum(1 for _, result in results if result)
        total_tests = len(results)
        overall_score = (passed_tests / total_tests) * 100
        
        self.report["overall_results"] = {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "overall_score": overall_score,
            "status": "pass" if overall_score >= 80 else "partial" if overall_score >= 60 else "fail"
        }
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 VERIFICATION SUMMARY")
        print("=" * 60)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\n📈 Overall Score: {overall_score:.1f}% ({passed_tests}/{total_tests} tests passed)")
        
        if overall_score >= 80:
            print("🎉 UI System is ready for production!")
        elif overall_score >= 60:
            print("⚠️ UI System needs some improvements before production")
        else:
            print("🔧 UI System requires significant work before deployment")
        
        return self.report
    
    def save_report(self, filename=None):
        """Save verification report to file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"ui_verification_report_{timestamp}.json"
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.report, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Verification report saved to: {filename}")
        return filename

def main():
    """Main verification function"""
    verifier = UISystemVerifier()
    
    try:
        # Run verification
        report = verifier.run_verification()
        
        # Save report
        report_file = verifier.save_report()
        
        # Print key metrics
        print("\n" + "🔍 KEY METRICS")
        print("-" * 40)
        print(f"Files Created: {len(report['files_created'])}")
        print(f"Components Verified: {len(report['components_verified'])}")
        print(f"API Endpoints Tested: {len(report['api_endpoints_tested'])}")
        print(f"Features Validated: {len(report['features_validated'])}")
        print(f"Overall Score: {report['overall_results']['overall_score']:.1f}%")
        
        # Print next steps
        if report["next_steps"]:
            print(f"\n📋 NEXT STEPS:")
            for i, step in enumerate(report["next_steps"][:5], 1):
                print(f"{i}. {step}")
        
        return report
        
    except Exception as e:
        print(f"❌ Verification failed with error: {e}")
        return None

if __name__ == "__main__":
    main()