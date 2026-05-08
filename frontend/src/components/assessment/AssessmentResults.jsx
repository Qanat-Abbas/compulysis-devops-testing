// frontend/src/components/assessment/AssessmentResults.jsx
import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Activity,
  FileText,
  Download,
  RotateCcw,
  Save,
  AlertTriangle,
  Phone,
  Globe
} from 'lucide-react';
import {
  BarChart,
  Bar,
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
import {
  OCD_QUESTIONS,
  DIMENSIONS,
  RISK_INTERPRETATIONS,
  getDimensionAnalysis,
  calculateTotalScore
} from '../../utils/assessmentConstants';

const AssessmentResults = ({ results, onReset, onSave }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const riskInfo = RISK_INTERPRETATIONS[results.prediction];
  const dimensionAnalysis = getDimensionAnalysis(results.responses).sort(
    (a, b) => b.score - a.score
  );
  const totalScore = calculateTotalScore(results.responses);

  const DIMENSION_SHORT_LABELS = {
    Contamination_and_Washing: 'Contamination',
    Checking_Behavior: 'Checking',
    Ordering_Symmetry: 'Ordering',
    Hoarding_Collecting: 'Hoarding',
    Intrusive_Thoughts: 'Intrusive',
    Mental_Compulsions_and_Rituals: 'Compulsions',
    Avoidance_Behavior: 'Avoidance',
    Emotional_Awareness_and_Insights: 'Insight',
    Functioning_Behavior: 'Functioning'
  };

  // Prepare chart data
  const profileData = DIMENSIONS.map((dimensionKey) => {
    const score = Number(results.responses?.[dimensionKey] ?? 0);
    return {
      key: dimensionKey,
      dimension: DIMENSION_SHORT_LABELS[dimensionKey],
      fullDimension: OCD_QUESTIONS[dimensionKey].description,
      score,
      fill: score >= 3 ? '#e74c3c' : score >= 2 ? '#f39c12' : '#27ae60'
    };
  });

  const radarData = profileData;
  const barData = profileData;

  const probabilities = results.predictionProba.map((prob, idx) => ({
    level: ['Low Risk', 'Moderate Risk', 'High Risk'][idx],
    probability: (prob * 100).toFixed(1),
    color: ['#27ae60', '#f39c12', '#e74c3c'][idx],
    isHighlighted: idx === results.prediction
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-800">
            📋 Assessment Results
          </h2>
          <div className="flex space-x-3">
            <button onClick={onReset} className="btn-secondary flex items-center space-x-2">
              <RotateCcw className="w-5 h-5" />
              <span>New Assessment</span>
            </button>
            <button onClick={onSave} className="btn-primary flex items-center space-x-2">
              <Save className="w-5 h-5" />
              <span>Save & Continue</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Patient</p>
            <p className="font-semibold text-gray-900">{results.patientName}</p>
          </div>
          <div>
            <p className="text-gray-600">Assessment Date</p>
            <p className="font-semibold text-gray-900">
              {new Date(results.timestamp).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Score</p>
            <p className="font-semibold text-gray-900">{totalScore}/36</p>
          </div>
          <div>
            <p className="text-gray-600">Model Used</p>
            <p className="font-semibold text-gray-900">{results.modelUsed}</p>
          </div>
        </div>
      </div>

      {/* Risk Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {probabilities.map((item, index) => (
          <div
            key={index}
            className={`rounded-xl p-6 text-white shadow-lg transition-all ${
              item.isHighlighted
                ? 'ring-4 ring-offset-2 ring-gray-800 transform scale-105'
                : ''
            }`}
            style={{ 
              background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)` 
            }}
          >
            {item.isHighlighted && (
              <div className="text-center mb-2">
                <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                  PREDICTED LEVEL
                </span>
              </div>
            )}
            <h3 className="text-xl font-bold mb-2">{item.level}</h3>
            <p className="text-4xl font-bold">{item.probability}%</p>
            {item.isHighlighted && (
              <p className="text-sm opacity-90 mt-2">Confidence Level</p>
            )}
          </div>
        ))}
      </div>

      {/* Main Prediction Result */}
      <div className={`rounded-xl p-6 ${
        riskInfo.severity === 'high' ? 'bg-red-50 border-2 border-red-200' :
        riskInfo.severity === 'moderate' ? 'bg-yellow-50 border-2 border-yellow-200' :
        'bg-green-50 border-2 border-green-200'
      }`}>
        <div className="flex items-start">
          {riskInfo.severity === 'high' ? (
            <AlertTriangle className="w-8 h-8 text-red-600 mr-4 flex-shrink-0" />
          ) : riskInfo.severity === 'moderate' ? (
            <AlertCircle className="w-8 h-8 text-yellow-600 mr-4 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" />
          )}
          <div>
            <h3 className={`text-2xl font-bold mb-2 ${
              riskInfo.severity === 'high' ? 'text-red-800' :
              riskInfo.severity === 'moderate' ? 'text-yellow-800' :
              'text-green-800'
            }`}>
              {riskInfo.color} Assessment Result: {riskInfo.level.toUpperCase()}
            </h3>
            <p className={`text-lg ${
              riskInfo.severity === 'high' ? 'text-red-700' :
              riskInfo.severity === 'moderate' ? 'text-yellow-700' :
              'text-green-700'
            }`}>
              {riskInfo.description}
            </p>
            {riskInfo.clinicalNote && (
              <p className="text-sm mt-3 font-medium">{riskInfo.clinicalNote}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {['overview', 'dimensions', 'visualizations', 'recommendations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    📊 Assessment Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Score:</span>
                      <span className="font-bold text-gray-900">{totalScore} / 36</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Average Score:</span>
                      <span className="font-bold text-gray-900">{results.avgScore} / 4.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Risk Level:</span>
                      <span className="font-bold text-gray-900">{riskInfo.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Confidence:</span>
                      <span className="font-bold text-gray-900">
                        {(Math.max(...results.predictionProba) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Model Accuracy:</span>
                      <span className="font-bold text-gray-900">{results.modelAccuracy}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    🎯 Top Concern Areas
                  </h4>
                  <div className="space-y-2">
                    {dimensionAnalysis.slice(0, 5).map((dim, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="text-2xl mr-2">{dim.color}</span>
                          <span className="text-sm text-gray-700 truncate">
                            {dim.dimension}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 ml-2">
                          {dim.score}/4
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dimensions Tab */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🔍 Individual Dimension Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dimensionAnalysis.map((dim, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-4 border-2 ${
                      dim.score >= 3 ? 'bg-red-50 border-red-200' :
                      dim.score >= 2 ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <span className="text-2xl mr-2">{dim.color}</span>
                        {dim.dimension}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        dim.score >= 3 ? 'bg-red-200 text-red-800' :
                        dim.score >= 2 ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {dim.score}/4
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Level:</strong> {dim.level}
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      {dim.interpretation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visualizations Tab */}
          {activeTab === 'visualizations' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  📈 Visual Profile Analysis
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Radar Chart */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-4 text-center">
                      OCD Dimension Profile
                    </h4>
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis 
                          dataKey="dimension" 
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                        />
                        <PolarRadiusAxis angle={90} domain={[0, 4]} />
                        <Radar
                          name="Your Scores"
                          dataKey="score"
                          stroke="#667eea"
                          fill="#667eea"
                          fillOpacity={0.5}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-4 text-center">
                      Dimensional Scores Comparison
                    </h4>
                    <ResponsiveContainer width="100%" height={420}>
                      <BarChart
                        data={barData}
                        margin={{ top: 10, right: 16, left: 0, bottom: 90 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="dimension"
                          type="category"
                          interval={0}
                          angle={-35}
                          textAnchor="end"
                          height={90}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                          type="number"
                          domain={[0, 4]}
                          allowDecimals={false}
                          ticks={[0, 1, 2, 3, 4]}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}/4`, 'Score']}
                          labelFormatter={(label, payload) => {
                            const item = payload?.[0]?.payload;
                            return item?.fullDimension || label;
                          }}
                        />
                        <Bar dataKey="score" barSize={26} radius={[6, 6, 0, 0]}>
                          {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-primary-600" />
                  💡 Primary Recommendations for {riskInfo.level} Level
                </h3>
                <ul className="space-y-3">
                  {riskInfo.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* High Risk Emergency Contacts */}
              {results.prediction === 2 && riskInfo.emergencyContacts && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
                    <Phone className="w-6 h-6 mr-2" />
                    🆘 Immediate Support Resources
                  </h3>
                  <div className="space-y-3 text-red-700">
                    <p className="font-medium">If you're experiencing severe distress:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Phone className="w-4 h-4 mr-2 mt-1" />
                        <span><strong>Pakistan:</strong> {riskInfo.emergencyContacts.pk}</span>
                      </li>
                      <li className="flex items-start">
                        <Phone className="w-4 h-4 mr-2 mt-1" />
                        <span><strong>Crisis Text Line / Mental Health Helpline:</strong> {riskInfo.emergencyContacts.crisis}</span>
                      </li>
                      <li className="flex items-start">
                        <Globe className="w-4 h-4 mr-2 mt-1" />
                        <span><strong>International:</strong> {riskInfo.emergencyContacts.international}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Important Disclaimer</h4>
                    <p className="text-sm text-yellow-700">
                      This assessment is for screening and early diagnosis purposes only and does not 
                      constitute a professional medical diagnosis. Always consult qualified mental health 
                      professionals for proper evaluation and treatment. This tool should be used as part 
                      of a comprehensive clinical assessment process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;