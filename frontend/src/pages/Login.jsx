// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, Eye, EyeOff, AlertCircle, User, Building, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseNumber: '',
    specialization: '',
    institution: '',
  });

  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
  });

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleForgotPasswordChange = (e) => {
    setForgotPasswordData({ ...forgotPasswordData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(loginData.email, loginData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    
    setLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    const result = await register(registerData);
    
    if (result.success) {
      setSuccess('Registration successful! Please login with your credentials.');
      setTimeout(() => {
        setActiveTab('login');
        setSuccess('');
      }, 2000);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Simulate password reset email
    setTimeout(() => {
      setSuccess('Password reset instructions have been sent to your email.');
      setLoading(false);
      setTimeout(() => {
        setActiveTab('login');
        setSuccess('');
      }, 3000);
    }, 1500);
  };

  return (
    <div data-testid="login-page" className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-full mb-4">
            <Brain className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Compulysis</h1>
          <p className="text-primary-100 text-lg">OCD Risk Analyzer</p>
          <p className="text-primary-200 text-sm mt-2">Clinical Decision Support System</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              data-testid="login-tab"
              onClick={() => {
                setActiveTab('login');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${
                activeTab === 'login'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              data-testid="register-tab"
              onClick={() => {
                setActiveTab('register');
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${
                activeTab === 'register'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div data-testid="auth-error" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start animate-slide-up">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div data-testid="auth-success" className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start animate-slide-up">
                <AlertCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Welcome Back
                </h2>

                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      data-testid="login-email"
                      type="email"
                      name="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className="form-input pl-10"
                      placeholder="psychologist@compulysis.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      data-testid="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className="form-input pl-10 pr-12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      data-testid="toggle-login-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <button
                    data-testid="forgot-password-tab"
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                <button data-testid="login-submit" type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Create Account
                </h2>

                <div>
                  <label className="form-label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      data-testid="register-name"
                      type="text"
                      name="name"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      className="form-input pl-10"
                      placeholder="Dr. Ali"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      data-testid="register-email"
                      type="email"
                      name="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      className="form-input pl-10"
                      placeholder="email@hospital.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">License Number</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        data-testid="register-license-number"
                        type="text"
                        name="licenseNumber"
                        value={registerData.licenseNumber}
                        onChange={handleRegisterChange}
                        className="form-input pl-10"
                        placeholder="PSY-12345"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Specialization</label>
                    <select
                      data-testid="register-specialization"
                      name="specialization"
                      value={registerData.specialization}
                      onChange={handleRegisterChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Clinical Psychology">Clinical Psychology</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Counseling">Counseling</option>
                      <option value="Neuropsychology">Neuropsychology</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Institution</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      data-testid="register-institution"
                      type="text"
                      name="institution"
                      value={registerData.institution}
                      onChange={handleRegisterChange}
                      className="form-input pl-10"
                      placeholder="Pakistan Institute of Medical Sciences"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      data-testid="register-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      className="form-input pl-10 pr-12"
                      placeholder="Min. 8 characters"
                      required
                    />
                    <button
                      data-testid="toggle-register-password"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      data-testid="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      className="form-input pl-10 pr-12"
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      data-testid="toggle-register-confirm-password"
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button data-testid="register-submit" type="submit" disabled={loading} className="btn-primary w-full mt-6">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}

            {/* Forgot Password Form */}
            {activeTab === 'forgot' && (
              <form data-testid="forgot-password-form" onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Reset Password
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      data-testid="forgot-email"
                      type="email"
                      name="email"
                      value={forgotPasswordData.email}
                      onChange={handleForgotPasswordChange}
                      className="form-input pl-10"
                      placeholder="your.email@hospital.com"
                      required
                    />
                  </div>
                </div>

                <button data-testid="forgot-submit" type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← Back to Login
                </button>
              </form>
            )}

            {/* Footer Note */}
            {activeTab !== 'forgot' && (
              <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  <strong>Note:</strong> This platform is for authorized clinical psychologists only.
                  All data is encrypted and HIPAA compliant.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-primary-100 text-sm mt-6">
          © 2025 Compulysis. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;