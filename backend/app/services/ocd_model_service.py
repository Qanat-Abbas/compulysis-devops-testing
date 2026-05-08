from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression


@dataclass
class OCDModelArtifacts:
    model: Any
    csv_data: pd.DataFrame
    occupation_map: Dict[str, int]
    education_map: Dict[str, int]
    country_map: Dict[str, int]
    default_occupation: str
    default_country: str


class OCDModelService:
    def __init__(self) -> None:
        backend_dir = Path(__file__).resolve().parents[2]
        self.model_path = backend_dir / "logistic_model.pkl"
        self.csv_path = backend_dir / "OCD_Prepared_Data.csv"
        self._artifacts = self._load_artifacts()
        self._ensure_model_quality()

    def _load_artifacts(self) -> OCDModelArtifacts:
        model = joblib.load(self.model_path)
        data = pd.read_csv(self.csv_path)

        occupation_counts = data["Occupation / Field of Study"].value_counts()
        country_counts = data["Country or Region"].value_counts()

        occupation_map = {
            value: idx for idx, value in enumerate(sorted(data["Occupation / Field of Study"].astype(str).unique()))
        }
        education_map = {
            value: idx for idx, value in enumerate(sorted(data["Current Education Level"].astype(str).unique()))
        }
        country_map = {
            value: idx for idx, value in enumerate(sorted(data["Country or Region"].astype(str).unique()))
        }

        return OCDModelArtifacts(
            model=model,
            csv_data=data,
            occupation_map=occupation_map,
            education_map=education_map,
            country_map=country_map,
            default_occupation=str(occupation_counts.index[0]),
            default_country=str(country_counts.index[0]),
        )

    def _build_features_for_row(self, row: pd.Series) -> List[float]:
        demographics = {
            "age": float(row.get("Age", 25)),
            "gender": str(row.get("Gender", "Prefer not to say")),
            "education": str(row.get("Current Education Level", "Undergraduate")),
            "occupation": str(row.get("Occupation / Field of Study", self._artifacts.default_occupation)),
            "country": str(row.get("Country or Region", self._artifacts.default_country)),
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
        return self._build_features(demographics, responses)

    def _training_matrix(self) -> Tuple[np.ndarray, np.ndarray]:
        features: List[List[float]] = []
        labels: List[int] = []

        for _, row in self._artifacts.csv_data.iterrows():
            features.append(self._build_features_for_row(row))
            labels.append(int(row.get("has_ocd", 0)))

        return np.asarray(features, dtype=float), np.asarray(labels, dtype=int)

    def _is_model_degenerate(self, model: Any, x_matrix: np.ndarray, y_true: np.ndarray) -> bool:
        predictions = np.asarray(model.predict(x_matrix), dtype=int)
        unique_predictions = np.unique(predictions)
        if len(unique_predictions) < 2:
            return True

        majority_ratio = max((predictions == klass).mean() for klass in unique_predictions)
        accuracy = float((predictions == y_true).mean())

        return bool(majority_ratio > 0.95 or accuracy < 0.45)

    def _refit_model(self, x_matrix: np.ndarray, y_true: np.ndarray) -> Any:
        model = LogisticRegression(
            max_iter=5000,
            solver="lbfgs",
            random_state=42,
        )
        model.fit(x_matrix, y_true)
        return model

    def _ensure_model_quality(self) -> None:
        x_matrix, y_true = self._training_matrix()
        if self._is_model_degenerate(self._artifacts.model, x_matrix, y_true):
            self._artifacts.model = self._refit_model(x_matrix, y_true)

    def _normalize_education(self, value: str) -> str:
        if not value:
            return "Undergraduate"

        normalized = value.strip().lower()
        mapping = {
            "matric / o-levels": "Intermediate / A-Levels",
            "intermediate / a-levels": "Intermediate / A-Levels",
            "undergraduate": "Undergraduate",
            "bachelor": "Undergraduate",
            "graduate": "Graduate",
            "post-graduate": "Graduate",
            "other": "Undergraduate",
        }
        return mapping.get(normalized, "Undergraduate")

    def _normalize_gender(self, value: str) -> Tuple[float, float, float]:
        normalized = (value or "").strip().lower()
        if normalized == "male":
            return 1.0, 0.0, 0.0
        if normalized == "female":
            return 0.0, 1.0, 0.0
        return 0.0, 0.0, 1.0

    def _build_features(self, demographics: Dict[str, Any], responses: Dict[str, Any]) -> List[float]:
        age = float(demographics.get("age", 25))
        gender_male, gender_female, gender_other = self._normalize_gender(str(demographics.get("gender", "")))

        education = self._normalize_education(str(demographics.get("education", "")))
        education_value = float(self._artifacts.education_map.get(education, 0))

        occupation = str(demographics.get("occupation", self._artifacts.default_occupation))
        country = str(demographics.get("country", self._artifacts.default_country))

        occupation_value = float(self._artifacts.occupation_map.get(occupation, self._artifacts.occupation_map.get(self._artifacts.default_occupation, 0)))
        country_value = float(self._artifacts.country_map.get(country, self._artifacts.country_map.get(self._artifacts.default_country, 0)))

        contamination = float(responses.get("Contamination_and_Washing", 0))
        checking = float(responses.get("Checking_Behavior", 0))
        ordering = float(responses.get("Ordering_Symmetry", responses.get("Ordering/Symmetry", 0)))
        hoarding = float(responses.get("Hoarding_Collecting", responses.get("Hoarding/Collecting", 0)))
        intrusive = float(responses.get("Intrusive_Thoughts", 0))
        mental = float(responses.get("Mental_Compulsions_and_Rituals", 0))
        avoidance = float(responses.get("Avoidance_Behavior", 0))
        awareness = float(responses.get("Emotional_Awareness_and_Insights", 0))
        functioning = float(responses.get("Functioning_Behavior", 0))

        ocd_overall_score = round(
            (
                contamination
                + checking
                + ordering
                + hoarding
                + intrusive
                + mental
                + avoidance
                + awareness
                + functioning
            )
            / 9,
            6,
        )

        return [
            age,
            gender_male,
            gender_female,
            gender_other,
            education_value,
            occupation_value,
            country_value,
            contamination,
            checking,
            ordering,
            hoarding,
            intrusive,
            mental,
            avoidance,
            awareness,
            functioning,
            ocd_overall_score,
        ]

    def predict(self, demographics: Dict[str, Any], responses: Dict[str, Any]) -> Tuple[int, List[float]]:
        features = self._build_features(demographics, responses)
        vector = np.array([features], dtype=float)

        classes = [int(value) for value in self._artifacts.model.classes_.tolist()]
        prediction = int(self._artifacts.model.predict(vector)[0])
        proba = self._artifacts.model.predict_proba(vector)[0]

        class_probabilities = {
            class_label: float(probability)
            for class_label, probability in zip(classes, proba.tolist())
        }
        ordered_probabilities = [
            class_probabilities.get(0, 0.0),
            class_probabilities.get(1, 0.0),
            class_probabilities.get(2, 0.0),
        ]

        if prediction not in (0, 1, 2):
            prediction = int(np.argmax(np.array(ordered_probabilities, dtype=float)))

        return prediction, ordered_probabilities


class _UnavailableOCDModelService:
    def __init__(self, startup_error: Exception) -> None:
        self.startup_error = startup_error

    def predict(self, demographics: Dict[str, Any], responses: Dict[str, Any]) -> Tuple[int, List[float]]:
        raise RuntimeError(
            f"OCD model service is unavailable: {self.startup_error}"
        )


try:
    ocd_model_service = OCDModelService()
except Exception as exc:
    # Keep API bootable even if model artifacts are missing/corrupted.
    ocd_model_service = _UnavailableOCDModelService(exc)
