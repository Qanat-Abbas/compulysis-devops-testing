from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Boolean, ForeignKey, JSON, Text
from app.db.base_class import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(50), unique=True, index=True, nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="SET NULL"), nullable=True, index=True)
    psychologist_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    demographics = Column(JSON, nullable=False)
    responses = Column(JSON, nullable=False)
    prediction = Column(Integer, nullable=False)
    prediction_proba = Column(JSON, nullable=False)
    total_score = Column(Integer, nullable=False)
    avg_score = Column(Numeric(5, 2), nullable=False)
    model_used = Column(String(255), nullable=False, default="Logistic Regression")
    model_accuracy = Column(Numeric(5, 2), nullable=False, default=95.83)
    reviewed = Column(Boolean, default=False, nullable=False)
    clinical_notes = Column(Text, nullable=True)
