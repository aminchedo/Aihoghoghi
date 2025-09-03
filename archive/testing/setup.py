#!/usr/bin/env python3
"""
Setup script for Iranian Legal Archive System
Handles installation, configuration, and initialization
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def install_system_dependencies():
    """Install system-level dependencies if possible"""
    try:
        if os.name == 'posix':  # Unix-like systems
            logger.info("🔧 Attempting to install system dependencies...")
            
            # Try different package managers
            package_managers = [
                ("apt", ["sudo", "apt", "update", "&&", "sudo", "apt", "install", "-y", "python3-pip", "python3-venv", "python3-dev"]),
                ("yum", ["sudo", "yum", "install", "-y", "python3-pip", "python3-venv", "python3-devel"]),
                ("dnf", ["sudo", "dnf", "install", "-y", "python3-pip", "python3-venv", "python3-devel"]),
            ]
            
            for pm_name, cmd in package_managers:
                if subprocess.run(["which", pm_name], capture_output=True).returncode == 0:
                    logger.info(f"📦 Using {pm_name} package manager")
                    try:
                        subprocess.run(" ".join(cmd), shell=True, check=True)
                        logger.info("✅ System dependencies installed")
                        return True
                    except subprocess.CalledProcessError:
                        logger.warning(f"⚠️ Failed to install with {pm_name}")
                        continue
        
        logger.warning("⚠️ Could not install system dependencies automatically")
        return False
        
    except Exception as e:
        logger.error(f"❌ System dependency installation failed: {e}")
        return False

def create_virtual_environment():
    """Create and setup virtual environment"""
    try:
        venv_path = Path("venv")
        
        if venv_path.exists():
            logger.info("✅ Virtual environment already exists")
            return True
        
        logger.info("🏗️ Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        
        logger.info("✅ Virtual environment created")
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Virtual environment creation failed: {e}")
        logger.info("💡 Try: python3 -m venv venv")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return False

def install_python_dependencies():
    """Install Python dependencies"""
    try:
        logger.info("📦 Installing Python dependencies...")
        
        # Try different installation methods
        pip_commands = [
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            ["pip3", "install", "-r", "requirements.txt"],
            ["pip", "install", "-r", "requirements.txt"]
        ]
        
        for cmd in pip_commands:
            try:
                subprocess.run(cmd, check=True)
                logger.info("✅ Dependencies installed successfully")
                return True
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue
        
        logger.error("❌ Failed to install dependencies with pip")
        
        # Try with --break-system-packages as last resort
        try:
            subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", "requirements.txt", 
                "--break-system-packages"
            ], check=True)
            logger.info("✅ Dependencies installed with --break-system-packages")
            return True
        except subprocess.CalledProcessError:
            logger.error("❌ Even --break-system-packages failed")
        
        return False
        
    except Exception as e:
        logger.error(f"❌ Dependency installation failed: {e}")
        return False

def setup_directories():
    """Create necessary directories"""
    directories = [
        "data/databases",
        "data/cache",
        "data/models",
        "templates",
        "static", 
        "utils",
        "logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        logger.info(f"✅ Directory created: {directory}")

def initialize_configuration():
    """Initialize configuration files"""
    try:
        # Create .env file if it doesn't exist
        env_file = Path(".env")
        if not env_file.exists():
            env_content = """# Iranian Legal Archive System Configuration
TRANSFORMERS_CACHE=data/models
HF_HOME=data/models
TORCH_HOME=data/models
CUDA_VISIBLE_DEVICES=
TOKENIZERS_PARALLELISM=false
GRADIO_ANALYTICS_ENABLED=False
"""
            env_file.write_text(env_content)
            logger.info("✅ Environment configuration created")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Configuration initialization failed: {e}")
        return False

def test_installation():
    """Test if the installation was successful"""
    try:
        logger.info("🧪 Testing installation...")
        
        # Test basic imports
        try:
            import fastapi
            import uvicorn
            logger.info("✅ Core web framework available")
        except ImportError:
            logger.warning("⚠️ Core web framework not available")
            return False
        
        # Test optional imports
        optional_deps = {
            "requests": "Web scraping",
            "beautifulsoup4": "HTML parsing", 
            "transformers": "AI classification",
            "torch": "Deep learning",
            "hazm": "Persian NLP"
        }
        
        for dep, description in optional_deps.items():
            try:
                __import__(dep.replace("-", "_"))
                logger.info(f"✅ {description} available ({dep})")
            except ImportError:
                logger.warning(f"⚠️ {description} not available ({dep})")
        
        # Test our modules
        try:
            from utils import UltraModernLegalArchive
            archive = UltraModernLegalArchive()
            logger.info("✅ Legal Archive system initialized")
        except Exception as e:
            logger.warning(f"⚠️ Legal Archive initialization warning: {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Installation test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🏛️ Iranian Legal Archive System v2.0 Setup")
    print("=" * 60)
    
    steps = [
        ("Setting up directories", setup_directories),
        ("Installing system dependencies", install_system_dependencies),
        ("Creating virtual environment", create_virtual_environment),
        ("Installing Python dependencies", install_python_dependencies),
        ("Initializing configuration", initialize_configuration),
        ("Testing installation", test_installation)
    ]
    
    for step_name, step_func in steps:
        print(f"\n📋 {step_name}...")
        try:
            if step_func():
                print(f"✅ {step_name} completed")
            else:
                print(f"⚠️ {step_name} completed with warnings")
        except Exception as e:
            print(f"❌ {step_name} failed: {e}")
            if "--continue-on-error" not in sys.argv:
                print("💡 Use --continue-on-error to ignore failures")
                return False
    
    print("\n🎉 Setup completed!")
    print("\n📖 Next steps:")
    print("1. Run: python launch.py")
    print("2. Open: http://localhost:8000")
    print("3. Check: README.md for detailed usage")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)