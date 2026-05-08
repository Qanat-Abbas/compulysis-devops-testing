// frontend/src/pages/ModelLab.jsx
import React from "react";
import { useState, useEffect } from 'react';
import {
  FlaskConical,
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { modelLabService } from '../services/modelLabService';

const ModelLab = () => {
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('Logistic Regression');
  const [summary, setSummary] = useState(null);

  // Model comparison data (from your research)
  const modelResults = {
    'Logistic Regression': {
      accuracy: 95.83,
      precision: 95.85,
      recall: 95.83,
      f1Score: 95.83,
      trainingTime: '0.15s',
      hyperparameters: {
        'C': 1.0,
        'penalty': 'l2',
        'solver': 'lbfgs',
        'max_iter': 1000
      },
      featureImportance: [
        { feature: 'Intrusive Thoughts', importance: 0.18 },
        { feature: 'Mental Rituals', importance: 0.16 },
        { feature: 'Contamination', importance: 0.14 },
        { feature: 'Functioning', importance: 0.13 },
        { feature: 'Avoidance', importance: 0.11 },
        { feature: 'Checking', importance: 0.10 },
        { feature: 'Ordering', importance: 0.09 },
        { feature: 'Awareness', importance: 0.06 },
        { feature: 'Hoarding', importance: 0.03 }
      ],
      confusionMatrix: [
        [42, 1, 0],
        [1, 11, 0],
        [0, 0, 9]
      ],
      description: 'Best performing model with highest accuracy and balanced performance across all metrics.',
      pros: ['Highest accuracy', 'Fast training', 'Interpretable', 'Stable predictions'],
      cons: ['Assumes linear relationships', 'May underfit complex patterns']
    },
    'Random Forest': {
      accuracy: 91.67,
      precision: 92.05,
      recall: 91.67,
      f1Score: 91.73,
      trainingTime: '1.2s',
      hyperparameters: {
        'n_estimators': 100,
        'max_depth': 10,
        'min_samples_split': 2,
        'min_samples_leaf': 1
      },
      featureImportance: [
        { feature: 'Intrusive Thoughts', importance: 0.15 },
        { feature: 'Contamination', importance: 0.14 },
        { feature: 'Mental Rituals', importance: 0.13 },
        { feature: 'Functioning', importance: 0.12 },
        { feature: 'Avoidance', importance: 0.11 },
        { feature: 'Checking', importance: 0.11 },
        { feature: 'Ordering', importance: 0.10 },
        { feature: 'Awareness', importance: 0.08 },
        { feature: 'Hoarding', importance: 0.06 }
      ],
      confusionMatrix: [
        [41, 2, 0],
        [2, 10, 0],
        [0, 1, 8]
      ],
      description: 'Ensemble method that handles non-linear relationships well.',
      pros: ['Handles non-linearity', 'Feature importance', 'Robust to outliers'],
      cons: ['Slower training', 'Less interpretable', 'Higher memory usage']
    },
    'SVM': {
      accuracy: 89.58,
      precision: 90.12,
      recall: 89.58,
      f1Score: 89.72,
      trainingTime: '0.8s',
      hyperparameters: {
        'C': 1.0,
        'kernel': 'rbf',
        'gamma': 'scale'
      },
      featureImportance: null,
      confusionMatrix: [
        [40, 3, 0],
        [2, 9, 1],
        [0, 2, 7]
      ],
      description: 'Support Vector Machine with RBF kernel for non-linear classification.',
      pros: ['Good with high-dimensional data', 'Effective with clear margins'],
      cons: ['Sensitive to hyperparameters', 'No feature importance', 'Slower predictions']
    },
    'K-Nearest Neighbors': {
      accuracy: 85.42,
      precision: 86.15,
      recall: 85.42,
      f1Score: 85.65,
      trainingTime: '0.05s',
      hyperparameters: {
        'n_neighbors': 5,
        'weights': 'uniform',
        'algorithm': 'auto'
      },
      featureImportance: null,
      confusionMatrix: [
        [39, 4, 0],
        [3, 8, 1],
        [1, 2, 6]
      ],
      description: 'Instance-based learning algorithm, simple but effective.',
      pros: ['Simple implementation', 'No training phase', 'Intuitive'],
      cons: ['Slow predictions', 'Sensitive to scale', 'No feature importance']
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await modelLabService.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching model lab summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const mergedModelResults = {
    ...modelResults,
    'Logistic Regression': {
      ...modelResults['Logistic Regression'],
      accuracy: summary?.logisticRegression?.accuracy ?? modelResults['Logistic Regression'].accuracy,
      precision: summary?.logisticRegression?.precision ?? modelResults['Logistic Regression'].precision,
      recall: summary?.logisticRegression?.recall ?? modelResults['Logistic Regression'].recall,
      f1Score: summary?.logisticRegression?.f1Score ?? modelResults['Logistic Regression'].f1Score,
      confusionMatrix: summary?.logisticRegression?.confusionMatrix ?? modelResults['Logistic Regression'].confusionMatrix,
      featureImportance: summary?.logisticRegression?.featureImportance ?? modelResults['Logistic Regression'].featureImportance,
      description: summary?.datasetSize
        ? `Validated against your provided OCD CSV dataset (${summary.datasetSize} records).`
        : modelResults['Logistic Regression'].description,
    },
  };

  const comparisonData = Object.entries(mergedModelResults).map(([name, data]) => ({
    name,
    Accuracy: data.accuracy,
    Precision: data.precision,
    Recall: data.recall,
    'F1-Score': data.f1Score
  }));

  const featureOrder = [
    'Contamination and Washing',
    'Checking Behavior',
    'Ordering Symmetry',
    'Hoarding Collecting',
    'Intrusive Thoughts',
    'Mental Compulsions and Rituals',
    'Avoidance Behavior',
    'Emotional Awareness and Insights',
    'Functioning Behavior'
  ];

  const shortFeatureLabel = {
    'Contamination and Washing': 'Contamination',
    'Checking Behavior': 'Checking',
    'Ordering Symmetry': 'Ordering',
    'Hoarding Collecting': 'Hoarding',
    'Intrusive Thoughts': 'Intrusive',
    'Mental Compulsions and Rituals': 'Compulsions',
    'Avoidance Behavior': 'Avoidance',
    'Emotional Awareness and Insights': 'Insight',
    'Functioning Behavior': 'Functioning'
  };

  const normalizeFeatureName = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');

  const featureSynonyms = {
    contaminationwashing: 'Contamination and Washing',
    checkingbehavior: 'Checking Behavior',
    orderingsymmetry: 'Ordering Symmetry',
    hoardingcollecting: 'Hoarding Collecting',
    intrusivethoughts: 'Intrusive Thoughts',
    mentalcompulsionsandrituals: 'Mental Compulsions and Rituals',
    mentalrituals: 'Mental Compulsions and Rituals',
    avoidancebehavior: 'Avoidance Behavior',
    emotionalawarenessandinsights: 'Emotional Awareness and Insights',
    awareness: 'Emotional Awareness and Insights',
    functioningbehavior: 'Functioning Behavior'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading model laboratory...</p>
        </div>
      </div>
    );
  }

  const currentModel = mergedModelResults[selectedModel];
  const featureImportanceMap = (currentModel.featureImportance || []).reduce(
    (acc, item) => {
      const normalized = normalizeFeatureName(item.feature);
      const canonical = featureSynonyms[normalized];
      if (canonical) {
        acc[canonical] = Number(item.importance) || 0;
      }
      return acc;
    },
    {}
  );

  const featureImportanceData = featureOrder.map((feature) => ({
    feature,
    label: shortFeatureLabel[feature],
    importance: featureImportanceMap[feature] ?? 0
  }));

  const correlationMap = (summary?.logisticRegression?.dimensionCorrelations || []).reduce(
    (acc, item) => {
      const normalized = normalizeFeatureName(item.dimension);
      const canonical = featureSynonyms[normalized];
      if (canonical) {
        acc[canonical] = Number(item.correlation) || 0;
      }
      return acc;
    },
    {}
  );

  const correlationData = featureOrder.map((feature) => {
    const value = correlationMap[feature] ?? 0;
    return {
      feature,
      label: shortFeatureLabel[feature],
      correlation: value,
      fill: value >= 0 ? '#4facfe' : '#f87171'
    };
  });

  const maxCorrelationAbs = Math.max(
    ...correlationData.map((item) => Math.abs(item.correlation)),
    0.1
  );

  const maxImportance = Math.max(...featureImportanceData.map((item) => item.importance), 0.01);

  return (
    <div data-testid="model-lab-page" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
        <span>🧪</span>
        <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
           Model Laboratory
        </span>
        </h1>
        <p className="text-gray-600">
          Comprehensive ML model analysis and comparison for OCD risk prediction
        </p>
      </div>

      {/* Research Context */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <Info className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Research-Based Model Validation</h3>
            <p className="text-blue-800">
              These models were trained and validated on a dataset of 200 individuals using 9 OCD dimensions.
              All models underwent rigorous cross-validation and hyperparameter tuning. The Logistic Regression
              model achieved the highest accuracy of 95.83% and is currently deployed in production.
            </p>
          </div>
        </div>
      </div>

      {/* Model Comparison Chart */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Target className="w-6 h-6 mr-2 text-primary-600" />
          Model Performance Comparison
        </h3>
        
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[80, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Accuracy" fill="#667eea" />
            <Bar dataKey="Precision" fill="#764ba2" />
            <Bar dataKey="Recall" fill="#f093fb" />
            <Bar dataKey="F1-Score" fill="#4facfe" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Model Selector */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Select Model for Detailed Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.keys(mergedModelResults).map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedModel === model
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FlaskConical className={`w-5 h-5 ${
                  selectedModel === model ? 'text-primary-600' : 'text-gray-400'
                }`} />
                {model === 'Logistic Regression' && (
                  <Award className="w-5 h-5 text-yellow-500" title="Best Model" />
                )}
              </div>
              <p className={`font-semibold text-sm ${
                selectedModel === model ? 'text-primary-700' : 'text-gray-700'
              }`}>
                {model}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {mergedModelResults[model].accuracy.toFixed(2)}% Accuracy
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Model Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <MetricCard label="Accuracy" value={currentModel.accuracy} color="blue" />
            <MetricCard label="Precision" value={currentModel.precision} color="purple" />
            <MetricCard label="Recall" value={currentModel.recall} color="pink" />
            <MetricCard label="F1-Score" value={currentModel.f1Score} color="indigo" />
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600">Training Time</p>
              <p className="text-lg font-bold text-gray-800">{currentModel.trainingTime}</p>
            </div>
          </div>
        </div>

        {/* Hyperparameters */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Hyperparameters</h3>
          <div className="space-y-3">
            {Object.entries(currentModel.hyperparameters).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{key}</span>
                <span className="text-sm font-bold text-primary-600">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Description */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Model Overview</h3>
          <p className="text-sm text-gray-700 mb-4">{currentModel.description}</p>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-green-700 mb-2">✅ Pros:</h4>
            <ul className="space-y-1">
              {currentModel.pros.map((pro, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="mr-2">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-2">❌ Cons:</h4>
            <ul className="space-y-1">
              {currentModel.cons.map((con, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start">
                  <span className="mr-2">•</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Importance & Confusion Matrix */}
      {currentModel.featureImportance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Importance */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Feature Importance</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={featureImportanceData}
                margin={{ top: 10, right: 16, left: 0, bottom: 90 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  type="category"
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={90}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  domain={[0, Number((maxImportance * 1.15).toFixed(3))]}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [Number(value).toFixed(4), 'Importance Score']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.feature || label;
                  }}
                />
                <Bar dataKey="importance" barSize={26} radius={[6, 6, 0, 0]}>
                  {featureImportanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${240 - index * 20}, 70%, 60%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Confusion Matrix */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confusion Matrix</h3>
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div></div>
                <div className="text-sm font-semibold text-gray-600">Low</div>
                <div className="text-sm font-semibold text-gray-600">Moderate</div>
                <div className="text-sm font-semibold text-gray-600">High</div>
                
                {['Low', 'Moderate', 'High'].map((label, i) => (
                  <React.Fragment key={i}>
                    <div className="text-sm font-semibold text-gray-600 flex items-center justify-end pr-2">
                      {label}
                    </div>
                    {currentModel.confusionMatrix[i].map((value, j) => (
                      <div
                        key={j}
                        className={`w-20 h-20 flex items-center justify-center rounded-lg text-white font-bold text-xl ${
                          i === j ? 'bg-green-500' : value > 0 ? 'bg-red-400' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {value}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Rows: Actual | Columns: Predicted
              </p>
            </div>
          </div>
        </div>
      )}

      {summary?.logisticRegression?.dimensionCorrelations && (
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dimension Correlation</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={correlationData}
              margin={{ top: 10, right: 16, left: 0, bottom: 90 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                type="category"
                interval={0}
                angle={-35}
                textAnchor="end"
                height={90}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number"
                domain={[
                  Number((-(maxCorrelationAbs * 1.15)).toFixed(3)),
                  Number((maxCorrelationAbs * 1.15).toFixed(3))
                ]}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [Number(value).toFixed(4), 'Correlation Score']}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.feature || label;
                }}
              />
              <Bar dataKey="correlation" barSize={26} radius={[6, 6, 0, 0]}>
                {correlationData.map((entry, index) => (
                  <Cell key={`corr-cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Clinical Implications */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Clinical Implications
        </h3>
        <p className="text-green-800 mb-3">
          The {selectedModel} model demonstrates strong predictive performance for OCD risk assessment.
          With {currentModel.accuracy.toFixed(2)}% accuracy, this model can effectively assist clinicians in:
        </p>
        <ul className="space-y-2 text-green-700">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>Early identification of individuals at risk for OCD</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>Prioritizing patients requiring immediate clinical attention</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>Understanding key symptom dimensions driving risk assessment</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>Optimizing resource allocation in clinical settings</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className={`bg-gradient-to-r ${colors[color]} rounded-lg p-4 text-white`}>
      <p className="text-sm opacity-90 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value.toFixed(2)}%</p>
    </div>
  );
};

export default ModelLab;