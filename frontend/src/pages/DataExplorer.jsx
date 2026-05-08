// frontend/src/pages/DataExplorer.jsx
import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Filter,
  Download,
  TrendingUp,
  Users,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import { dataExplorerService } from "../services/dataExplorerService";

const DataExplorer = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("demographics");
  const [dataSource, setDataSource] = useState("personal"); // 'personal' or 'research'

  // Filters
  const [filters, setFilters] = useState({
    ageRange: [18, 80],
    genders: ["Male", "Female"],
    educationLevels: [],
  });

  // Data
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [demographicsData, setDemographicsData] = useState(null);
  const [ocdAnalysisData, setOcdAnalysisData] = useState(null);
  const [correlationData, setCorrelationData] = useState(null);
  

  const fetchExplorerData = useCallback(async () => {
    setLoading(true);
    try {
      const psychologistId = user?.id || 1;
      const source = dataSource === "personal" ? psychologistId : "research";

      const [demographics, ocdAnalysis, correlations, counts] =
        await Promise.all([
          dataExplorerService.getDemographicsData(source, filters),
          dataExplorerService.getOcdAnalysisData(source, filters),
          dataExplorerService.getCorrelationData(source, filters),
          dataExplorerService.getDataCounts(source, filters),
        ]);

      const normalizedOcdAnalysis = {
        ...ocdAnalysis,
        dimensionCorrelations: (ocdAnalysis?.dimensionCorrelations || []).map((item) => ({
          ...item,
          dimension: String(item?.dimension || ''),
          correlation: Number(item?.correlation ?? 0),
        })),
      };

      setDemographicsData(demographics);
      setOcdAnalysisData(normalizedOcdAnalysis);
      setCorrelationData(correlations);
      setFilteredCount(counts.filtered);
      setTotalCount(counts.total);
    } catch (error) {
      console.error("Error fetching explorer data:", error);
    } finally {
      setLoading(false);
    }
  }, [dataSource, filters, user]);

  useEffect(() => {
    fetchExplorerData();
  }, [fetchExplorerData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExportData = () => {
    alert(
      "Export functionality - In production, this would generate a CSV/PDF report"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="data-explorer-page" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <span>📊</span>
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Interactive Data Explorer
            </span>
          </h1>
          <p className="text-gray-600">
            Comprehensive analytics and insights for clinical decision support
          </p>
        </div>
        <button
          onClick={handleExportData}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Data Source Selector */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Data Source
            </h3>
            <p className="text-sm text-gray-600">
              Choose between your patient data or the research dataset
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setDataSource("personal")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                dataSource === "personal"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              My Patients
            </button>
            <button
              onClick={() => setDataSource("research")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                dataSource === "research"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Research Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <FiltersSection
        filters={filters}
        onFilterChange={handleFilterChange}
        filteredCount={filteredCount}
        totalCount={totalCount}
        onRefresh={fetchExplorerData}
      />

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { id: "demographics", label: "👥 Demographics", icon: Users },
              { id: "ocd", label: "🧠 OCD Analysis", icon: Activity },
              {
                id: "correlations",
                label: "📈 Correlations",
                icon: TrendingUp,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? "text-primary-600 border-b-2 border-primary-600 bg-primary-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "demographics" && (
            <DemographicsTab data={demographicsData} />
          )}
          {activeTab === "ocd" && <OcdAnalysisTab data={ocdAnalysisData} />}
          {activeTab === "correlations" && (
            <CorrelationsTab data={correlationData} />
          )}
        </div>
      </div>
    </div>
  );
};

// Filters Section Component
const FiltersSection = ({
  filters,
  onFilterChange,
  filteredCount,
  totalCount,
  onRefresh,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-800">Data Filters</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {expanded ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Age Range Filter */}
          <div>
            <label className="form-label">Age Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={filters.ageRange[0]}
                onChange={(e) =>
                  onFilterChange("ageRange", [
                    parseInt(e.target.value),
                    filters.ageRange[1],
                  ])
                }
                className="form-input flex-1"
                min="18"
                max="80"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                value={filters.ageRange[1]}
                onChange={(e) =>
                  onFilterChange("ageRange", [
                    filters.ageRange[0],
                    parseInt(e.target.value),
                  ])
                }
                className="form-input flex-1"
                min="18"
                max="80"
              />
            </div>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="form-label">Gender</label>
            <div className="flex flex-wrap gap-2">
              {["Male", "Female", "Other"].map((gender) => (
                <label key={gender} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.genders.includes(gender)}
                    onChange={(e) => {
                      const newGenders = e.target.checked
                        ? [...filters.genders, gender]
                        : filters.genders.filter((g) => g !== gender);
                      onFilterChange("genders", newGenders);
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{gender}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Showing {filteredCount}</strong> out of{" "}
          <strong>{totalCount}</strong> records based on current filters
        </p>
      </div>
    </div>
  );
};

// Demographics Tab Component
const DemographicsTab = ({ data }) => {
  if (!data) return <div>Loading demographics data...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">
            Age Distribution by Risk Level
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageGroup" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Low Risk" fill="#27ae60" />
              <Bar dataKey="Moderate Risk" fill="#f39c12" />
              <Bar dataKey="High Risk" fill="#e74c3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">
            Gender Distribution
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.genderDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.genderDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Education vs Risk */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">
            Education Level vs OCD Risk
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.educationVsRisk}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="education"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Low" fill="#27ae60" />
              <Bar dataKey="Moderate" fill="#f39c12" />
              <Bar dataKey="High" fill="#e74c3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Heatmap by Demographics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">
            Risk Distribution Summary
          </h4>
          <div className="space-y-4">
            {data.riskByGender.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">
                    {item.gender}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      item.avgRisk >= 1.5
                        ? "bg-red-100 text-red-800"
                        : item.avgRisk >= 1.0
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    Avg Risk: {item.avgRisk.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Low</p>
                    <p className="font-bold text-green-600">{item.low}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Moderate</p>
                    <p className="font-bold text-yellow-600">{item.moderate}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">High</p>
                    <p className="font-bold text-red-600">{item.high}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// OCD Analysis Tab Component
const OcdAnalysisTab = ({ data }) => {
  if (!data) return <div>Loading OCD analysis data...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimension Scores by Risk */}
        <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">
            OCD Dimension Scores by Risk Level
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.dimensionsByRisk}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dimension"
                angle={-45}
                textAnchor="end"
                height={120}
              />
              <YAxis domain={[0, 4]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Low Risk" fill="#27ae60" />
              <Bar dataKey="Moderate Risk" fill="#f39c12" />
              <Bar dataKey="High Risk" fill="#e74c3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension Correlation with Risk */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">
            Dimension Correlation with OCD Risk
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.dimensionCorrelations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dimension"
                type="category"
                interval={0}
                angle={-35}
                textAnchor="end"
                height={130}
              />
              <YAxis
                type="number"
                domain={[-1, 1]}
                tickFormatter={(value) => Number(value).toFixed(2)}
              />
              <Tooltip
                formatter={(value) => Number(value).toFixed(3)}
                labelFormatter={(label) => `Dimension: ${label}`}
              />
              <Bar dataKey="correlation" minPointSize={3}>
                {data.dimensionCorrelations.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      Math.abs(Number(entry.correlation || 0)) > 0.7
                        ? "#e74c3c"
                        : Math.abs(Number(entry.correlation || 0)) > 0.5
                        ? "#f39c12"
                        : "#27ae60"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average Scores Radar */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-4">
            Average Dimension Profile
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data.averageProfile}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 4]} />
              <Radar
                name="Average Score"
                dataKey="score"
                stroke="#667eea"
                fill="#667eea"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Concerning Dimensions */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          ⚠️ Most Concerning Dimensions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.topConcerningDimensions.map((dim, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 border-2 border-red-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🔴</span>
                <span className="text-2xl font-bold text-red-600">
                  {dim.avgScore.toFixed(2)}
                </span>
              </div>
              <p className="font-semibold text-gray-800 text-sm">
                {dim.dimension}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {dim.count} individuals affected
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Correlations Tab Component
const CorrelationsTab = ({ data }) => {
  if (!data) return <div>Loading correlation data...</div>;

  return (
    <div className="space-y-8">
      {/* Correlation Matrix would go here - simplified for now */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">
          🔍 Strongest Correlations
        </h4>
        <div className="space-y-3">
          {data.topCorrelations.map((corr, index) => {
            const color =
              Math.abs(corr.correlation) > 0.7
                ? "🔴"
                : Math.abs(corr.correlation) > 0.5
                ? "🟡"
                : "🟢";

            return (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {color} {corr.feature1} ↔ {corr.feature2}
                    </p>
                    <p className="font-semibold">
                      {typeof corr.correlation === "number"
                        ? corr.correlation.toFixed(2)
                        : Number(corr.correlation || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          Math.abs(corr.correlation) > 0.7
                            ? "bg-red-500"
                            : Math.abs(corr.correlation) > 0.5
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.abs(corr.correlation) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
