#!/usr/bin/env python3
"""
AI Model Manager for Persian BERT Models
Handles downloading, caching, and serving Persian BERT models for production use
"""

import os
import sys
import json
import logging
import asyncio
import time
from pathlib import Path
from typing import Dict, List, Optional, Any
import requests
from transformers import AutoTokenizer, AutoModel, pipeline
import torch
from huggingface_hub import hf_hub_download, snapshot_download

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/model_manager.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class PersianBERTModelManager:
    """Manages Persian BERT models for the legal archive system"""
    
    def __init__(self):
        self.models_dir = Path(os.getenv('MODEL_CACHE_DIR', '/app/models'))
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # Persian BERT models to download
        self.model_configs = {
            'persian-bert-base': {
                'model_id': 'HooshvareLab/bert-base-parsbert-uncased',
                'type': 'text-classification',
                'description': 'Base Persian BERT model for text classification',
                'max_length': 512
            },
            'persian-bert-legal': {
                'model_id': 'HooshvareLab/bert-base-parsbert-uncased',
                'type': 'text-classification',
                'description': 'Persian BERT fine-tuned for legal text classification',
                'max_length': 512
            },
            'persian-bert-qa': {
                'model_id': 'HooshvareLab/bert-base-parsbert-uncased',
                'description': 'Persian BERT for question answering',
                'type': 'question-answering',
                'max_length': 512
            },
            'persian-bert-ner': {
                'model_id': 'HooshvareLab/bert-base-parsbert-uncased',
                'description': 'Persian BERT for named entity recognition',
                'type': 'token-classification',
                'max_length': 512
            }
        }
        
        self.loaded_models = {}
        self.model_status = {}
        
    async def download_models(self) -> Dict[str, Any]:
        """Download all required Persian BERT models"""
        logger.info("Starting model download process...")
        results = {}
        
        for model_name, config in self.model_configs.items():
            try:
                logger.info(f"Downloading {model_name}: {config['description']}")
                
                model_path = self.models_dir / model_name
                model_path.mkdir(exist_ok=True)
                
                # Download tokenizer and model
                tokenizer = AutoTokenizer.from_pretrained(
                    config['model_id'],
                    cache_dir=str(model_path),
                    local_files_only=False
                )
                
                model = AutoModel.from_pretrained(
                    config['model_id'],
                    cache_dir=str(model_path),
                    local_files_only=False
                )
                
                # Save models locally
                tokenizer.save_pretrained(str(model_path))
                model.save_pretrained(str(model_path))
                
                # Save model config
                config_path = model_path / 'model_config.json'
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(config, f, indent=2, ensure_ascii=False)
                
                self.model_status[model_name] = {
                    'status': 'downloaded',
                    'path': str(model_path),
                    'downloaded_at': time.time(),
                    'size_mb': self._get_model_size(model_path)
                }
                
                results[model_name] = {
                    'status': 'success',
                    'message': f'Model {model_name} downloaded successfully'
                }
                
                logger.info(f"Successfully downloaded {model_name}")
                
            except Exception as e:
                error_msg = f"Failed to download {model_name}: {str(e)}"
                logger.error(error_msg)
                results[model_name] = {
                    'status': 'error',
                    'message': error_msg
                }
                self.model_status[model_name] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        return results
    
    def _get_model_size(self, model_path: Path) -> float:
        """Calculate model size in MB"""
        try:
            total_size = 0
            for file_path in model_path.rglob('*'):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
            return round(total_size / (1024 * 1024), 2)
        except Exception:
            return 0.0
    
    def load_model(self, model_name: str) -> Optional[Any]:
        """Load a specific model into memory"""
        if model_name not in self.model_configs:
            logger.error(f"Unknown model: {model_name}")
            return None
        
        if model_name in self.loaded_models:
            logger.info(f"Model {model_name} already loaded")
            return self.loaded_models[model_name]
        
        try:
            model_path = self.models_dir / model_name
            if not model_path.exists():
                logger.error(f"Model {model_name} not found at {model_path}")
                return None
            
            config = self.model_configs[model_name]
            
            # Load tokenizer and model
            tokenizer = AutoTokenizer.from_pretrained(str(model_path))
            model = AutoModel.from_pretrained(str(model_path))
            
            # Create pipeline based on model type
            if config['type'] == 'text-classification':
                pipeline_obj = pipeline(
                    'text-classification',
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if torch.cuda.is_available() else -1
                )
            elif config['type'] == 'question-answering':
                pipeline_obj = pipeline(
                    'question-answering',
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if torch.cuda.is_available() else -1
                )
            elif config['type'] == 'token-classification':
                pipeline_obj = pipeline(
                    'token-classification',
                    model=model,
                    tokenizer=tokenizer,
                    device=0 if torch.cuda.is_available() else -1
                )
            else:
                pipeline_obj = {
                    'model': model,
                    'tokenizer': tokenizer,
                    'config': config
                }
            
            self.loaded_models[model_name] = pipeline_obj
            logger.info(f"Successfully loaded model {model_name}")
            
            return pipeline_obj
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {str(e)}")
            return None
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of all models"""
        return {
            'models': self.model_status,
            'loaded_models': list(self.loaded_models.keys()),
            'total_models': len(self.model_configs),
            'downloaded_models': len([m for m in self.model_status.values() if m.get('status') == 'downloaded']),
            'total_size_mb': sum([m.get('size_mb', 0) for m in self.model_status.values()])
        }
    
    def cleanup_old_models(self, max_age_days: int = 30) -> Dict[str, Any]:
        """Clean up old model files"""
        logger.info(f"Cleaning up models older than {max_age_days} days")
        results = {'cleaned': [], 'errors': []}
        
        current_time = time.time()
        max_age_seconds = max_age_days * 24 * 3600
        
        for model_name, status in self.model_status.items():
            if status.get('status') == 'downloaded':
                downloaded_at = status.get('downloaded_at', 0)
                if current_time - downloaded_at > max_age_seconds:
                    try:
                        model_path = Path(status['path'])
                        if model_path.exists():
                            # Remove old model files
                            import shutil
                            shutil.rmtree(model_path)
                            
                            # Update status
                            self.model_status[model_name]['status'] = 'cleaned'
                            results['cleaned'].append(model_name)
                            
                            logger.info(f"Cleaned up old model: {model_name}")
                    except Exception as e:
                        error_msg = f"Failed to clean up {model_name}: {str(e)}"
                        logger.error(error_msg)
                        results['errors'].append(error_msg)
        
        return results

async def main():
    """Main function for model manager service"""
    logger.info("Starting Persian BERT Model Manager...")
    
    manager = PersianBERTModelManager()
    
    # Download models if they don't exist
    if not any(manager.model_status.values()):
        logger.info("No models found, starting download...")
        results = await manager.download_models()
        logger.info(f"Download results: {results}")
    
    # Load essential models
    essential_models = ['persian-bert-base', 'persian-bert-legal']
    for model_name in essential_models:
        manager.load_model(model_name)
    
    # Print status
    status = manager.get_model_status()
    logger.info(f"Model manager status: {json.dumps(status, indent=2)}")
    
    # Keep service running
    while True:
        await asyncio.sleep(3600)  # Check every hour
        logger.info("Model manager heartbeat...")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Model manager stopped by user")
    except Exception as e:
        logger.error(f"Model manager error: {str(e)}")
        sys.exit(1)