from datetime import date
from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from app.db.base_class import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    psychologist_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    education = Column(String(255), nullable=True)
    last_assessment = Column(Date, nullable=True)
    risk_level = Column(String(50), nullable=True)
    risk_score = Column(Numeric(5, 2), nullable=True)
    total_assessments = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="Active", nullable=False)
    created_at = Column(Date, default=date.today, nullable=False)
