// frontend/src/pages/Assessment.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Send,
} from "lucide-react";
import AssessmentResults from "../components/assessment/AssessmentResults";
import { useAuth } from "../hooks/useAuth";
import { patientService } from "../services/patientService";
import { assessmentService } from "../services/assessmentService";
import {
  OCD_QUESTIONS,
  DIMENSIONS,
  LIKERT_SCALE,
  GENDER_OPTIONS,
  EDUCATION_OPTIONS,
  RISK_INTERPRETATIONS,
  getScoreInterpretation,
  getHighConcernDimensions,
} from "../utils/assessmentConstants";

const Assessment = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  useAuth();

  const [step, setStep] = useState("form"); // 'form' or 'results'
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [demographics, setDemographics] = useState({
    age: 25,
    gender: "Male",
    education: "Bachelor",
  });

  const [responses, setResponses] = useState({});
  const [, setCurrentQuestion] = useState(0);

  // Results state
  const [assessmentResults, setAssessmentResults] = useState(null);

  const fetchPatientData = useCallback(async () => {
    try {
      const data = await patientService.getPatientById(parseInt(patientId));
      setPatient(data);
      setDemographics({
        age: data.age,
        gender: data.gender,
        education: data.education,
      });
    } catch (error) {
      console.error("Error fetching patient:", error);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }

    const initialResponses = {};
    DIMENSIONS.forEach((dim) => {
      initialResponses[dim] = 0;
    });
    setResponses(initialResponses);
  }, [patientId, fetchPatientData]);

  const handleResponseChange = (dimension, value) => {
    setResponses((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleSubmitAssessment = async () => {
    setLoading(true);

    // Check for high concern dimensions
    const highConcernDims = getHighConcernDimensions(responses);

    if (highConcernDims.length > 0) {
      const alertMessage = `⚠️ High Concern Alert!\n\nThe following dimension(s) scored high (3 or 4):\n${highConcernDims
        .map((d) => `• ${d.dimension}: ${d.score}/4`)
        .join(
          "\n"
        )}\n\nPlease consider immediate consultation with a qualified mental health professional.`;

      alert(alertMessage);
    }

    try {
      const saved = await assessmentService.submitAssessment({
        patientId: patient?.id,
        demographics,
        responses,
      });

      setAssessmentResults({
        ...saved,
        patientName: patient?.name || "Anonymous",
      });
      setStep("results");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to submit assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const initialResponses = {};
    DIMENSIONS.forEach((dim) => {
      initialResponses[dim] = 0;
    });
    setResponses(initialResponses);
    setCurrentQuestion(0);
    setStep("form");
    setAssessmentResults(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="assessment-page" className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/patients")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <span>🎯</span>
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                OCD Risk Assessment
              </span>
            </h1>
            {patient && (
              <p className="text-gray-600">
                Assessment for: <strong>{patient.name}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {step === "form" ? (
        <>
          {/* Professional Note */}
          <div
            className="p-4 my-4 rounded-xl font-medium border-l-[5px] border-[#e17055]
  shadow-md hover:shadow-lg transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)",
            }}
          >
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-orange-600 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  📋 Professional Assessment Tool
                </h4>
                <p className="text-gray-700">
                  This comprehensive screening tool analyzes{" "}
                  <strong>9 core OCD dimensions</strong> using validated
                  psychological assessment principles. Please answer all
                  questions honestly for the most accurate results.
                </p>
              </div>
            </div>
          </div>

          {/* Demographics Section */}
          {!patient && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                👤 Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    value={demographics.age}
                    onChange={(e) =>
                      setDemographics({
                        ...demographics,
                        age: parseInt(e.target.value),
                      })
                    }
                    min="18"
                    max="80"
                    className="form-input"
                  />
                  <p className="text-xs text-gray-800 mt-2">
                    Your current age in years
                  </p>
                </div>

                <div>
                  <label className="form-label">Gender</label>
                  <select
                    value={demographics.gender}
                    onChange={(e) =>
                      setDemographics({
                        ...demographics,
                        gender: e.target.value,
                      })
                    }
                    className="form-input"
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-800 mt-2">
                    Select your gender identity
                  </p>
                </div>

                <div>
                  <label className="form-label">Education Level</label>
                  <select
                    value={demographics.education}
                    onChange={(e) =>
                      setDemographics({
                        ...demographics,
                        education: e.target.value,
                      })
                    }
                    className="form-input"
                  >
                    {EDUCATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-800 mt-2">
                    Your highest completed education level
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Questions */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                🧠 OCD Symptom Assessment
              </h3>
              <p className="text-gray-600">
                Rate each statement based on how often you experience these
                thoughts or behaviors
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress:{" "}
                  {Object.values(responses).filter((v) => v > 0).length} /{" "}
                  {DIMENSIONS.length} answered
                </span>
                <span className="text-sm text-gray-500">
                  {(
                    (Object.values(responses).filter((v) => v > 0).length /
                      DIMENSIONS.length) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (Object.values(responses).filter((v) => v > 0).length /
                        DIMENSIONS.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {DIMENSIONS.map((dimension, index) => {
                const questionData = OCD_QUESTIONS[dimension];
                const score = responses[dimension];
                const scoreInfo = getScoreInterpretation(score);

                return (
                  <div
                    key={dimension}
                    className="border-b border-gray-200 pb-6 last:border-0"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="bg-primary-100 text-primary-600 font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                            {index + 1}
                          </span>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {questionData.description}
                          </h4>
                        </div>

                        <p className="text-gray-700 mb-2 ml-11">
                          <strong>{questionData.question}</strong>
                        </p>

                        <p className="text-sm text-gray-600 italic ml-11">
                          Examples: {questionData.examples}
                        </p>
                      </div>

                      <div className="text-right ml-4">
                        <div
                          className={`px-3 py-1 rounded-lg ${
                            score >= 3
                              ? "bg-red-100"
                              : score >= 2
                              ? "bg-yellow-100"
                              : "bg-green-100"
                          }`}
                        >
                          <span className="text-2xl">{scoreInfo.color}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mt-1">
                          {score}/4
                        </p>
                      </div>
                    </div>

                    {/* Likert Scale Selector */}
                    <div className="ml-11 mt-4">
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(LIKERT_SCALE).map(([label, value]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              handleResponseChange(dimension, value)
                            }
                            className={`py-3 px-2 rounded-lg border-2 transition-all text-sm font-medium ${
                              score === value
                                ? "border-primary-500 bg-primary-50 text-primary-700 shadow-md"
                                : "border-gray-200 hover:border-primary-300 text-gray-700"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSubmitAssessment}
                disabled={Object.values(responses).some((v) => v === undefined)}
                className="btn-primary flex items-center space-x-2 px-8 py-4 text-lg"
              >
                <Send className="w-6 h-6" />
                <span>Complete Assessment & Get Results</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        // Results will be in next part
        <AssessmentResults
          results={assessmentResults}
          onReset={handleReset}
          onSave={() => navigate("/patients")}
        />
      )}
    </div>
  );
};

export default Assessment;
