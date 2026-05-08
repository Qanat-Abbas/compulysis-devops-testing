// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  AlertTriangle,
  Users,
  ClipboardCheck,
  TrendingUp,
  Activity,
  AlertCircle,
  Calendar,
  ArrowRight,
  Bell,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import { dashboardService } from "../services/dashboardService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overview, trends, risks, keyInsights, activities, tasks] =
          await Promise.all([
            dashboardService.getDashboardData(),
            dashboardService.getTrendData(),
            dashboardService.getRiskDistribution(),
            dashboardService.getInsights(),
            dashboardService.getRecentActivities(),
            dashboardService.getUpcomingTasks(),
          ]);

        setDashboardData(overview);
        setTrendData(trends);
        setRiskDistribution(risks);
        setInsights(keyInsights);
        setRecentActivities(activities);
        setUpcomingTasks(tasks);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page" className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <span>Welcome back, {user?.name?.split(" ")[1] || "Doctor"}!</span>
            <span>👋</span>
          </h1>

          <p className="text-gray-600">
            Overview of your Patient Assessments and Clinical Insights
          </p>
        </div>
        <button
          onClick={() => navigate("/assessment")}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          title="My Active Patients"
          value={dashboardData.activePatients}
          subtitle={`${dashboardData.totalPatients} total patients`}
          gradient="from-blue-400 to-blue-600"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          onClick={() => navigate("/patients")}
        />

        <MetricCard
          icon={AlertTriangle}
          title="High Risk Cases"
          value={`${dashboardData.highRiskPercentage}%`}
          subtitle={`${dashboardData.highRiskCount} patients need attention`}
          gradient="from-red-400 to-red-600"
          iconBg="bg-red-100"
          iconColor="text-red-600"
          isPulsing={dashboardData.highRiskCount > 0}
          onClick={() => navigate("/patients")}
        />

        <MetricCard
          icon={ClipboardCheck}
          title="This Week's Assessments"
          value={dashboardData.thisWeekAssessments}
          subtitle={`${dashboardData.totalAssessments} total assessments`}
          gradient="from-green-400 to-green-600"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />

        <MetricCard
          icon={Target}
          title="Model Accuracy"
          value={`${dashboardData.modelAccuracy}%`}
          subtitle={dashboardData.modelName}
          gradient="from-purple-400 to-purple-600"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          onClick={() => navigate("/model-lab")}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-primary-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">
                My Patient Risk Trends (Last 15 Days)
              </h3>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                stroke="#666"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#666" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="low"
                stroke="#27ae60"
                strokeWidth={2}
                name="Low Risk"
                dot={{ fill: "#27ae60", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="moderate"
                stroke="#f39c12"
                strokeWidth={2}
                name="Moderate Risk"
                dot={{ fill: "#f39c12", r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="high"
                stroke="#e74c3c"
                strokeWidth={2}
                name="High Risk"
                dot={{ fill: "#e74c3c", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-xl shadow-card p-6 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center mb-6">
            <Activity className="w-6 h-6 text-primary-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">
              My Patients Risk Distribution
            </h3>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {riskDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {item.value} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Clinical Insights */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center mb-6">
            <AlertCircle className="w-6 h-6 text-primary-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">
              Key Clinical Insights
            </h3>
          </div>

          <div className="space-y-4">
            <InsightCard
              title="⚠️ Most Concerning Dimension"
              content={insights?.mostConcerningDimension?.name}
              detail={`Average: ${insights?.mostConcerningDimension?.score}/${insights?.mostConcerningDimension?.maxScore}`}
              bgGradient="from-orange-400 to-red-500"
            />

            <InsightCard
              title="👥 Demographic Insight"
              content={insights?.demographicInsight?.description}
              detail={`${insights?.demographicInsight?.group}: ${insights?.demographicInsight?.riskScore}/${insights?.demographicInsight?.maxScore} avg risk`}
              bgGradient="from-purple-400 to-pink-500"
            />

            <InsightCard
              title="📊 Age Group Analysis"
              content={insights?.ageGroupInsight?.description}
              detail={`${insights?.ageGroupInsight?.group}: ${insights?.ageGroupInsight?.count} patients`}
              bgGradient="from-blue-400 to-indigo-500"
            />
          </div>
        </div>

        {/* Recent Activities & Tasks */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Recent Activities
                </h3>
              </div>
              <button
                onClick={() => navigate("/patients")}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent activities
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Upcoming Tasks
              </h3>
            </div>

            <div className="space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming tasks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Recommendation Banner */}
      {insights?.clinicalRecommendation && (
        <div
          className={`rounded-xl p-6 ${
            insights.clinicalRecommendation.priority === "High"
              ? "bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
          }`}
        >
          <div className="flex items-start">
            <AlertCircle
              className={`w-6 h-6 mr-3 flex-shrink-0 ${
                insights.clinicalRecommendation.priority === "High"
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            />
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Clinical Recommendation -{" "}
                {insights.clinicalRecommendation.priority} Priority
              </h4>
              <p className="text-gray-700 mb-3">
                {insights.clinicalRecommendation.message}
              </p>
              <div className="flex flex-wrap gap-2">
                {insights.clinicalRecommendation.actionItems.map(
                  (item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm"
                    >
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({
  icon,
  title,
  value,
  subtitle,
  gradient,
  iconBg,
  iconColor,
  isPulsing = false,
  onClick,
}) => {
  const Icon = icon;

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} rounded-xl shadow-card p-6 text-white transform hover:-translate-y-1 transition-all duration-200 hover:shadow-card-hover ${
        isPulsing ? "animate-pulse-red" : ""
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-80">{subtitle}</p>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ title, content, detail, bgGradient }) => (
  <div
    className={`bg-gradient-to-br ${bgGradient} rounded-lg p-4 text-white shadow-lg`}
  >
    <h4 className="font-semibold mb-2 text-sm">{title}</h4>
    <p className="text-base font-bold mb-1">{content}</p>
    <p className="text-xs opacity-90">{detail}</p>
  </div>
);

// Activity Item Component
const ActivityItem = ({ activity }) => {
  const riskColors = {
    High: "bg-red-100 text-red-800",
    Moderate: "bg-yellow-100 text-yellow-800",
    Low: "bg-green-100 text-green-800",
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-primary-600">
          {activity.patientInitials}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {activity.patientName}
        </p>
        <p className="text-xs text-gray-600">{activity.action}</p>
        <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
      </div>
      {activity.riskLevel && (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            riskColors[activity.riskLevel]
          }`}
        >
          {activity.riskLevel}
        </span>
      )}
    </div>
  );
};

// Task Item Component
const TaskItem = ({ task }) => {
  const priorityColors = {
    urgent: "border-red-500 bg-red-50",
    high: "border-orange-500 bg-orange-50",
    normal: "border-blue-500 bg-blue-50",
  };

  return (
    <div
      className={`p-3 rounded-lg border-l-4 ${priorityColors[task.priority]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {task.patientName}
          </p>
          <p className="text-xs text-gray-600 mt-1">{task.description}</p>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
          {new Date(task.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
