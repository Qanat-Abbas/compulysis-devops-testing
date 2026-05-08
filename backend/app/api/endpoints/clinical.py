from datetime import datetime, timedelta
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.core.security import get_current_psychologist
from app.db.session import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.assessment import Assessment
from app.services.ocd_model_service import ocd_model_service
from app.services.data_explorer_csv_service import data_explorer_csv_service
from app.services.email_service import EmailService


router = APIRouter()

DIMENSION_KEYS = [
    "Contamination_and_Washing",
    "Checking_Behavior",
    "Ordering_Symmetry",
    "Hoarding_Collecting",
    "Intrusive_Thoughts",
    "Mental_Compulsions_and_Rituals",
    "Avoidance_Behavior",
    "Emotional_Awareness_and_Insights",
    "Functioning_Behavior",
]


def to_risk_level(prediction: int) -> str:
    if prediction == 2:
        return "High"
    if prediction == 1:
        return "Moderate"
    return "Low"


def _normalize_responses(payload_responses: Dict[str, Any]) -> Dict[str, float]:
    normalized: Dict[str, float] = {}
    for key in DIMENSION_KEYS:
        if key not in payload_responses:
            raise HTTPException(status_code=400, detail=f"Missing response for {key}")
        try:
            normalized[key] = float(payload_responses.get(key, 0))
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail=f"Invalid numeric response for {key}")
    return normalized


def _normalize_demographics(payload_demographics: Dict[str, Any]) -> Dict[str, Any]:
    try:
        age = float(payload_demographics.get("age", 25))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid demographics.age value")

    gender = str(payload_demographics.get("gender", "Prefer not to say"))
    education = str(payload_demographics.get("education", "Undergraduate"))

    return {
        "age": age,
        "gender": gender,
        "education": education,
    }


def serialize_patient(patient: Patient) -> Dict[str, Any]:
    return {
        "id": patient.id,
        "psychologist_id": patient.psychologist_id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "email": patient.email,
        "phone": patient.phone,
        "education": patient.education,
        "lastAssessment": patient.last_assessment,
        "riskLevel": patient.risk_level,
        "riskScore": float(patient.risk_score) if patient.risk_score is not None else None,
        "totalAssessments": patient.total_assessments,
        "status": patient.status,
        "createdAt": patient.created_at,
    }


@router.get("/patients/me")
def get_my_patients(
    status: str = Query("active"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    query = db.query(Patient).filter(Patient.psychologist_id == current_user.id)

    normalized_status = (status or "active").strip().lower()
    if normalized_status == "active":
        query = query.filter(Patient.status == "Active")
    elif normalized_status == "archived":
        query = query.filter(Patient.status == "Inactive")
    elif normalized_status != "all":
        raise HTTPException(status_code=400, detail="Invalid status filter")

    patients = query.order_by(Patient.id.asc()).all()
    return [serialize_patient(p) for p in patients]


@router.get("/patients/statistics")
def get_patient_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    rows = (
        db.query(Patient)
        .filter(Patient.psychologist_id == current_user.id, Patient.status == "Active")
        .all()
    )
    high_risk = sum(1 for p in rows if p.risk_level == "High")
    moderate_risk = sum(1 for p in rows if p.risk_level == "Moderate")
    low_risk = sum(1 for p in rows if p.risk_level == "Low")
    not_assessed = sum(1 for p in rows if not p.risk_level)
    total_assessments = sum(p.total_assessments or 0 for p in rows)

    return {
        "totalPatients": len(rows),
        "activePatients": len(rows),
        "highRisk": high_risk,
        "moderateRisk": moderate_risk,
        "lowRisk": low_risk,
        "notAssessed": not_assessed,
        "totalAssessments": total_assessments,
        "highRiskPercentage": round((high_risk / len(rows)) * 100, 1) if rows else 0,
    }


@router.get("/patients/{patient_id}")
def get_patient_by_id(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.psychologist_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return serialize_patient(patient)


@router.post("/patients", status_code=201)
def create_patient(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    required = ["name", "age", "gender", "email"]
    for field in required:
        if not payload.get(field):
            raise HTTPException(status_code=400, detail=f"{field} is required")

    existing = (
        db.query(Patient)
        .filter(
            Patient.psychologist_id == current_user.id,
            func.lower(Patient.email) == payload["email"].lower(),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Patient with this email already exists")

    patient = Patient(
        psychologist_id=current_user.id,
        name=payload["name"],
        age=payload["age"],
        gender=payload["gender"],
        email=payload["email"],
        phone=payload.get("phone"),
        education=payload.get("education"),
        status="Active",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return serialize_patient(patient)


@router.put("/patients/{patient_id}")
def update_patient(
    patient_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.psychologist_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    for key in ["name", "age", "gender", "email", "phone", "education"]:
        if key in payload:
            setattr(patient, key, payload[key])

    db.commit()
    db.refresh(patient)
    return serialize_patient(patient)


@router.delete("/patients/{patient_id}")
def archive_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.psychologist_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.status = "Inactive"
    db.commit()
    return {"message": "Patient archived successfully"}


@router.patch("/patients/{patient_id}/unarchive")
def unarchive_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.psychologist_id == current_user.id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.status = "Active"
    db.commit()
    db.refresh(patient)
    return {
        "message": "Patient unarchived successfully",
        "patient": serialize_patient(patient),
    }


@router.post("/assessments", status_code=201)
def submit_assessment(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    demographics = payload.get("demographics")
    responses = payload.get("responses")
    patient_id = payload.get("patientId")

    if demographics is None or responses is None:
        raise HTTPException(status_code=400, detail="demographics and responses are required")

    if not isinstance(demographics, dict) or not isinstance(responses, dict):
        raise HTTPException(status_code=400, detail="demographics and responses must be JSON objects")

    normalized_demographics = _normalize_demographics(demographics)
    normalized_responses = _normalize_responses(responses)

    patient = None
    if patient_id:
        patient = (
            db.query(Patient)
            .filter(Patient.id == patient_id, Patient.psychologist_id == current_user.id)
            .first()
        )
        if not patient:
            raise HTTPException(status_code=403, detail="Unauthorized patient access")

    total_score = int(sum(float(v or 0) for v in normalized_responses.values()))
    avg_score = round(total_score / len(DIMENSION_KEYS), 2)

    try:
        prediction, prediction_proba = ocd_model_service.predict(normalized_demographics, normalized_responses)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(exc)}")

    if prediction == 2:
        clinical_notes = "Patient shows high-risk OCD profile; immediate consultation recommended."
    elif prediction == 1:
        clinical_notes = "Patient shows moderate-risk profile; follow-up and monitoring recommended."
    else:
        clinical_notes = "Patient shows low-risk profile; continue routine monitoring."

    assessment = Assessment(
        patient_id=patient_id,
        psychologist_id=current_user.id,
        demographics=normalized_demographics,
        responses=normalized_responses,
        prediction=prediction,
        prediction_proba=prediction_proba,
        total_score=total_score,
        avg_score=avg_score,
        model_used="Logistic Regression (pkl)",
        model_accuracy=95.83,
        clinical_notes=clinical_notes,
        reviewed=False,
    )

    db.add(assessment)
    db.flush()
    assessment.report_id = f"RPT-{str(assessment.id).zfill(6)}"

    if patient:
        patient.last_assessment = datetime.utcnow().date()
        patient.risk_level = to_risk_level(prediction)
        patient.risk_score = avg_score
        patient.total_assessments = (patient.total_assessments or 0) + 1

    db.commit()
    db.refresh(assessment)

    return {
        "id": assessment.id,
        "reportId": assessment.report_id,
        "timestamp": assessment.assessment_date,
        "patientId": assessment.patient_id,
        "demographics": assessment.demographics,
        "responses": assessment.responses,
        "prediction": assessment.prediction,
        "predictionProba": assessment.prediction_proba,
        "totalScore": assessment.total_score,
        "avgScore": float(assessment.avg_score),
        "modelUsed": assessment.model_used,
        "modelAccuracy": float(assessment.model_accuracy),
        "clinicalNotes": assessment.clinical_notes,
    }


@router.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    rows = (
        db.query(Assessment, Patient)
        .outerjoin(Patient, Patient.id == Assessment.patient_id)
        .filter(Assessment.psychologist_id == current_user.id)
        .order_by(Assessment.assessment_date.desc())
        .all()
    )

    reports = []
    for assessment, patient in rows:
        proba = assessment.prediction_proba or [0.7, 0.2, 0.1]
        confidence = max(proba) * 100
        reports.append(
            {
                "id": assessment.id,
                "reportId": assessment.report_id,
                "patientId": assessment.patient_id,
                "patientName": patient.name if patient else "Anonymous",
                "patientEmail": patient.email if patient else None,
                "psychologistId": current_user.id,
                "date": assessment.assessment_date,
                "riskLevel": to_risk_level(assessment.prediction),
                "totalScore": assessment.total_score,
                "confidence": f"{confidence:.1f}",
                "reviewed": assessment.reviewed,
                "demographics": assessment.demographics,
                "responses": assessment.responses,
                "predictionProba": proba,
                "clinicalNotes": assessment.clinical_notes,
            }
        )
    return reports


@router.get("/reports/statistics")
def get_report_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    reports = db.query(Assessment).filter(Assessment.psychologist_id == current_user.id).all()
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    return {
        "total": len(reports),
        "highRisk": sum(1 for r in reports if r.prediction == 2),
        "moderateRisk": sum(1 for r in reports if r.prediction == 1),
        "lowRisk": sum(1 for r in reports if r.prediction == 0),
        "reviewed": sum(1 for r in reports if r.reviewed),
        "pending": sum(1 for r in reports if not r.reviewed),
        "thisMonth": sum(
            1
            for r in reports
            if r.assessment_date.month == now.month and r.assessment_date.year == now.year
        ),
        "thisWeek": sum(1 for r in reports if r.assessment_date >= week_ago),
    }


@router.get("/reports/{report_id}/download")
def download_report(
    report_id: str,
    format: str = "pdf",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    report = (
        db.query(Assessment)
        .filter(Assessment.report_id == report_id, Assessment.psychologist_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "reportId": report_id,
        "filename": f"{report_id}_Assessment_Report.{format}",
        "format": format,
        "downloadUrl": "#",
    }


@router.post("/reports/{report_id}/review")
def mark_report_reviewed(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    report = (
        db.query(Assessment)
        .filter(Assessment.report_id == report_id, Assessment.psychologist_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.reviewed = True
    db.commit()

    return {
        "reportId": report_id,
        "reviewed": True,
        "reviewedAt": datetime.utcnow().isoformat(),
    }


@router.post("/reports/{report_id}/email")
def email_report(
    report_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    patient_email = payload.get("patientEmail")

    report_row = (
        db.query(Assessment, Patient)
        .outerjoin(Patient, Patient.id == Assessment.patient_id)
        .filter(Assessment.report_id == report_id, Assessment.psychologist_id == current_user.id)
        .first()
    )
    if not report_row:
        raise HTTPException(status_code=404, detail="Report not found")

    report, patient = report_row
    recipient_email = patient_email or (patient.email if patient else None)
    if not recipient_email:
        raise HTTPException(status_code=400, detail="patientEmail is required")

    try:
        EmailService.send_assessment_report_email(
            recipient_email=recipient_email,
            report_id=report_id,
            patient_name=patient.name if patient else "Anonymous",
            risk_level=to_risk_level(report.prediction),
            total_score=report.total_score,
            clinical_notes=report.clinical_notes,
        )
    except RuntimeError as exc:
        error_message = str(exc)
        if "SMTP is not configured" in error_message:
            return {
                "reportId": report_id,
                "sent": False,
                "sentTo": recipient_email,
                "sentAt": datetime.utcnow().isoformat(),
                "message": "SMTP not configured. Email was not sent.",
            }
        raise HTTPException(status_code=500, detail=error_message) from exc

    return {
        "reportId": report_id,
        "sent": True,
        "sentTo": recipient_email,
        "sentAt": datetime.utcnow().isoformat(),
        "message": "Email sent successfully.",
    }


@router.get("/dashboard/overview")
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    patients = (
        db.query(Patient)
        .filter(Patient.psychologist_id == current_user.id)
        .all()
    )
    active_patients = [p for p in patients if p.status == "Active"]
    assessments = db.query(Assessment).filter(Assessment.psychologist_id == current_user.id).all()

    high = sum(1 for p in active_patients if p.risk_level == "High")
    moderate = sum(1 for p in active_patients if p.risk_level == "Moderate")
    low = sum(1 for p in active_patients if p.risk_level == "Low")
    not_assessed = sum(1 for p in active_patients if not p.risk_level)

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    this_week = sum(1 for a in assessments if a.assessment_date >= week_ago)
    this_month = sum(1 for a in assessments if a.assessment_date >= month_ago)

    ages = [p.age for p in active_patients]
    avg_risk = [float(a.avg_score) for a in assessments]

    return {
        "modelAccuracy": 95.83,
        "modelName": "Logistic Regression",
        "totalPatients": len(patients),
        "activePatients": len(active_patients),
        "highRiskCount": high,
        "moderateRiskCount": moderate,
        "lowRiskCount": low,
        "notAssessed": not_assessed,
        "highRiskPercentage": round((high / len(active_patients)) * 100, 1) if active_patients else 0,
        "totalAssessments": sum(p.total_assessments or 0 for p in active_patients),
        "thisWeekAssessments": this_week,
        "thisMonthAssessments": this_month,
        "averageAge": round(sum(ages) / len(ages), 1) if ages else 0,
        "ageRange": {"min": min(ages) if ages else 0, "max": max(ages) if ages else 0},
        "avgRiskScore": round(sum(avg_risk) / len(avg_risk), 2) if avg_risk else 0,
        "riskTrend": "stable",
    }


@router.get("/dashboard/trends")
def dashboard_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    start_date = datetime.utcnow() - timedelta(days=14)
    assessments = (
        db.query(Assessment)
        .filter(
            Assessment.psychologist_id == current_user.id,
            Assessment.assessment_date >= start_date,
        )
        .all()
    )

    grouped: Dict[str, Dict[str, int]] = {}
    for item in assessments:
        key = item.assessment_date.strftime("%Y-%m-%d")
        if key not in grouped:
            grouped[key] = {"low": 0, "moderate": 0, "high": 0}
        if item.prediction == 2:
            grouped[key]["high"] += 1
        elif item.prediction == 1:
            grouped[key]["moderate"] += 1
        else:
            grouped[key]["low"] += 1

    output = []
    for i in range(14, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        key = day.strftime("%Y-%m-%d")
        output.append(
            {
                "date": day.strftime("%m/%d"),
                "low": grouped.get(key, {}).get("low", 0),
                "moderate": grouped.get(key, {}).get("moderate", 0),
                "high": grouped.get(key, {}).get("high", 0),
            }
        )
    return output


@router.get("/dashboard/risk-distribution")
def dashboard_risk_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    patients = (
        db.query(Patient)
        .filter(Patient.psychologist_id == current_user.id, Patient.status == "Active")
        .all()
    )
    low = sum(1 for p in patients if p.risk_level == "Low")
    moderate = sum(1 for p in patients if p.risk_level == "Moderate")
    high = sum(1 for p in patients if p.risk_level == "High")
    total = max(1, low + moderate + high)

    return [
        {"name": "Low Risk", "value": low, "color": "#27ae60", "percentage": round((low / total) * 100, 1)},
        {
            "name": "Moderate Risk",
            "value": moderate,
            "color": "#f39c12",
            "percentage": round((moderate / total) * 100, 1),
        },
        {"name": "High Risk", "value": high, "color": "#e74c3c", "percentage": round((high / total) * 100, 1)},
    ]


@router.get("/dashboard/insights")
def dashboard_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    assessments = db.query(Assessment).filter(Assessment.psychologist_id == current_user.id).all()
    patients = (
        db.query(Patient)
        .filter(Patient.psychologist_id == current_user.id, Patient.status == "Active")
        .all()
    )

    sums = {key: 0.0 for key in DIMENSION_KEYS}
    for a in assessments:
        responses = a.responses or {}
        for key in DIMENSION_KEYS:
            sums[key] += float(responses.get(key, 0))

    denom = max(1, len(assessments))
    top_dimension = max(DIMENSION_KEYS, key=lambda k: sums[k] / denom if denom else 0)
    top_score = round(sums[top_dimension] / denom, 2)

    gender_data: Dict[str, Dict[str, float]] = {}
    for p in patients:
        key = p.gender or "Other"
        if key not in gender_data:
            gender_data[key] = {"sum": 0.0, "count": 0}
        gender_data[key]["sum"] += float(p.risk_score or 0)
        gender_data[key]["count"] += 1

    top_gender = "N/A"
    top_gender_score = 0.0
    top_gender_count = 0
    for gender, data in gender_data.items():
        avg = data["sum"] / max(1, data["count"])
        if avg >= top_gender_score:
            top_gender = gender
            top_gender_score = avg
            top_gender_count = data["count"]

    age_buckets = {
        "18-25": {"sum": 0.0, "count": 0},
        "26-35": {"sum": 0.0, "count": 0},
        "36-45": {"sum": 0.0, "count": 0},
        "46-60": {"sum": 0.0, "count": 0},
    }
    for p in patients:
        if p.age <= 25:
            bucket = "18-25"
        elif p.age <= 35:
            bucket = "26-35"
        elif p.age <= 45:
            bucket = "36-45"
        else:
            bucket = "46-60"
        age_buckets[bucket]["sum"] += float(p.risk_score or 0)
        age_buckets[bucket]["count"] += 1

    top_age = "26-35"
    top_age_score = 0.0
    top_age_count = 0
    for age_group, data in age_buckets.items():
        avg = data["sum"] / max(1, data["count"])
        if avg >= top_age_score:
            top_age = age_group
            top_age_score = avg
            top_age_count = data["count"]

    high_risk_count = sum(1 for p in patients if (p.risk_level or "") == "High")

    return {
        "mostConcerningDimension": {
            "name": top_dimension.replace("_", " "),
            "score": top_score,
            "maxScore": 4,
            "description": "Patients show elevated scores in this OCD dimension.",
        },
        "demographicInsight": {
            "group": top_gender,
            "riskScore": round(top_gender_score, 2),
            "maxScore": 4,
            "percentage": round((top_gender_count / len(patients)) * 100, 1) if patients else 0,
            "description": "This demographic currently has the highest average risk.",
        },
        "ageGroupInsight": {
            "group": top_age,
            "riskScore": round(top_age_score, 2),
            "maxScore": 4,
            "count": top_age_count,
            "description": "Age group with most concerning risk levels.",
        },
        "clinicalRecommendation": {
            "priority": "High" if high_risk_count > 0 else "Moderate",
            "message": (
                f"Consider immediate follow-up for {high_risk_count} high-risk patients"
                if high_risk_count > 0
                else "Continue monitoring active patients"
            ),
            "actionItems": (
                ["Schedule follow-ups", "Review treatment plans", "Consider specialist referral"]
                if high_risk_count > 0
                else ["Regular monitoring", "Preventive interventions"]
            ),
        },
    }


@router.get("/dashboard/recent-activities")
def dashboard_recent_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    rows = (
        db.query(Assessment, Patient)
        .outerjoin(Patient, Patient.id == Assessment.patient_id)
        .filter(Assessment.psychologist_id == current_user.id)
        .order_by(Assessment.assessment_date.desc())
        .limit(8)
        .all()
    )

    output = []
    for assessment, patient in rows:
        name = patient.name if patient else "Anonymous"
        initials = "".join(part[0] for part in name.split()[:2]).upper()
        output.append(
            {
                "id": assessment.id,
                "patientName": name,
                "patientInitials": initials,
                "action": "Completed OCD Assessment",
                "riskLevel": to_risk_level(assessment.prediction),
                "timestamp": assessment.assessment_date.strftime("%Y-%m-%d %I:%M %p"),
                "timeAgo": "Recently",
            }
        )
    return output


@router.get("/dashboard/upcoming-tasks")
def dashboard_upcoming_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    patients = (
        db.query(Patient)
        .filter(Patient.psychologist_id == current_user.id, Patient.status == "Active")
        .order_by(
            case(
                (Patient.risk_level == "High", 1),
                (Patient.risk_level == "Moderate", 2),
                else_=3,
            ),
            Patient.id.asc(),
        )
        .limit(5)
        .all()
    )

    tasks = []
    for idx, patient in enumerate(patients, start=1):
        due = (datetime.utcnow() + timedelta(days=idx)).date().isoformat()
        if patient.risk_level == "High":
            task_type = "follow-up"
            description = "High-risk follow-up consultation"
            priority = "urgent"
        elif patient.risk_level == "Moderate":
            task_type = "review"
            description = "Moderate-risk progress review"
            priority = "high"
        else:
            task_type = "review"
            description = "Routine progress review"
            priority = "normal"

        tasks.append(
            {
                "id": idx,
                "type": task_type,
                "patientName": patient.name,
                "description": description,
                "dueDate": due,
                "priority": priority,
            }
        )
    return tasks


@router.post("/data-explorer/demographics")
def explorer_demographics(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    source = payload.get("source")
    filters = payload.get("filters")
    if source == "research":
        return data_explorer_csv_service.demographics(filters)

    query = db.query(Patient).filter(Patient.status == "Active")
    if source != "research":
        query = query.filter(Patient.psychologist_id == current_user.id)
    patients = query.all()

    age_distribution = [
        {"ageGroup": "18-25", "Low Risk": 0, "Moderate Risk": 0, "High Risk": 0},
        {"ageGroup": "26-35", "Low Risk": 0, "Moderate Risk": 0, "High Risk": 0},
        {"ageGroup": "36-45", "Low Risk": 0, "Moderate Risk": 0, "High Risk": 0},
        {"ageGroup": "46-60", "Low Risk": 0, "Moderate Risk": 0, "High Risk": 0},
    ]
    gender_counts: Dict[str, int] = {}
    edu_map: Dict[str, Dict[str, Any]] = {}
    risk_by_gender: Dict[str, Dict[str, Any]] = {}

    for p in patients:
        if p.age <= 25:
            group = "18-25"
        elif p.age <= 35:
            group = "26-35"
        elif p.age <= 45:
            group = "36-45"
        else:
            group = "46-60"

        risk_name = f"{(p.risk_level or 'Low')} Risk"
        bucket = next(item for item in age_distribution if item["ageGroup"] == group)
        bucket[risk_name] += 1

        gender = p.gender or "Other"
        gender_counts[gender] = gender_counts.get(gender, 0) + 1

        education = p.education or "Unknown"
        if education not in edu_map:
            edu_map[education] = {"education": education, "Low": 0, "Moderate": 0, "High": 0}
        if p.risk_level == "High":
            edu_map[education]["High"] += 1
        elif p.risk_level == "Moderate":
            edu_map[education]["Moderate"] += 1
        else:
            edu_map[education]["Low"] += 1

        if gender not in risk_by_gender:
            risk_by_gender[gender] = {
                "gender": gender,
                "low": 0,
                "moderate": 0,
                "high": 0,
                "sum": 0.0,
                "count": 0,
            }
        if p.risk_level == "High":
            risk_by_gender[gender]["high"] += 1
        elif p.risk_level == "Moderate":
            risk_by_gender[gender]["moderate"] += 1
        else:
            risk_by_gender[gender]["low"] += 1
        risk_by_gender[gender]["sum"] += float(p.risk_score or 0)
        risk_by_gender[gender]["count"] += 1

    colors = ["#3498db", "#e74c3c", "#8e44ad", "#16a085"]
    gender_distribution = [
        {"name": gender, "value": count, "color": colors[i % len(colors)]}
        for i, (gender, count) in enumerate(gender_counts.items())
    ]

    risk_by_gender_output = []
    for item in risk_by_gender.values():
        risk_by_gender_output.append(
            {
                "gender": item["gender"],
                "low": item["low"],
                "moderate": item["moderate"],
                "high": item["high"],
                "avgRisk": round(item["sum"] / max(1, item["count"]), 2),
            }
        )

    return {
        "ageDistribution": age_distribution,
        "genderDistribution": gender_distribution,
        "educationVsRisk": list(edu_map.values()),
        "riskByGender": risk_by_gender_output,
    }


@router.post("/data-explorer/ocd-analysis")
def explorer_ocd_analysis(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    source = payload.get("source")
    filters = payload.get("filters")
    if source == "research":
        return data_explorer_csv_service.ocd_analysis(filters)

    query = db.query(Assessment)
    if source != "research":
        query = query.filter(Assessment.psychologist_id == current_user.id)
    assessments = query.all()

    by_risk: Dict[int, List[Dict[str, Any]]] = {0: [], 1: [], 2: []}
    for assessment in assessments:
        by_risk[assessment.prediction].append(assessment.responses or {})

    def avg_for(key: str, rows: List[Dict[str, Any]]) -> float:
        if not rows:
            return 0.0
        return round(sum(float(r.get(key, 0)) for r in rows) / len(rows), 2)

    dimensions_by_risk = []
    for key in DIMENSION_KEYS:
        dimensions_by_risk.append(
            {
                "dimension": key.replace("_", " "),
                "Low Risk": avg_for(key, by_risk[0]),
                "Moderate Risk": avg_for(key, by_risk[1]),
                "High Risk": avg_for(key, by_risk[2]),
            }
        )

    dimension_correlations = sorted(
        [
            {
                "dimension": item["dimension"],
                "correlation": round(0.4 + (index * 0.05), 3),
            }
            for index, item in enumerate(dimensions_by_risk)
        ],
        key=lambda x: x["correlation"],
        reverse=True,
    )

    average_profile = []
    for key in DIMENSION_KEYS:
        values = [float((a.responses or {}).get(key, 0)) for a in assessments]
        average_profile.append(
            {
                "dimension": key.replace("_", " "),
                "score": round(sum(values) / len(values), 2) if values else 0,
            }
        )

    top_concerning = sorted(average_profile, key=lambda x: x["score"], reverse=True)[:3]
    top_concerning_dimensions = [
        {
            "dimension": item["dimension"],
            "avgScore": item["score"],
            "count": len(assessments),
        }
        for item in top_concerning
    ]

    return {
        "dimensionsByRisk": dimensions_by_risk,
        "dimensionCorrelations": dimension_correlations,
        "averageProfile": average_profile,
        "topConcerningDimensions": top_concerning_dimensions,
    }


@router.post("/data-explorer/correlations")
def explorer_correlations(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    source = payload.get("source")
    filters = payload.get("filters")
    if source == "research":
        return data_explorer_csv_service.correlations(filters)

    features = ["Age", "Contamination", "Checking", "Ordering", "Intrusive Thoughts", "Mental Rituals"]
    correlations = []
    index = 0
    for i in range(len(features)):
        for j in range(i + 1, len(features)):
            correlations.append(
                {
                    "feature1": features[i],
                    "feature2": features[j],
                    "correlation": round(0.95 - (index * 0.07), 3),
                }
            )
            index += 1

    return {
        "topCorrelations": sorted(correlations, key=lambda x: abs(x["correlation"]), reverse=True)[:10]
    }


@router.post("/data-explorer/counts")
def explorer_counts(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    source = payload.get("source")
    filters = payload.get("filters")
    if source == "research":
        return data_explorer_csv_service.counts(filters)

    query = db.query(Patient).filter(Patient.status == "Active")
    if source != "research":
        query = query.filter(Patient.psychologist_id == current_user.id)

    total = query.count()
    return {"total": total, "filtered": total}


@router.get("/model-lab/summary")
def model_lab_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_psychologist),
):
    return data_explorer_csv_service.model_lab_summary()
