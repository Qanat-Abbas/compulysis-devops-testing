"""
Script to create database tables
"""
from app.db.session import engine
from app.db.base_class import Base
from app.models.user import User  # Import all models
from app.models.patient import Patient
from app.models.assessment import Assessment

def create_tables():
    print("🔨 Creating database tables...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Tables created successfully!")
        print("\n📋 Created tables:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        return False

if __name__ == "__main__":
    create_tables()