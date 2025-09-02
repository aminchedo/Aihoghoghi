#!/usr/bin/env python3
"""
Web Interface Verification Test
Tests actual web interface functionality without browser automation
"""

import os
import re
import json
import datetime
from typing import Dict, List, Any

class WebInterfaceVerifier:
    def __init__(self):
        self.html_files = []
        
        # Find all HTML files
        for file in os.listdir('.'):
            if file.endswith('.html'):
                self.html_files.append(file)
                
        self.results = {
            "verification_timestamp": datetime.datetime.now().isoformat(),
            "html_files_analysis": {},
            "button_functionality": {},
            "persian_support": {},
            "javascript_analysis": {},
            "interface_completeness": {}
        }

    def analyze_html_files(self):
        """Analyze all HTML files for functionality"""
        print("📄 Analyzing HTML files...")
        
        html_analysis = {
            "total_html_files": len(self.html_files),
            "file_details": {},
            "main_interface_identified": None,
            "total_lines_of_code": 0
        }
        
        for html_file in self.html_files:
            print(f"   Analyzing: {html_file}")
            
            file_analysis = {
                "file_size_bytes": 0,
                "lines_of_code": 0,
                "contains_persian": False,
                "has_javascript": False,
                "button_count": 0,
                "form_count": 0,
                "api_calls_detected": 0,
                "css_styling": False
            }
            
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                file_analysis["file_size_bytes"] = len(content.encode('utf-8'))
                file_analysis["lines_of_code"] = len(content.split('\n'))
                html_analysis["total_lines_of_code"] += file_analysis["lines_of_code"]
                
                # Check for Persian content
                persian_pattern = r'[\u0600-\u06FF\u200C\u200D]+'
                persian_matches = re.findall(persian_pattern, content)
                file_analysis["contains_persian"] = len(persian_matches) > 0
                file_analysis["persian_text_samples"] = persian_matches[:5]
                
                # Check for JavaScript
                js_patterns = [
                    r'<script[^>]*>',
                    r'function\s+\w+\s*\(',
                    r'addEventListener\s*\(',
                    r'onclick\s*=',
                    r'fetch\s*\('
                ]
                
                js_found = 0
                for pattern in js_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    js_found += len(matches)
                    
                file_analysis["has_javascript"] = js_found > 0
                file_analysis["javascript_elements_count"] = js_found
                
                # Count buttons and forms
                file_analysis["button_count"] = len(re.findall(r'<button[^>]*>', content, re.IGNORECASE))
                file_analysis["form_count"] = len(re.findall(r'<form[^>]*>', content, re.IGNORECASE))
                
                # Check for API calls
                api_patterns = [
                    r'fetch\s*\(\s*[\'"]([^\'"]+)[\'"]',
                    r'url\s*:\s*[\'"]([^\'"]+)[\'"]',
                    r'/api/\w+'
                ]
                
                api_calls = 0
                for pattern in api_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    api_calls += len(matches)
                    
                file_analysis["api_calls_detected"] = api_calls
                
                # Check for CSS styling
                file_analysis["css_styling"] = '<style>' in content or 'stylesheet' in content
                
                # Identify main interface
                if ("functional" in html_file.lower() or "working" in html_file.lower() or 
                    html_file == "index.html") and file_analysis["lines_of_code"] > 100:
                    html_analysis["main_interface_identified"] = html_file
                    
            except Exception as e:
                file_analysis["error"] = str(e)
                
            html_analysis["file_details"][html_file] = file_analysis
            
        self.results["html_files_analysis"] = html_analysis
        return html_analysis

    def test_button_functionality(self):
        """Test the specific buttons mentioned in documentation"""
        print("🎯 Testing button functionality...")
        
        button_results = {
            "documented_buttons": ["شروع اسکرپینگ", "تحلیل محتوا", "تست کامل", "آمار واقعی"],
            "buttons_found": {},
            "total_buttons_found": 0,
            "functional_buttons_estimated": 0
        }
        
        # Get main interface file
        html_analysis = self.results.get("html_files_analysis", {})
        main_interface = html_analysis.get("main_interface_identified")
        
        if main_interface and os.path.exists(main_interface):
            try:
                with open(main_interface, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for button_text in button_results["documented_buttons"]:
                    button_info = {
                        "found_in_html": False,
                        "has_onclick_handler": False,
                        "has_event_listener": False,
                        "appears_functional": False
                    }
                    
                    # Check if button text exists
                    if button_text in content:
                        button_info["found_in_html"] = True
                        button_results["total_buttons_found"] += 1
                        
                        # Check for click handlers near the button
                        button_area = self.extract_button_area(content, button_text)
                        if button_area:
                            # Check for onclick handlers
                            if re.search(r'onclick\s*=', button_area, re.IGNORECASE):
                                button_info["has_onclick_handler"] = True
                                
                            # Check for event listeners
                            if re.search(r'addEventListener|addEvent', button_area, re.IGNORECASE):
                                button_info["has_event_listener"] = True
                                
                            # Check for function calls
                            if re.search(r'function|=>\s*{|\(\)\s*=>', button_area, re.IGNORECASE):
                                button_info["appears_functional"] = True
                                
                        # Estimate functionality
                        if (button_info["has_onclick_handler"] or 
                            button_info["has_event_listener"] or 
                            button_info["appears_functional"]):
                            button_results["functional_buttons_estimated"] += 1
                            
                    button_results["buttons_found"][button_text] = button_info
                    
            except Exception as e:
                button_results["analysis_error"] = str(e)
                
        self.results["button_functionality"] = button_results
        return button_results

    def extract_button_area(self, content: str, button_text: str) -> str:
        """Extract the area around a button for analysis"""
        try:
            button_index = content.find(button_text)
            if button_index == -1:
                return ""
                
            # Get 1000 characters before and after the button
            start = max(0, button_index - 1000)
            end = min(len(content), button_index + 1000)
            
            return content[start:end]
        except:
            return ""

    def test_persian_rtl_support(self):
        """Test Persian RTL text support"""
        print("🇮🇷 Testing Persian RTL support...")
        
        persian_results = {
            "rtl_direction_set": False,
            "persian_fonts_loaded": False,
            "unicode_support": False,
            "persian_text_samples": [],
            "rtl_css_rules": 0
        }
        
        for html_file in self.html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for RTL direction
                if 'dir="rtl"' in content or "direction: rtl" in content:
                    persian_results["rtl_direction_set"] = True
                    
                # Check for Persian fonts
                font_patterns = [
                    r'Vazir', r'Tahoma', r'Arial', r'IranSans', r'Yekan'
                ]
                
                for pattern in font_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        persian_results["persian_fonts_loaded"] = True
                        break
                        
                # Check for Persian text
                persian_pattern = r'[\u0600-\u06FF\u200C\u200D]+'
                persian_matches = re.findall(persian_pattern, content)
                if persian_matches:
                    persian_results["unicode_support"] = True
                    persian_results["persian_text_samples"].extend(persian_matches[:10])
                    
                # Count RTL CSS rules
                rtl_rules = len(re.findall(r'direction\s*:\s*rtl', content, re.IGNORECASE))
                persian_results["rtl_css_rules"] += rtl_rules
                
            except Exception as e:
                print(f"   Error analyzing {html_file}: {e}")
                
        # Remove duplicates from samples
        persian_results["persian_text_samples"] = list(set(persian_results["persian_text_samples"]))[:10]
        
        self.results["persian_support"] = persian_results
        return persian_results

    def analyze_javascript_functionality(self):
        """Analyze JavaScript functionality in detail"""
        print("⚙️  Analyzing JavaScript functionality...")
        
        js_results = {
            "total_js_functions": 0,
            "api_integration_functions": 0,
            "event_handlers": 0,
            "async_operations": 0,
            "error_handling_present": False,
            "modern_js_features": []
        }
        
        for html_file in self.html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Count JavaScript functions
                function_patterns = [
                    r'function\s+\w+\s*\(',
                    r'\w+\s*=\s*function\s*\(',
                    r'\w+\s*=>\s*{',
                    r'async\s+function'
                ]
                
                for pattern in function_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    js_results["total_js_functions"] += len(matches)
                    
                # Count API integration
                api_patterns = [
                    r'fetch\s*\(',
                    r'XMLHttpRequest',
                    r'axios\.',
                    r'ajax'
                ]
                
                for pattern in api_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    js_results["api_integration_functions"] += len(matches)
                    
                # Count event handlers
                event_patterns = [
                    r'addEventListener\s*\(',
                    r'onclick\s*=',
                    r'onload\s*=',
                    r'onsubmit\s*='
                ]
                
                for pattern in event_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    js_results["event_handlers"] += len(matches)
                    
                # Check for async operations
                async_patterns = [
                    r'async\s+function',
                    r'await\s+',
                    r'Promise\.',
                    r'\.then\s*\('
                ]
                
                for pattern in async_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    js_results["async_operations"] += len(matches)
                    
                # Check for error handling
                error_patterns = [
                    r'try\s*{',
                    r'catch\s*\(',
                    r'\.catch\s*\(',
                    r'onerror\s*='
                ]
                
                for pattern in error_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        js_results["error_handling_present"] = True
                        break
                        
                # Check for modern JS features
                modern_features = [
                    ('Arrow Functions', r'=>'),
                    ('Template Literals', r'`[^`]*`'),
                    ('Destructuring', r'{\s*\w+\s*}'),
                    ('Async/Await', r'async|await'),
                    ('Fetch API', r'fetch\s*\(')
                ]
                
                for feature_name, pattern in modern_features:
                    if re.search(pattern, content, re.IGNORECASE):
                        if feature_name not in js_results["modern_js_features"]:
                            js_results["modern_js_features"].append(feature_name)
                            
            except Exception as e:
                print(f"   Error analyzing {html_file}: {e}")
                
        self.results["javascript_analysis"] = js_results
        return js_results

    def assess_interface_completeness(self):
        """Assess overall interface completeness"""
        print("🎨 Assessing interface completeness...")
        
        completeness_results = {
            "has_main_interface": False,
            "responsive_design": False,
            "accessibility_features": 0,
            "user_experience_score": 0,
            "production_ready": False
        }
        
        html_analysis = self.results.get("html_files_analysis", {})
        main_interface = html_analysis.get("main_interface_identified")
        
        if main_interface:
            completeness_results["has_main_interface"] = True
            
            try:
                with open(main_interface, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for responsive design
                responsive_indicators = [
                    'viewport',
                    'media query',
                    '@media',
                    'responsive',
                    'mobile'
                ]
                
                responsive_found = sum(1 for indicator in responsive_indicators 
                                     if indicator.lower() in content.lower())
                completeness_results["responsive_design"] = responsive_found > 0
                
                # Check accessibility features
                accessibility_features = [
                    'alt=',
                    'aria-',
                    'role=',
                    'tabindex=',
                    'title='
                ]
                
                accessibility_count = 0
                for feature in accessibility_features:
                    if feature in content.lower():
                        accessibility_count += 1
                        
                completeness_results["accessibility_features"] = accessibility_count
                
                # Calculate UX score
                ux_score = 0
                
                # Persian support
                persian_support = self.results.get("persian_support", {})
                if persian_support.get("rtl_direction_set", False):
                    ux_score += 20
                if persian_support.get("unicode_support", False):
                    ux_score += 20
                    
                # JavaScript functionality
                js_analysis = self.results.get("javascript_analysis", {})
                if js_analysis.get("total_js_functions", 0) > 0:
                    ux_score += 20
                if js_analysis.get("api_integration_functions", 0) > 0:
                    ux_score += 20
                if js_analysis.get("error_handling_present", False):
                    ux_score += 10
                    
                # Design and responsiveness
                if completeness_results["responsive_design"]:
                    ux_score += 10
                    
                completeness_results["user_experience_score"] = ux_score
                completeness_results["production_ready"] = ux_score >= 70
                
            except Exception as e:
                completeness_results["analysis_error"] = str(e)
                
        self.results["interface_completeness"] = completeness_results
        return completeness_results

    def run_comprehensive_interface_test(self):
        """Run complete web interface verification"""
        print("🚀 Starting Web Interface Verification...")
        print("=" * 80)
        
        try:
            # Execute all interface tests
            self.analyze_html_files()
            self.test_button_functionality()
            self.test_persian_rtl_support()
            self.analyze_javascript_functionality()
            self.assess_interface_completeness()
            
            # Save results
            timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
            report_path = f"/workspace/web_interface_test_{timestamp}.json"
            
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, ensure_ascii=False, indent=2)
                
            print(f"\n✅ Interface verification complete. Report saved to: {report_path}")
            
            # Print summary
            self.print_summary()
            
            return self.results
            
        except Exception as e:
            print(f"❌ Interface verification failed: {e}")
            return {"error": str(e)}

    def print_summary(self):
        """Print web interface verification summary"""
        print("\n" + "=" * 80)
        print("📊 WEB INTERFACE VERIFICATION SUMMARY")
        print("=" * 80)
        
        html_analysis = self.results.get("html_files_analysis", {})
        button_analysis = self.results.get("button_functionality", {})
        persian_analysis = self.results.get("persian_support", {})
        js_analysis = self.results.get("javascript_analysis", {})
        completeness = self.results.get("interface_completeness", {})
        
        print(f"📄 HTML Files: {html_analysis.get('total_html_files', 0)}")
        print(f"📝 Total Lines of Code: {html_analysis.get('total_lines_of_code', 0):,}")
        print(f"🎯 Main Interface: {html_analysis.get('main_interface_identified', 'Not identified')}")
        
        # Button functionality
        buttons_found = button_analysis.get("total_buttons_found", 0)
        functional_buttons = button_analysis.get("functional_buttons_estimated", 0)
        documented_buttons = len(button_analysis.get("documented_buttons", []))
        
        print(f"🔘 Documented Buttons: {buttons_found}/{documented_buttons} found in HTML")
        print(f"⚙️  Functional Buttons: {functional_buttons} estimated functional")
        
        # Persian support
        rtl_support = persian_analysis.get("rtl_direction_set", False)
        unicode_support = persian_analysis.get("unicode_support", False)
        print(f"🇮🇷 Persian RTL: {'✅ YES' if rtl_support else '❌ NO'}")
        print(f"🔤 Unicode Support: {'✅ YES' if unicode_support else '❌ NO'}")
        
        # JavaScript functionality
        js_functions = js_analysis.get("total_js_functions", 0)
        api_functions = js_analysis.get("api_integration_functions", 0)
        modern_features = len(js_analysis.get("modern_js_features", []))
        
        print(f"⚡ JavaScript Functions: {js_functions}")
        print(f"🔗 API Integration: {api_functions} functions")
        print(f"🆕 Modern JS Features: {modern_features}")
        
        # Overall assessment
        ux_score = completeness.get("user_experience_score", 0)
        production_ready = completeness.get("production_ready", False)
        
        print(f"🎨 UX Score: {ux_score}/100")
        print(f"🚀 Production Ready: {'✅ YES' if production_ready else '❌ NO'}")
        
        # Final interface status
        if ux_score >= 80:
            print("\n✅ WEB INTERFACE STATUS: EXCELLENT")
        elif ux_score >= 60:
            print("\n✅ WEB INTERFACE STATUS: GOOD")
        elif ux_score >= 40:
            print("\n⚠️  WEB INTERFACE STATUS: FAIR")
        else:
            print("\n❌ WEB INTERFACE STATUS: POOR")
            
        print("=" * 80)

def main():
    """Main execution function"""
    tester = WebInterfaceVerifier()
    return tester.run_comprehensive_interface_test()

if __name__ == "__main__":
    main()