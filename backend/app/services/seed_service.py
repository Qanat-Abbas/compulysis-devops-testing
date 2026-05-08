from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.core.security import get_password_hash


SEED_PATIENTS = [
    {
        "psychologist_id": 1,
        "name": "John Anderson",
        "age": 28,
        "gender": "Male",
        "email": "john.anderson@email.com",
        "phone": "+92-300-1234567",
        "education": "Bachelor",
        "last_assessment": datetime(2025, 5, 25).date(),
        "risk_level": "High",
        "risk_score": 1.8,
        "total_assessments": 3,
        "status": "Active",
    },
    {
        "psychologist_id": 1,
        "name": "Sarah Williams",
        "age": 34,
        "gender": "Female",
        "email": "sarah.w@email.com",
        "phone": "+92-300-2345678",
        "education": "Master",
        "last_assessment": datetime(2025, 5, 28).date(),
        "risk_level": "Low",
        "risk_score": 0.4,
        "total_assessments": 2,
        "status": "Active",
    },
    {
        "psychologist_id": 1,
        "name": "Michael Brown",
        "age": 42,
        "gender": "Male",
        "email": "michael.b@email.com",
        "phone": "+92-300-3456789",
        "education": "PhD",
        "last_assessment": datetime(2025, 5, 20).date(),
        "risk_level": "Moderate",
        "risk_score": 1.2,
        "total_assessments": 5,
        "status": "Active",
    },
    {
        "psychologist_id": 1,
        "name": "Emily Davis",
        "age": 25,
        "gender": "Female",
        "email": "emily.d@email.com",
        "phone": "+92-300-4567890",
        "education": "Bachelor",
        "last_assessment": datetime(2025, 5, 27).date(),
        "risk_level": "High",
        "risk_score": 1.9,
        "total_assessments": 4,
        "status": "Active",
    },
    {
        "psychologist_id": 1,
        "name": "David Martinez",
        "age": 31,
        "gender": "Male",
        "email": "david.m@email.com",
        "phone": "+92-300-5678901",
        "education": "Master",
        "last_assessment": datetime(2025, 5, 15).date(),
        "risk_level": "Low",
        "risk_score": 0.6,
        "total_assessments": 2,
        "status": "Active",
    },
    {
        "psychologist_id": 2,
        "name": "Lisa Thompson",
        "age": 29,
        "gender": "Female",
        "email": "lisa.t@email.com",
        "phone": "+92-300-6789012",
        "education": "Bachelor",
        "last_assessment": datetime(2025, 5, 26).date(),
        "risk_level": "Moderate",
        "risk_score": 1.3,
        "total_assessments": 3,
        "status": "Active",
    },
    {
        "psychologist_id": 2,
        "name": "James Wilson",
        "age": 37,
        "gender": "Male",
        "email": "james.w@email.com",
        "phone": "+92-300-7890123",
        "education": "Master",
        "last_assessment": datetime(2025, 5, 22).date(),
        "risk_level": "Low",
        "risk_score": 0.5,
        "total_assessments": 1,
        "status": "Active",
    },
]


def seed_initial_data(db: Session) -> None:
    if db.query(User).count() == 0:
        user1 = User(
            email="psychologist@compulysis.com",
            hashed_password=get_password_hash("password123"),
            name="Dr. Tayyaba Hanif",
            role="psychologist",
            license_number=None,
            specialization="Clinical Psychology",
            institution="",
            is_active=True,
        )
        user2 = User(
            email="dr.mike@compulysis.com",
            hashed_password=get_password_hash("password123"),
            name="Dr. Michael Chen",
            role="psychologist",
            license_number="PSY-67890",
            specialization="Psychiatry",
            institution="Mental Health Center",
            is_active=True,
        )
        db.add_all([user1, user2])
        db.commit()

    psychologists = (
        db.query(User)
        .filter(User.role == "psychologist")
        .order_by(User.id.asc())
        .all()
    )
    if not psychologists:
        fallback_user = User(
            email="psychologist@compulysis.com",
            hashed_password=get_password_hash("password123"),
            name="Dr. Default Psychologist",
            role="psychologist",
            license_number=None,
            specialization="Clinical Psychology",
            institution="",
            is_active=True,
        )
        db.add(fallback_user)
        db.commit()
        db.refresh(fallback_user)
        psychologists = [fallback_user]

    seed_psych_ids = sorted({patient["psychologist_id"] for patient in SEED_PATIENTS})
    mapped_ids = {
        seed_id: psychologists[min(index, len(psychologists) - 1)].id
        for index, seed_id in enumerate(seed_psych_ids)
    }

    if db.query(Patient).count() == 0:
        patients_to_insert = []
        for patient in SEED_PATIENTS:
            payload = dict(patient)
            payload["psychologist_id"] = mapped_ids.get(
                patient["psychologist_id"], psychologists[0].id
            )
            patients_to_insert.append(Patient(**payload))
        db.add_all(patients_to_insert)
        db.commit()

    if db.query(Assessment).count() == 0:
        patients = db.query(Patient).order_by(Patient.id.asc()).limit(6).all()
        sample_responses = {
            "Contamination_and_Washing": 3,
            "Checking_Behavior": 2,
            "Ordering_Symmetry": 2,
            "Hoarding_Collecting": 1,
            "Intrusive_Thoughts": 3,
            "Mental_Compulsions_and_Rituals": 2,
            "Avoidance_Behavior": 2,
            "Emotional_Awareness_and_Insights": 1,
            "Functioning_Behavior": 3,
        }

        for idx, patient in enumerate(patients, start=1):
            prediction = idx % 3
            if prediction == 2:
                proba = [0.1, 0.2, 0.7]
                total_score = 26
            elif prediction == 1:
                proba = [0.2, 0.6, 0.2]
                total_score = 18
            else:
                proba = [0.7, 0.2, 0.1]
                total_score = 9

            avg_score = round(total_score / 9, 2)
            assessment = Assessment(
                patient_id=patient.id,
                psychologist_id=patient.psychologist_id,
                assessment_date=datetime.utcnow() - timedelta(days=idx * 3),
                demographics={
                    "age": patient.age,
                    "gender": patient.gender,
                    "education": patient.education,
                },
                responses=sample_responses,
                prediction=prediction,
                prediction_proba=proba,
                total_score=total_score,
                avg_score=avg_score,
                model_used="Logistic Regression",
                model_accuracy=95.83,
                reviewed=(idx % 2 == 0),
                clinical_notes="Seeded assessment for initial dashboard/reporting",
            )
            db.add(assessment)
            db.flush()
            assessment.report_id = f"RPT-{str(assessment.id).zfill(6)}"

        db.commit()
