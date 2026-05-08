// frontend/src/pages/PatientManagement.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArchiveRestore,
  AlertCircle,
  X,
  Save,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Activity,
  Filter,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { patientService } from "../services/patientService";

const PatientManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activePatients, setActivePatients] = useState([]);
  const [archivedPatients, setArchivedPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [activeTab, setActiveTab] = useState("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [statistics, setStatistics] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    email: "",
    phone: "",
    education: "Bachelor",
  });

  useEffect(() => {
    fetchPatients();
    fetchStatistics();
  }, [user]);

  const filterAndSearchPatients = useCallback(() => {
    const sourcePatients =
      activeTab === "active" ? activePatients : archivedPatients;
    let filtered = [...sourcePatients];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRisk !== "all") {
      filtered = filtered.filter((p) => p.riskLevel === filterRisk);
    }

    setFilteredPatients(filtered);
  }, [activePatients, archivedPatients, activeTab, searchQuery, filterRisk]);

  useEffect(() => {
    filterAndSearchPatients();
  }, [filterAndSearchPatients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const [activeData, archivedData] = await Promise.all([
        patientService.getMyPatients("active"),
        patientService.getMyPatients("archived"),
      ]);
      setActivePatients(activeData);
      setArchivedPatients(archivedData);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await patientService.getPatientStatistics();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await patientService.createPatient(formData);
      await fetchPatients();
      await fetchStatistics();
      setShowAddModal(false);
      resetForm();
      alert("Patient added successfully!");
    } catch (error) {
      alert(error?.response?.data?.message || "Error adding patient");
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    try {
      await patientService.updatePatient(selectedPatient.id, formData);
      await fetchPatients();
      setShowEditModal(false);
      resetForm();
      alert("Patient updated successfully!");
    } catch (error) {
      alert(error?.response?.data?.message || "Error updating patient");
    }
  };

  const handleDeletePatient = async () => {
    try {
      await patientService.deletePatient(selectedPatient.id);
      await fetchPatients();
      await fetchStatistics();
      setShowDeleteModal(false);
      setSelectedPatient(null);
      alert("Patient archived successfully!");
    } catch (error) {
      alert(error?.response?.data?.message || "Error deleting patient");
    }
  };

  const handleUnarchivePatient = async (patient) => {
    const confirmed = window.confirm(
      `Unarchive ${patient.name}? The patient will be moved back to active patients.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await patientService.unarchivePatient(patient.id);
      await fetchPatients();
      await fetchStatistics();
      alert("Patient unarchived successfully!");
    } catch (error) {
      alert(error?.response?.data?.message || "Error unarchiving patient");
    }
  };

  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      email: patient.email,
      phone: patient.phone,
      education: patient.education,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (patient) => {
    setSelectedPatient(patient);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      gender: "Male",
      email: "",
      phone: "",
      education: "Bachelor",
    });
    setSelectedPatient(null);
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case "High":
        return "risk-badge-high";
      case "Moderate":
        return "risk-badge-moderate";
      case "Low":
        return "risk-badge-low";
      default:
        return "bg-gray-100 text-gray-800 border-2 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="patients-page" className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <span>🩺</span>
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Patient Management
            </span>
          </h1>
          <p className="text-gray-600">
            Manage and monitor your patient records
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Users}
            title="Total Patients"
            value={statistics.totalPatients}
            color="blue"
          />
          <StatCard
            icon={AlertCircle}
            title="High Risk"
            value={statistics.highRisk}
            color="red"
          />
          <StatCard
            icon={Activity}
            title="Moderate Risk"
            value={statistics.moderateRisk}
            color="yellow"
          />
          <StatCard
            icon={Activity}
            title="Low Risk"
            value={statistics.lowRisk}
            color="green"
          />
          <StatCard
            icon={Calendar}
            title="Not Assessed"
            value={statistics.notAssessed}
            color="gray"
          />
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "active"
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Active Patients ({activePatients.length})
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "archived"
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Archived Patients ({archivedPatients.length})
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              data-testid="patient-search"
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>

          {/* Risk Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              data-testid="patient-risk-filter"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="form-input"
            >
              <option value="all">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Patient</th>
                <th className="table-header-cell">Contact</th>
                <th className="table-header-cell">Demographics</th>
                <th className="table-header-cell">Risk Level</th>
                <th className="table-header-cell">Assessments</th>
                <th className="table-header-cell">Last Assessment</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold mr-3">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {patient.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {patient.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <p className="text-gray-900 flex items-center">
                          <Mail className="w-3 h-3 mr-1" /> {patient.email}
                        </p>
                        <p className="text-gray-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" /> {patient.phone}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          {patient.age} years, {patient.gender}
                        </p>
                        <p className="text-gray-500 flex items-center">
                          <GraduationCap className="w-3 h-3 mr-1" />{" "}
                          {patient.education}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell">
                      {patient.riskLevel ? (
                        <span
                          className={`${getRiskBadgeClass(
                            patient.riskLevel
                          )} px-2 py-1 rounded-full text-xs font-semibold`}
                        >
                          {patient.riskLevel}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Not Assessed
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="text-gray-900 font-semibold">
                        {patient.totalAssessments}
                      </span>
                    </td>
                    <td className="table-cell">
                      {patient.lastAssessment ? (
                        <span className="text-sm text-gray-600">
                          {patient.lastAssessment}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Never</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/assessment/${patient.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="New Assessment"
                          disabled={activeTab !== "active"}
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(patient)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit"
                          disabled={activeTab !== "active"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {activeTab === "active" ? (
                          <button
                            onClick={() => openDeleteModal(patient)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Archive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnarchivePatient(patient)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Unarchive"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="table-cell text-center py-8 text-gray-500"
                  >
                    {activeTab === "active"
                      ? "No active patients found. Add your first patient to get started!"
                      : "No archived patients found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <Modal
          title="Add New Patient"
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <PatientForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleAddPatient}
            onCancel={() => {
              setShowAddModal(false);
              resetForm();
            }}
            submitLabel="Add Patient"
          />
        </Modal>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && (
        <Modal
          title="Edit Patient"
          onClose={() => {
            setShowEditModal(false);
            resetForm();
          }}
        >
          <PatientForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditPatient}
            onCancel={() => {
              setShowEditModal(false);
              resetForm();
            }}
            submitLabel="Update Patient"
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPatient && (
        <Modal
          title="Archive Patient"
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedPatient(null);
          }}
        >
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <p className="text-center text-gray-700 mb-6">
              Are you sure you want to archive{" "}
              <strong>{selectedPatient.name}</strong>? This will mark the
              patient as inactive but preserve all assessment data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPatient(null);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePatient}
                className="btn-danger flex-1"
              >
                Archive Patient
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => {
  const Icon = icon;

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-4 hover:shadow-card-hover transition-shadow">
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

// Modal Component
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// Patient Form Component
const PatientForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitLabel,
}) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="form-label">Age *</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="form-input"
            placeholder="25"
            min="18"
            max="100"
            required
          />
        </div>

        <div>
          <label className="form-label">Gender *</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="form-label">Education Level *</label>
          <select
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="Matric / O-Levels">Matric / O-Levels</option>
            <option value="Intermediate / A-Levels">
              Intermediate / A-Levels
            </option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="Graduate">Graduate</option>
            <option value="Post-Graduate">Post-Graduate</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="form-label">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="john.doe@email.com"
            required
          />
        </div>

        <div>
          <label className="form-label">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-input"
            placeholder="+92-300-1234567"
            required
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          <Save className="w-5 h-5 mr-2 inline" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default PatientManagement;
