// frontend/src/pages/Reports.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Search,
  Filter,
  Printer,
  Mail,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { reportsService } from '../services/reportsService';
import { OCD_QUESTIONS } from '../utils/assessmentConstants';
import { downloadReportAsPdf, printReport } from '../utils/reportExport';

const SCORE_LABELS = {
  0: 'Never',
  1: 'Rarely',
  2: 'Sometimes',
  3: 'Often',
  4: 'Always',
};

const formatDimensionKey = (key = '') =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const normalizeReport = (report) => {
  const responses = report.responses || {};

  const responseDetails = Object.entries(responses).map(([key, value], index) => {
    const score = Number(value) || 0;
    return {
      id: `${report.reportId}-${key}-${index}`,
      key,
      dimension: formatDimensionKey(key),
      question: OCD_QUESTIONS[key]?.question || formatDimensionKey(key),
      score,
      answerLabel: SCORE_LABELS[score] || `Score ${score}`,
    };
  });

  return {
    ...report,
    responseDetails,
    dimensionScores:
      report.dimensionScores ||
      responseDetails.map((item) => ({
        name: item.dimension,
        score: item.score,
      })),
  };
};

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [user]);

  const filterReports = useCallback(() => {
    let filtered = [...reports];

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.reportId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRisk !== 'all') {
      filtered = filtered.filter((r) => r.riskLevel === filterRisk);
    }

    if (filterDateRange !== 'all') {
      const now = new Date();
      const ranges = {
        today: 0,
        week: 7,
        month: 30,
        quarter: 90,
      };

      if (ranges[filterDateRange] !== undefined) {
        const cutoffDate = new Date(now - ranges[filterDateRange] * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((r) => new Date(r.date) >= cutoffDate);
      }
    }

    setFilteredReports(filtered);
  }, [reports, searchQuery, filterRisk, filterDateRange]);

  useEffect(() => {
    filterReports();
  }, [filterReports]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getReports();
      setReports(data.map(normalizeReport));
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowPreview(true);
  };

  const handleDownloadReport = async (report) => {
    try {
      downloadReportAsPdf(report);
    } catch (error) {
      alert(error?.message || 'Failed to generate report PDF');
    }
  };

  const handlePrintReport = (report) => {
    try {
      printReport(report);
    } catch (error) {
      alert(error?.message || `Failed to print report ${report.reportId}`);
    }
  };

  const handleEmailReport = (report) => {
    const patientEmail = report?.patientEmail || window.prompt('Enter patient email address');
    if (!patientEmail) {
      return;
    }

    reportsService
      .emailReport(report.reportId, patientEmail)
      .then((result) => {
        if (result?.sent === false) {
          alert(result?.message || 'Email service is not configured. Report was not sent.');
          return;
        }
        alert(result?.message || `Report ${report.reportId} emailed successfully to ${patientEmail}`);
      })
      .catch((error) => alert(error?.response?.data?.detail || 'Failed to email report'));
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case 'High':
        return 'risk-badge-high';
      case 'Moderate':
        return 'risk-badge-moderate';
      case 'Low':
        return 'risk-badge-low';
      default:
        return 'bg-gray-100 text-gray-800 border-2 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="reports-page" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <span>📄</span>
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Assessment Reports
            </span>
          </h1>
          <p className="text-gray-600">
            View, download, and manage patient assessment reports
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={FileText}
          title="Total Reports"
          value={reports.length}
          color="blue"
        />
        <SummaryCard
          icon={AlertCircle}
          title="High Risk"
          value={reports.filter(r => r.riskLevel === 'High').length}
          color="red"
        />
        <SummaryCard
          icon={TrendingUp}
          title="This Month"
          value={reports.filter(r => {
            const reportDate = new Date(r.date);
            const now = new Date();
            return reportDate.getMonth() === now.getMonth();
          }).length}
          color="green"
        />
        <SummaryCard
          icon={Calendar}
          title="This Week"
          value={reports.filter(r => {
            const reportDate = new Date(r.date);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return reportDate >= weekAgo;
          }).length}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name or report ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>

          {/* Risk Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="form-input flex-1"
            >
              <option value="all">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="form-input flex-1"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Report ID</th>
                <th className="table-header-cell">Patient</th>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Risk Level</th>
                <th className="table-header-cell">Score</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono text-sm text-gray-600">
                        {report.reportId}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold mr-2">
                          {report.patientName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">
                          {report.patientName}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600">
                        {new Date(report.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`${getRiskBadgeClass(report.riskLevel)} px-2 py-1 rounded-full text-xs font-semibold`}>
                        {report.riskLevel}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-gray-900">
                        {report.totalScore}/36
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        report.reviewed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.reviewed ? 'Reviewed' : 'Pending'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintReport(report)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEmailReport(report)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Email to Patient"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="table-cell text-center py-8 text-gray-500">
                    No reports found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Preview Modal */}
      {showPreview && selectedReport && (
        <ReportPreviewModal
          report={selectedReport}
          onClose={() => {
            setShowPreview(false);
            setSelectedReport(null);
          }}
          onDownload={() => handleDownloadReport(selectedReport)}
          onPrint={() => handlePrintReport(selectedReport)}
        />
      )}
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ icon, title, value, color }) => {
  const Icon = icon;

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Report Preview Modal Component
const ReportPreviewModal = ({ report, onClose, onDownload, onPrint }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Assessment Report</h3>
            <p className="text-sm text-gray-600 mt-1">Report ID: {report.reportId}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onPrint}
              className="btn-secondary flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-600">×</span>
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-8">
          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Patient Name</p>
                <p className="font-semibold text-gray-900">{report.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assessment Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(report.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Age / Gender</p>
                <p className="font-semibold text-gray-900">{report.demographics?.age} / {report.demographics?.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Education</p>
                <p className="font-semibold text-gray-900">{report.demographics?.education}</p>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className={`rounded-lg p-6 mb-6 ${
            report.riskLevel === 'High' ? 'bg-red-50 border-2 border-red-200' :
            report.riskLevel === 'Moderate' ? 'bg-yellow-50 border-2 border-yellow-200' :
            'bg-green-50 border-2 border-green-200'
          }`}>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Risk Assessment Result</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Risk Level</p>
                <p className={`text-3xl font-bold ${
                  report.riskLevel === 'High' ? 'text-red-600' :
                  report.riskLevel === 'Moderate' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {report.riskLevel}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Score</p>
                <p className="text-3xl font-bold text-gray-900">{report.totalScore}/36</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Confidence</p>
                <p className="text-3xl font-bold text-gray-900">{report.confidence}%</p>
              </div>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Dimension Scores</h4>
            <div className="space-y-3">
              {report.dimensionScores?.map((dim, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{dim.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          dim.score >= 3 ? 'bg-red-500' :
                          dim.score >= 2 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(dim.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900 w-8">{dim.score}/4</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Questions and Answers */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Assessment Responses</h4>
            {report.responseDetails?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 font-semibold text-gray-700">Dimension</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Question</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Answer</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.responseDetails.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="p-3 text-gray-800">{item.dimension}</td>
                        <td className="p-3 text-gray-700">{item.question}</td>
                        <td className="p-3 text-gray-800 font-medium">{item.answerLabel}</td>
                        <td className="p-3 text-gray-800">{item.score}/4</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No response data available for this report.</p>
            )}
          </div>

          {/* Clinical Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Clinical Notes</h4>
            <p className="text-sm text-gray-700">{report.clinicalNotes}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;