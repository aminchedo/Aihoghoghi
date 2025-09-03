#!/usr/bin/env python3
"""
Demo Script for Legal Database System
Demonstrates the functionality with sample data including نفقه definition
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone

# Setup paths and imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from legal_database import LegalDatabase, EnhancedLegalAnalyzer, LegalDocument

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_sample_legal_documents():
    """Create sample legal documents for demonstration"""
    
    sample_documents = [
        LegalDocument(
            source="مجلس شورای اسلامی",
            url="https://rc.majlis.ir/fa/law/show/139030",
            title="قانون حمایت از حقوق کودکان و نوجوانان",
            content="""
            ماده ۱ - این قانون به منظور حمایت از حقوق کودکان و نوجوانان و تأمین مصالح آنان وضع شده است.
            
            ماده ۲ - در این قانون اصطلاحات زیر در معانی مقرر تعریف می‌شوند:
            الف) کودک: شخصی که سن او از هجده سال تمام کمتر باشد.
            ب) نوجوان: شخصی که سن او از دوازده سال تمام بیشتر و از هجده سال تمام کمتر باشد.
            
            ماده ۳ - والدین موظفند نفقه فرزندان خود را تا سن رشد تأمین نمایند.
            """,
            category="قانون",
            reliability_score=0.98
        ),
        
        LegalDocument(
            source="کانون وکلای دادگستری",
            url="https://icbar.ir/fa/legal/nafaqe-comprehensive",
            title="تعریف جامع نفقه در حقوق خانواده ایران",
            content="""
            نفقه در اصطلاح حقوقی عبارت است از مخارجی که شوهر موظف به تأمین آن برای همسر و فرزندان خود می‌باشد.
            
            بر اساس ماده ۱۱۰۶ قانون مدنی ایران: "زن در برابر تمکین، حق نفقه دارد و شوهر موظف است 
            معیشت او را بر حسب وسع و توان خود تأمین کند."
            
            انواع نفقه:
            ۱- نفقه زوجه: نفقه‌ای که شوهر باید به همسر خود بپردازد
            ۲- نفقه اطفال: نفقه‌ای که والدین موظف به پرداخت آن برای فرزندان خود هستند
            ۳- نفقه والدین: نفقه‌ای که فرزندان موظف به پرداخت آن برای والدین خود هستند
            
            شرایط استحقاق نفقه زوجه:
            - تمکین زوجه از زوج
            - عدم ناشزه بودن زوجه  
            - عقد صحیح بین زوجین
            - عدم مانع شرعی یا قانونی
            
            در صورت امتناع شوهر از پرداخت نفقه، زوجه می‌تواند به دادگاه مراجعه کرده و 
            درخواست الزام شوهر به پرداخت نفقه و حتی طلاق به علت عدم پرداخت نفقه را نماید.
            
            میزان نفقه بر اساس موارد زیر تعیین می‌گردد:
            - وضعیت مالی و اجتماعی شوهر
            - عرف محل سکونت
            - نیازهای واقعی همسر
            - شرایط اقتصادی جامعه
            
            نفقه شامل موارد زیر است:
            ۱- خوراک متناسب با وضعیت اجتماعی
            ۲- پوشاک مناسب فصل و محل
            ۳- مسکن متناسب با شأن خانوادگی
            ۴- هزینه‌های درمان و بهداشت
            ۵- سایر ضروریات زندگی
            
            مراجع قانونی:
            - ماده ۱۱۰۶ قانون مدنی
            - ماده ۱۱۰۷ قانون مدنی
            - ماده ۱۱۰۸ قانون مدنی
            - آرای وحدت رویه دیوان عالی کشور
            """,
            category="نفقه_و_حقوق_خانواده",
            reliability_score=0.90
        ),
        
        LegalDocument(
            source="قوه قضاییه",
            url="https://www.judiciary.ir/fa/verdict/nafaqe-case-123",
            title="دادنامه الزام به پرداخت نفقه - شعبه ۱۰۵ دادگاه خانواده تهران",
            content="""
            دادنامه شماره ۱۴۰۳۰۹۸۵۰۹۹۸۰۰۱۲۳
            
            خواهان: خانم فاطمه احمدی
            خوانده: آقای محمد رضایی
            
            موضوع: الزام به پرداخت نفقه معوقه و جاری
            
            با توجه به اینکه زوجه خواهان در برابر تمکین از زوج، حق نفقه دارد و طبق ماده ۱۱۰۶ 
            قانون مدنی، شوهر موظف است معیشت همسر خود را تأمین نماید.
            
            نظر به اینکه خوانده از پرداخت نفقه همسر خود امتناع نموده و مبلغ نفقه ماهانه 
            با در نظر گیری وضعیت مالی خوانده و عرف منطقه مبلغ ۱۰,۰۰۰,۰۰۰ ریال تعیین می‌گردد.
            
            رای دادگاه:
            ۱- خوانده محکوم است به پرداخت مبلغ ۶۰,۰۰۰,۰۰۰ ریال بابت نفقه معوقه شش ماه گذشته
            ۲- خوانده محکوم است به پرداخت نفقه ماهانه ۱۰,۰۰۰,۰۰۰ ریال از تاریخ رای
            ۳- در صورت تأخیر در پرداخت، خوانده متحمل خسارت تأخیر خواهد بود
            
            این رای ظرف ۲۰ روز قابل تجدیدنظر در دادگاه تجدیدنظر استان تهران می‌باشد.
            """,
            category="دادنامه",
            reliability_score=0.95
        ),
        
        LegalDocument(
            source="پورتال ملی قوانین",
            url="https://dotic.ir/portal/law/civil-code-1106",
            title="ماده ۱۱۰۶ قانون مدنی - حق نفقه زوجه",
            content="""
            ماده ۱۱۰۶ - زن در برابر تمکین، حق نفقه دارد و شوهر موظف است معیشت او را 
            بر حسب وسع و توان خود تأمین کند.
            
            شرح ماده:
            این ماده یکی از مهم‌ترین مواد قانون مدنی در زمینه حقوق زن در خانواده محسوب می‌شود.
            
            عناصر اصلی این ماده:
            ۱- تمکین زوجه: زوجه باید از شوهر تمکین کند
            ۲- حق نفقه: در قبال تمکین، زوجه حق نفقه دارد
            ۳- تعهد شوهر: شوهر موظف به تأمین معیشت همسر است
            ۴- معیار توان: میزان نفقه بر اساس وسع و توان شوهر تعیین می‌شود
            
            نکات مهم:
            - نفقه حق مسلم زوجه است و قابل اسقاط نیست
            - عدم تمکین موجب سقوط حق نفقه می‌شود
            - نفقه شامل تمامی ضروریات زندگی است
            - میزان نفقه با تغییر شرایط قابل تغییر است
            """,
            category="قانون",
            reliability_score=0.96
        )
    ]
    
    return sample_documents

def run_demo():
    """Run legal database demonstration"""
    print("🏛️ Iranian Legal Archive - Legal Database Demo")
    print("=" * 60)
    print(f"📅 Demo Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} CEST")
    print()
    
    try:
        # Initialize systems
        print("🔧 Initializing legal database system...")
        legal_db = LegalDatabase("demo_legal_archive.db")
        legal_analyzer = EnhancedLegalAnalyzer()
        legal_analyzer.set_legal_database(legal_db)
        
        # Create sample documents
        print("📝 Creating sample legal documents...")
        sample_docs = create_sample_legal_documents()
        
        # Insert and analyze documents
        print("🧠 Inserting and analyzing documents...")
        for doc in sample_docs:
            # Analyze document
            analysis = legal_analyzer.analyze_legal_document(
                doc.content,
                doc.title,
                doc.source
            )
            doc.analysis = json.dumps(analysis, ensure_ascii=False)
            
            # Insert into database
            success = legal_db.insert_legal_document(doc)
            if success:
                print(f"✅ Inserted: {doc.title[:50]}...")
            else:
                print(f"⚠️ Duplicate: {doc.title[:50]}...")
        
        # Demonstrate search functionality
        print("\n🔍 Testing search functionality...")
        
        # Search for نفقه
        print("\n📖 Searching for 'نفقه':")
        nafaqe_results = legal_db.search_documents("نفقه")
        print(f"   Found {len(nafaqe_results)} documents about نفقه")
        
        for doc in nafaqe_results[:2]:  # Show first 2
            print(f"   📄 {doc['title']}")
            print(f"      Source: {doc['source']}")
            print(f"      Category: {doc['category']}")
            print(f"      URL: {doc['url']}")
            
            # Show analysis results
            if doc['analysis']:
                analysis = json.loads(doc['analysis'])
                key_terms = analysis.get('key_terms', [])
                nafaqe_terms = [term for term in key_terms if 'نفقه' in term.get('term', '')]
                if nafaqe_terms:
                    print(f"      نفقه mentions: {nafaqe_terms[0]['count']} times")
            print()
        
        # Get database statistics
        print("📊 Database Statistics:")
        stats = legal_db.get_database_stats()
        print(f"   Total Documents: {stats.get('total_documents', 0)}")
        print(f"   Sources: {list(stats.get('sources', {}).keys())}")
        print(f"   Categories: {list(stats.get('categories', {}).keys())}")
        
        # Show source breakdown
        if stats.get('sources'):
            print("\n   Documents by Source:")
            for source, count in stats['sources'].items():
                print(f"      {source}: {count} documents")
        
        # Show category breakdown  
        if stats.get('categories'):
            print("\n   Documents by Category:")
            for category, count in stats['categories'].items():
                print(f"      {category}: {count} documents")
        
        print("\n✅ Demo completed successfully!")
        print(f"📁 Database file: demo_legal_archive.db")
        print("🌐 You can now run the web server to see the results in the UI")
        
    except Exception as e:
        logger.error(f"Demo failed: {e}")
        print(f"❌ Demo failed: {e}")

if __name__ == "__main__":
    run_demo()