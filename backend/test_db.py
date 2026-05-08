"""
Test database connection script
Run this before starting the main application
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def test_connection():
    print("🔍 Testing PostgreSQL connection...")
    print(f"📍 Database URL: {settings.DATABASE_URL.replace(settings.DATABASE_URL.split('@')[0].split('//')[1], '****')}")
    
    try:
        # Create engine
        engine = create_engine(settings.DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ Connection successful!")
            print(f"📊 PostgreSQL version: {version[:50]}...")
            
            # Check database
            result = conn.execute(text("SELECT current_database();"))
            db_name = result.fetchone()[0]
            print(f"🗄️  Connected to database: {db_name}")
            
        engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed!")
        print(f"Error: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("1. Check if PostgreSQL service is running")
        print("2. Verify database credentials in .env file")
        print("3. Ensure database 'compulysis_db' exists")
        print("4. Check if PostgreSQL is listening on port 5432")
        return False

if __name__ == "__main__":
    test_connection()