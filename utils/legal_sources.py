"""
Authoritative Legal Sources Configuration for Iranian Legal Archive System
Contains source-specific scraping rules and metadata for major Iranian legal websites
"""

# Enhanced Icons and UI Elements
ICONS = {
    'search': '🔍', 'document': '📄', 'analyze': '🤖', 'export': '📊',
    'settings': '⚙️', 'link': '🔗', 'success': '✅', 'error': '❌',
    'warning': '⚠️', 'database': '🗄️', 'crawler': '🔄', 'brain': '🧠',
    'cache': '⚡', 'score': '📈', 'classify': '🏷️', 'similarity': '🎯',
    'law': '⚖️', 'verdict': '🏛️', 'contract': '📝', 'regulation': '📋',
    'quality': '💎', 'process': '🔧', 'monitor': '📱', 'report': '📑',
    'majlis': '🏛️', 'judiciary': '⚖️', 'dotic': '📚', 'rrk': '📰',
    'icbar': '👨‍💼', 'scoda': '🤝', 'sid': '🎓', 'jref': '📖',
    'dns': '🌐', 'proxy': '🔐', 'ssl': '🔒', 'speed': '⚡'
}

# Enhanced Authoritative Sources with Better URL Patterns
AUTHORITATIVE_LEGAL_SOURCES = {
    "مجلس شورای اسلامی": {
        "base_urls": ["https://rc.majlis.ir", "https://majlis.ir", "http://rc.majlis.ir"],
        "url_patterns": ["/fa/law/show/", "/fa/report/show/", "/fa/content/law_cd", "/law/", "/report/"],
        "content_selectors": [".main-content", ".article-body", "article", ".law-content", ".content-body", "#main-content"],
        "title_selectors": ["h1", "h2", ".law-title", ".article-title", ".main-title"],
        "priority": 1,
        "reliability_score": 0.98,
        "category": "قانون",
        "description": "منابع رسمی قوانین مصوب مجلس",
        "icon": ICONS['majlis'],
        "encoding": "utf-8",
        "requires_special_handling": False
    },
    "پورتال ملی قوانین": {
        "base_urls": ["https://www.dotic.ir", "https://dotic.ir", "http://dotic.ir"],
        "url_patterns": ["/portal/law/", "/regulation/", "/cat/88", "/law-detail/"],
        "content_selectors": [".content-area", ".law-content", ".main-content", ".portal-content", ".regulation-text"],
        "title_selectors": ["h1", ".law-title", ".portal-title", ".regulation-title"],
        "priority": 1,
        "reliability_score": 0.96,
        "category": "قانون",
        "description": "سامانه جامع قوانین و مقررات کشور",
        "icon": ICONS['dotic'],
        "encoding": "utf-8",
        "requires_special_handling": False
    },
    "قوه قضاییه": {
        "base_urls": ["https://eadl.ir", "https://www.judiciary.ir", "http://judiciary.ir"],
        "url_patterns": ["/fa/news/", "/fa/verdict/", "/fa/judgment/", "/verdict/", "/judgment/"],
        "content_selectors": [".news-content", ".main-content", ".verdict-content", ".judgment-text", ".article-content"],
        "title_selectors": ["h1", ".news-title", ".verdict-title", ".judgment-title"],
        "priority": 1,
        "reliability_score": 0.95,
        "category": "دادنامه",
        "description": "درگاه ملی خدمات الکترونیک قضایی",
        "icon": ICONS['judiciary'],
        "encoding": "utf-8",
        "requires_special_handling": True
    },
    "روزنامه رسمی": {
        "base_urls": ["https://rrk.ir", "http://rrk.ir"],
        "url_patterns": ["/gazette/", "/official/", "/announcement/", "/paper/"],
        "content_selectors": [".gazette-content", ".official-content", ".announcement-text", ".paper-content"],
        "title_selectors": ["h1", ".gazette-title", ".official-title"],
        "priority": 1,
        "reliability_score": 0.99,
        "category": "آگهی_قانونی",
        "description": "مرجع رسمی انتشار قوانین و آگهی‌های قانونی",
        "icon": ICONS['rrk'],
        "encoding": "utf-8",
        "requires_special_handling": False
    },
    "کانون وکلای دادگستری": {
        "base_urls": ["https://icbar.ir", "http://icbar.ir"],
        "url_patterns": ["/fa/legal/", "/fa/verdict-review/", "/fa/regulation/", "/legal/", "/verdict/"],
        "content_selectors": [".legal-content", ".verdict-analysis", ".regulation-content", ".article-body"],
        "title_selectors": ["h1", ".legal-title", ".verdict-title"],
        "priority": 2,
        "reliability_score": 0.90,
        "category": "رویه_قضایی",
        "description": "آرای وحدت رویه و تحلیل‌های حقوقی",
        "icon": ICONS['icbar'],
        "encoding": "utf-8",
        "requires_special_handling": False
    }
}

# Enhanced Legal Terms Dictionary
COMPREHENSIVE_LEGAL_TERMS = {
    "قوانین_اساسی": [
        "قانون اساسی", "مجلس شورای اسلامی", "شورای نگهبان", "ولایت فقیه",
        "اصول قانون اساسی", "مجمع تشخیص مصلحت", "رهبری", "نظام جمهوری اسلامی",
        "حاکمیت ملی", "استقلال", "آزادی", "جمهوری اسلامی", "اصل", "تفسیر قانون اساسی"
    ],
    "قوانین_عادی": [
        "ماده", "تبصره", "فصل", "باب", "قسمت", "بخش", "قانون مدنی", "قانون جزا",
        "قانون تجارت", "قانون کار", "قانون مالیات", "آیین دادرسی مدنی",
        "آیین دادرسی کیفری", "مقررات", "آیین‌نامه", "دستورالعمل", "بخشنامه"
    ],
    "اصطلاحات_پردازش": [
        "شخص حقیقی", "شخص حقوقی", "اهلیت", "ولایت", "وصایت", "حضانت",
        "دعوا", "خواهان", "خوانده", "مجازات", "قرارداد", "تعهد", "مسئولیت",
        "ضمان", "التزام", "حق", "تکلیف", "صلاحیت", "اختیار", "وظیفه"
    ],
    "نهادهای_قضایی": [
        "دادگاه", "قاضی", "وکیل", "مدعی‌العموم", "رای", "حکم", "قرار",
        "دادنامه", "دادستان", "بازپرس", "دیوان عدالت اداری", "دیوان عالی کشور",
        "محاکم", "شعبه", "بازداشت", "توقیف", "ضبط", "حبس", "تعلیق"
    ],
    "اصطلاحات_مالی": [
        "مالیات", "عوارض", "جریمه", "خسارت", "تأمین", "ضمانت", "وثیقه",
        "دیه", "ارث", "میراث", "وصیت", "هبه", "بیمه", "سود", "ربا", "زکات",
        "درآمد", "هزینه", "بودجه", "اعتبار"
    ]
}

# Enhanced Model Configuration for HF Deployment
OPTIMIZED_MODELS = {
    "classification": {
        "primary": "HooshvareLab/bert-base-parsbert-uncased",
        "fallback": "HooshvareLab/bert-fa-base-uncased",
        "lightweight": "distilbert-base-multilingual-cased"
    },
    "embedding": {
        "primary": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        "fallback": "sentence-transformers/all-MiniLM-L6-v2"
    }
}


def get_source_by_url(url: str) -> dict:
    """
    Get the appropriate source configuration based on URL
    
    Args:
        url: The URL to match against source patterns
        
    Returns:
        dict: Source configuration or empty dict if no match
    """
    for source_name, config in AUTHORITATIVE_LEGAL_SOURCES.items():
        for base_url in config["base_urls"]:
            if base_url in url:
                return {**config, "name": source_name}
    
    return {}


def is_legal_url(url: str) -> bool:
    """
    Check if a URL belongs to a recognized legal source
    
    Args:
        url: The URL to check
        
    Returns:
        bool: True if URL is from a recognized legal source
    """
    return bool(get_source_by_url(url))


def get_content_selectors_for_url(url: str) -> list:
    """
    Get appropriate content selectors for a given URL
    
    Args:
        url: The URL to get selectors for
        
    Returns:
        list: List of CSS selectors to try for content extraction
    """
    source = get_source_by_url(url)
    return source.get("content_selectors", [".main-content", "article", ".content"])


def get_title_selectors_for_url(url: str) -> list:
    """
    Get appropriate title selectors for a given URL
    
    Args:
        url: The URL to get selectors for
        
    Returns:
        list: List of CSS selectors to try for title extraction
    """
    source = get_source_by_url(url)
    return source.get("title_selectors", ["h1", "h2", ".title"])


def get_source_priority(url: str) -> int:
    """
    Get priority score for a source (lower is higher priority)
    
    Args:
        url: The URL to get priority for
        
    Returns:
        int: Priority score (1 = highest, higher numbers = lower priority)
    """
    source = get_source_by_url(url)
    return source.get("priority", 999)


def get_source_reliability(url: str) -> float:
    """
    Get reliability score for a source
    
    Args:
        url: The URL to get reliability for
        
    Returns:
        float: Reliability score (0.0 to 1.0, higher is more reliable)
    """
    source = get_source_by_url(url)
    return source.get("reliability_score", 0.5)


def get_source_category(url: str) -> str:
    """
    Get the legal category for a source
    
    Args:
        url: The URL to get category for
        
    Returns:
        str: Legal category (e.g., "قانون", "دادنامه", etc.)
    """
    source = get_source_by_url(url)
    return source.get("category", "نامشخص")


def requires_special_handling(url: str) -> bool:
    """
    Check if a URL requires special handling during scraping
    
    Args:
        url: The URL to check
        
    Returns:
        bool: True if special handling is required
    """
    source = get_source_by_url(url)
    return source.get("requires_special_handling", False)