from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score

from app.services.ocd_model_service import ocd_model_service


DIMENSION_COLUMNS = [
    "Contamination_and_Washing",
    "Checking_Behavior",
    "Ordering/Symmetry",
    "Hoarding/Collecting",
    "Intrusive_Thoughts",
    "Mental_Compulsions_and_Rituals",
    "Avoidance_Behavior",
    "Emotional_Awareness_and_Insights",
    "Functioning_Behavior",
]


def _risk_label(value: Any) -> str:
    try:
        target = int(float(value))
    except (TypeError, ValueError):
        target = 0

    if target >= 2:
        return "High"
    if target == 1:
        return "Moderate"
    return "Low"


def _age_group(age: float) -> str:
    if age <= 25:
        return "18-25"
    if age <= 35:
        return "26-35"
    if age <= 45:
        return "36-45"
    return "46-60"


@lru_cache(maxsize=1)
def _load_csv() -> pd.DataFrame:
    backend_dir = Path(__file__).resolve().parents[2]
    csv_path = backend_dir / "OCD_Prepared_Data.csv"
    data = pd.read_csv(csv_path)
    data["Age"] = pd.to_numeric(data["Age"], errors="coerce").fillna(0)
    data["has_ocd"] = pd.to_numeric(data.get("has_ocd", 0), errors="coerce").fillna(0).astype(int)
    data["risk_level"] = data["has_ocd"].apply(_risk_label)
    return data


class DataExplorerCsvService:
    def _apply_filters(self, filters: Dict[str, Any] | None) -> pd.DataFrame:
        data = _load_csv().copy()
        if not filters:
            return data

        age_range = filters.get("ageRange") or [18, 80]
        if isinstance(age_range, list) and len(age_range) == 2:
            min_age, max_age = age_range
            data = data[(data["Age"] >= float(min_age)) & (data["Age"] <= float(max_age))]

        genders = filters.get("genders") or []
        if genders:
            normalized = set(genders)
            if "Other" in normalized:
                normalized.add("Prefer not to say")
            data = data[data["Gender"].isin(normalized)]

        education_levels = filters.get("educationLevels") or []
        if education_levels:
            data = data[data["Current Education Level"].isin(education_levels)]

        return data

    def demographics(self, filters: Dict[str, Any] | None) -> Dict[str, Any]:
        data = self._apply_filters(filters)

        age_buckets = ["18-25", "26-35", "36-45", "46-60"]
        age_distribution = [
            {"ageGroup": bucket, "Low Risk": 0, "Moderate Risk": 0, "High Risk": 0}
            for bucket in age_buckets
        ]

        gender_counts: Dict[str, int] = {}
        edu_map: Dict[str, Dict[str, Any]] = {}
        risk_by_gender: Dict[str, Dict[str, Any]] = {}

        for _, row in data.iterrows():
            group = _age_group(float(row["Age"]))
            risk_level = row["risk_level"]
            bucket = next(item for item in age_distribution if item["ageGroup"] == group)
            bucket[f"{risk_level} Risk"] += 1

            gender = row.get("Gender") or "Other"
            gender_counts[gender] = gender_counts.get(gender, 0) + 1

            education = row.get("Current Education Level") or "Unknown"
            if education not in edu_map:
                edu_map[education] = {"education": education, "Low": 0, "Moderate": 0, "High": 0}
            edu_map[education][risk_level] += 1

            if gender not in risk_by_gender:
                risk_by_gender[gender] = {
                    "gender": gender,
                    "low": 0,
                    "moderate": 0,
                    "high": 0,
                    "sum": 0.0,
                    "count": 0,
                }

            if risk_level == "High":
                risk_by_gender[gender]["high"] += 1
            elif risk_level == "Moderate":
                risk_by_gender[gender]["moderate"] += 1
            else:
                risk_by_gender[gender]["low"] += 1

            risk_by_gender[gender]["sum"] += float(row.get("ocd_overall_score", 0))
            risk_by_gender[gender]["count"] += 1

        colors = ["#3498db", "#e74c3c", "#8e44ad", "#16a085"]
        gender_distribution = [
            {"name": gender, "value": count, "color": colors[i % len(colors)]}
            for i, (gender, count) in enumerate(gender_counts.items())
        ]

        risk_by_gender_output = [
            {
                "gender": item["gender"],
                "low": item["low"],
                "moderate": item["moderate"],
                "high": item["high"],
                "avgRisk": round(item["sum"] / max(1, item["count"]), 2),
            }
            for item in risk_by_gender.values()
        ]

        return {
            "ageDistribution": age_distribution,
            "genderDistribution": gender_distribution,
            "educationVsRisk": list(edu_map.values()),
            "riskByGender": risk_by_gender_output,
        }

    def ocd_analysis(self, filters: Dict[str, Any] | None) -> Dict[str, Any]:
        data = self._apply_filters(filters)

        by_risk: Dict[int, pd.DataFrame] = {
            0: data[data["has_ocd"] <= 0],
            1: data[data["has_ocd"] == 1],
            2: data[data["has_ocd"] >= 2],
        }

        dimensions_by_risk = []
        average_profile = []

        for key in DIMENSION_COLUMNS:
            label = key.replace("_", " ").replace("/", " ")
            low_val = round(float(by_risk[0][key].mean()), 2) if not by_risk[0].empty else 0.0
            mod_val = round(float(by_risk[1][key].mean()), 2) if not by_risk[1].empty else 0.0
            high_val = round(float(by_risk[2][key].mean()), 2) if not by_risk[2].empty else 0.0

            dimensions_by_risk.append(
                {
                    "dimension": label,
                    "Low Risk": low_val,
                    "Moderate Risk": mod_val,
                    "High Risk": high_val,
                }
            )

            average_profile.append(
                {
                    "dimension": label,
                    "score": round(float(data[key].mean()), 2) if not data.empty else 0.0,
                }
            )

        corr_with_target = []
        for key in DIMENSION_COLUMNS:
            if data.empty:
                corr_val = 0.0
            else:
                corr = data[[key, "has_ocd"]].corr().iloc[0, 1]
                corr_val = 0.0 if pd.isna(corr) else float(corr)
            corr_with_target.append(
                {
                    "dimension": key.replace("_", " ").replace("/", " "),
                    "correlation": round(corr_val, 3),
                }
            )

        dimension_correlations = sorted(corr_with_target, key=lambda x: abs(x["correlation"]), reverse=True)

        top_concerning = sorted(average_profile, key=lambda x: x["score"], reverse=True)[:3]
        top_concerning_dimensions = [
            {
                "dimension": item["dimension"],
                "avgScore": item["score"],
                "count": int(len(data)),
            }
            for item in top_concerning
        ]

        return {
            "dimensionsByRisk": dimensions_by_risk,
            "dimensionCorrelations": dimension_correlations,
            "averageProfile": average_profile,
            "topConcerningDimensions": top_concerning_dimensions,
        }

    def correlations(self, filters: Dict[str, Any] | None) -> Dict[str, Any]:
        data = self._apply_filters(filters)
        columns = ["Age"] + DIMENSION_COLUMNS + ["ocd_overall_score"]
        numeric = data[columns].copy()
        corr_matrix = numeric.corr(numeric_only=True)

        pairs: List[Dict[str, Any]] = []
        for i, c1 in enumerate(columns):
            for c2 in columns[i + 1 :]:
                corr = corr_matrix.loc[c1, c2]
                if pd.isna(corr):
                    continue
                pairs.append(
                    {
                        "feature1": c1.replace("_", " ").replace("/", " "),
                        "feature2": c2.replace("_", " ").replace("/", " "),
                        "correlation": round(float(corr), 3),
                    }
                )

        top = sorted(pairs, key=lambda x: abs(x["correlation"]), reverse=True)[:10]
        return {"topCorrelations": top}

    def counts(self, filters: Dict[str, Any] | None) -> Dict[str, int]:
        total = int(len(_load_csv()))
        filtered = int(len(self._apply_filters(filters)))
        return {"total": total, "filtered": filtered}

    def model_lab_summary(self) -> Dict[str, Any]:
        data = _load_csv().copy()

        true_labels: List[int] = []
        pred_labels: List[int] = []
        for _, row in data.iterrows():
            demographics = {
                "age": float(row.get("Age", 25)),
                "gender": str(row.get("Gender", "Prefer not to say")),
                "education": str(row.get("Current Education Level", "Undergraduate")),
            }
            responses = {
                "Contamination_and_Washing": float(row.get("Contamination_and_Washing", 0)),
                "Checking_Behavior": float(row.get("Checking_Behavior", 0)),
                "Ordering_Symmetry": float(row.get("Ordering/Symmetry", 0)),
                "Hoarding_Collecting": float(row.get("Hoarding/Collecting", 0)),
                "Intrusive_Thoughts": float(row.get("Intrusive_Thoughts", 0)),
                "Mental_Compulsions_and_Rituals": float(row.get("Mental_Compulsions_and_Rituals", 0)),
                "Avoidance_Behavior": float(row.get("Avoidance_Behavior", 0)),
                "Emotional_Awareness_and_Insights": float(row.get("Emotional_Awareness_and_Insights", 0)),
                "Functioning_Behavior": float(row.get("Functioning_Behavior", 0)),
            }

            prediction, _ = ocd_model_service.predict(demographics, responses)
            pred_labels.append(int(prediction))
            true_labels.append(int(row.get("has_ocd", 0)))

        labels = [0, 1, 2]
        accuracy = accuracy_score(true_labels, pred_labels) * 100
        precision = precision_score(true_labels, pred_labels, labels=labels, average="weighted", zero_division=0) * 100
        recall = recall_score(true_labels, pred_labels, labels=labels, average="weighted", zero_division=0) * 100
        f1 = f1_score(true_labels, pred_labels, labels=labels, average="weighted", zero_division=0) * 100
        matrix = confusion_matrix(true_labels, pred_labels, labels=labels).tolist()

        model = ocd_model_service._artifacts.model
        coef = np.abs(np.asarray(model.coef_)).mean(axis=0)

        feature_names = [
            "Age",
            "Gender Male",
            "Gender Female",
            "Gender Other",
            "Education Encoded",
            "Occupation Encoded",
            "Country Encoded",
            "Contamination and Washing",
            "Checking Behavior",
            "Ordering Symmetry",
            "Hoarding Collecting",
            "Intrusive Thoughts",
            "Mental Compulsions and Rituals",
            "Avoidance Behavior",
            "Emotional Awareness and Insights",
            "Functioning Behavior",
            "OCD Overall Score",
        ]

        selected_indices = [7, 8, 9, 10, 11, 12, 13, 14, 15]
        selected = coef[selected_indices]
        denom = float(selected.sum()) if float(selected.sum()) > 0 else 1.0

        feature_importance = []
        for idx in selected_indices:
            name = feature_names[idx]
            pretty = name.replace(" and ", " ")
            feature_importance.append(
                {
                    "feature": pretty,
                    "importance": round(float(coef[idx] / denom), 4),
                }
            )

        feature_importance = sorted(feature_importance, key=lambda x: x["importance"], reverse=True)

        dimension_correlations: List[Dict[str, Any]] = []
        for column in DIMENSION_COLUMNS:
            if data.empty:
                corr_value = 0.0
            else:
                corr = data[[column, "has_ocd"]].corr().iloc[0, 1]
                corr_value = 0.0 if pd.isna(corr) else float(corr)

            dimension_correlations.append(
                {
                    "dimension": column.replace("_", " ").replace("/", " "),
                    "correlation": round(corr_value, 4),
                }
            )

        return {
            "datasetSize": int(len(data)),
            "classDistribution": {
                "low": int((data["has_ocd"] <= 0).sum()),
                "moderate": int((data["has_ocd"] == 1).sum()),
                "high": int((data["has_ocd"] >= 2).sum()),
            },
            "logisticRegression": {
                "accuracy": round(float(accuracy), 2),
                "precision": round(float(precision), 2),
                "recall": round(float(recall), 2),
                "f1Score": round(float(f1), 2),
                "confusionMatrix": matrix,
                "featureImportance": feature_importance,
                "dimensionCorrelations": dimension_correlations,
            },
        }


data_explorer_csv_service = DataExplorerCsvService()
