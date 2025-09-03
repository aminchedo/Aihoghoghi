"""
Configuration file for Iranian Legal Archive System
Central configuration management for all system components
"""

import os
from pathlib import Path
from typing import Dict, Any

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
UTILS_DIR = BASE_DIR / "utils"
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

# Ensure directories exist
for directory in [DATA_DIR / "databases", DATA_DIR / "cache", DATA_DIR / "models"]:
    directory.mkdir(parents=True, exist_ok=True)

# Database configurations
DATABASE_CONFIG = {
    "main_db_path": str(DATA_DIR / "databases" / "legal_archive.sqlite"),
    "cache_db_path": str(DATA_DIR / "cache" / "intelligent_cache.sqlite"),
    "connection_timeout": 10,
    "max_connections": 5
}

# Cache configurations
CACHE_CONFIG = {
    "max_memory_items": int(os.getenv("CACHE_MEMORY_ITEMS", "150")),
    "cleanup_interval": int(os.getenv("CACHE_CLEANUP_INTERVAL", "1800")),  # 30 minutes
    "default_ttl": int(os.getenv("CACHE_DEFAULT_TTL", "3600")),  # 1 hour
    "max_cache_size_mb": int(os.getenv("CACHE_MAX_SIZE_MB", "500"))
}

# AI/ML configurations
AI_CONFIG = {
    "models_cache_path": str(DATA_DIR / "models"),
    "max_content_length": int(os.getenv("AI_MAX_CONTENT_LENGTH", "400")),  # words
    "classification_confidence_threshold": float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.7")),
    "embedding_batch_size": int(os.getenv("AI_EMBEDDING_BATCH_SIZE", "32")),
    "use_gpu": os.getenv("AI_USE_GPU", "false").lower() == "true"
}

# Network configurations
NETWORK_CONFIG = {
    "request_timeout": int(os.getenv("NETWORK_TIMEOUT", "15")),
    "max_retries": int(os.getenv("NETWORK_MAX_RETRIES", "3")),
    "retry_backoff": float(os.getenv("NETWORK_RETRY_BACKOFF", "1.0")),
    "user_agent_rotation": os.getenv("NETWORK_UA_ROTATION", "true").lower() == "true",
    "ssl_verify": os.getenv("NETWORK_SSL_VERIFY", "false").lower() == "true"
}

# Proxy configurations
PROXY_CONFIG = {
    "enabled": os.getenv("PROXY_ENABLED", "true").lower() == "true",
    "test_timeout": int(os.getenv("PROXY_TEST_TIMEOUT", "10")),
    "update_interval": int(os.getenv("PROXY_UPDATE_INTERVAL", "900")),  # 15 minutes
    "max_workers": int(os.getenv("PROXY_MAX_WORKERS", "10")),
    "success_threshold": float(os.getenv("PROXY_SUCCESS_THRESHOLD", "0.3"))
}

# DNS configurations
DNS_CONFIG = {
    "strategy": os.getenv("DNS_STRATEGY", "hybrid"),  # hybrid, doh, standard
    "doh_enabled": os.getenv("DNS_DOH_ENABLED", "true").lower() == "true",
    "test_timeout": int(os.getenv("DNS_TEST_TIMEOUT", "5")),
    "max_test_servers": int(os.getenv("DNS_MAX_TEST_SERVERS", "5"))
}

# Web server configurations
WEB_CONFIG = {
    "host": os.getenv("WEB_HOST", "0.0.0.0"),
    "port": int(os.getenv("WEB_PORT", "8000")),
    "reload": os.getenv("WEB_RELOAD", "false").lower() == "true",
    "workers": int(os.getenv("WEB_WORKERS", "1")),
    "log_level": os.getenv("WEB_LOG_LEVEL", "info"),
    "cors_enabled": os.getenv("WEB_CORS_ENABLED", "true").lower() == "true"
}

# Processing configurations
PROCESSING_CONFIG = {
    "default_batch_size": int(os.getenv("PROCESSING_BATCH_SIZE", "5")),
    "max_batch_size": int(os.getenv("PROCESSING_MAX_BATCH_SIZE", "20")),
    "inter_request_delay": float(os.getenv("PROCESSING_REQUEST_DELAY", "0.5")),
    "inter_batch_delay": float(os.getenv("PROCESSING_BATCH_DELAY", "2.0")),
    "max_concurrent_requests": int(os.getenv("PROCESSING_MAX_CONCURRENT", "10"))
}

# Quality scoring configurations
SCORING_CONFIG = {
    "weights": {
        "content_quality": float(os.getenv("SCORE_CONTENT_WEIGHT", "0.25")),
        "structure_quality": float(os.getenv("SCORE_STRUCTURE_WEIGHT", "0.20")),
        "legal_relevance": float(os.getenv("SCORE_LEGAL_WEIGHT", "0.20")),
        "source_reliability": float(os.getenv("SCORE_SOURCE_WEIGHT", "0.15")),
        "completeness": float(os.getenv("SCORE_COMPLETENESS_WEIGHT", "0.10")),
        "readability": float(os.getenv("SCORE_READABILITY_WEIGHT", "0.10"))
    },
    "min_quality_threshold": float(os.getenv("SCORE_MIN_THRESHOLD", "40.0")),
    "excellent_threshold": float(os.getenv("SCORE_EXCELLENT_THRESHOLD", "80.0"))
}

# Environment-specific overrides
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # Production overrides
    WEB_CONFIG["reload"] = False
    WEB_CONFIG["workers"] = max(4, WEB_CONFIG["workers"])
    CACHE_CONFIG["max_memory_items"] = 300
    PROCESSING_CONFIG["max_concurrent_requests"] = 20
    
elif ENVIRONMENT == "development":
    # Development overrides
    WEB_CONFIG["reload"] = True
    WEB_CONFIG["log_level"] = "debug"
    
elif ENVIRONMENT == "testing":
    # Testing overrides
    DATABASE_CONFIG["main_db_path"] = ":memory:"
    CACHE_CONFIG["max_memory_items"] = 50
    PROCESSING_CONFIG["default_batch_size"] = 2

# Security configurations
SECURITY_CONFIG = {
    "secret_key": os.getenv("SECRET_KEY", "development-key-change-in-production"),
    "cors_origins": os.getenv("CORS_ORIGINS", "*").split(","),
    "max_upload_size": int(os.getenv("MAX_UPLOAD_SIZE", "10485760")),  # 10MB
    "rate_limit_enabled": os.getenv("RATE_LIMIT_ENABLED", "false").lower() == "true"
}

# Logging configurations
LOGGING_CONFIG = {
    "level": os.getenv("LOG_LEVEL", "INFO"),
    "format": os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s"),
    "file_path": str(BASE_DIR / "logs" / "app.log"),
    "max_bytes": int(os.getenv("LOG_MAX_BYTES", "10485760")),  # 10MB
    "backup_count": int(os.getenv("LOG_BACKUP_COUNT", "5"))
}

# Feature flags
FEATURES = {
    "ai_classification": os.getenv("FEATURE_AI_CLASSIFICATION", "true").lower() == "true",
    "proxy_support": os.getenv("FEATURE_PROXY_SUPPORT", "true").lower() == "true",
    "doh_dns": os.getenv("FEATURE_DOH_DNS", "true").lower() == "true",
    "real_time_updates": os.getenv("FEATURE_REAL_TIME_UPDATES", "true").lower() == "true",
    "export_functionality": os.getenv("FEATURE_EXPORT", "true").lower() == "true",
    "advanced_search": os.getenv("FEATURE_ADVANCED_SEARCH", "true").lower() == "true"
}

def get_config() -> Dict[str, Any]:
    """Get complete configuration dictionary"""
    return {
        "database": DATABASE_CONFIG,
        "cache": CACHE_CONFIG,
        "ai": AI_CONFIG,
        "network": NETWORK_CONFIG,
        "proxy": PROXY_CONFIG,
        "dns": DNS_CONFIG,
        "web": WEB_CONFIG,
        "processing": PROCESSING_CONFIG,
        "scoring": SCORING_CONFIG,
        "security": SECURITY_CONFIG,
        "logging": LOGGING_CONFIG,
        "features": FEATURES,
        "environment": ENVIRONMENT,
        "paths": {
            "base": str(BASE_DIR),
            "data": str(DATA_DIR),
            "templates": str(TEMPLATES_DIR),
            "static": str(STATIC_DIR)
        }
    }

def validate_config() -> bool:
    """Validate configuration settings"""
    try:
        config = get_config()
        
        # Check required paths
        required_paths = [DATA_DIR, TEMPLATES_DIR, STATIC_DIR]
        for path in required_paths:
            if not path.exists():
                raise ValueError(f"Required path does not exist: {path}")
        
        # Check numeric ranges
        if not (1 <= config["processing"]["default_batch_size"] <= 50):
            raise ValueError("Invalid batch size configuration")
        
        if not (0.0 <= sum(config["scoring"]["weights"].values()) <= 2.0):
            raise ValueError("Invalid scoring weights configuration")
        
        return True
        
    except Exception as e:
        logger.error(f"Configuration validation failed: {e}")
        return False

# Environment variable setup
def setup_environment():
    """Setup environment variables"""
    env_vars = {
        'TRANSFORMERS_CACHE': AI_CONFIG["models_cache_path"],
        'HF_HOME': AI_CONFIG["models_cache_path"],
        'TORCH_HOME': AI_CONFIG["models_cache_path"],
        'TOKENIZERS_PARALLELISM': 'false',
        'GRADIO_ANALYTICS_ENABLED': 'False',
        'CUDA_VISIBLE_DEVICES': '' if not AI_CONFIG["use_gpu"] else None
    }
    
    for key, value in env_vars.items():
        if value is not None:
            os.environ[key] = str(value)

# Initialize environment on import
setup_environment()

# Validate configuration
if __name__ == "__main__":
    if validate_config():
        print("✅ Configuration is valid")
        import json
        print(json.dumps(get_config(), indent=2, ensure_ascii=False))
    else:
        print("❌ Configuration validation failed")
        sys.exit(1)