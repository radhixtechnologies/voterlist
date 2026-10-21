import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useToast } from './context/ToastContext.jsx';

// Nav and common components
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import ForcedPasswordResetModal from './components/ForcedPasswordResetModal.jsx';
import LoginPage from './pages/LoginPage.jsx';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard.jsx';
import AdminManagementPage from './pages/super-admin/AdminManagementPage.jsx';
import AssociateManagementPage from './pages/super-admin/AssociateManagementPage.jsx';
import AllVotersPage from './pages/super-admin/AllVotersPage.jsx';
import ReportsPage from './pages/super-admin/ReportsPage.jsx';
import AuditLogsPage from './pages/super-admin/AuditLogsPage.jsx';
import SettingsPage from './pages/super-admin/SettingsPage.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminAssociatesPage from './pages/admin/AdminAssociatesPage.jsx';
import AdminVotersPage from './pages/admin/AdminVotersPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminProfilePage from './pages/admin/AdminProfilePage.jsx';

// Associate Member Pages
import AssociateDashboard from './pages/associate/AssociateDashboard.jsx';
import RegisterVoterPage from './pages/associate/RegisterVoterPage.jsx';
import AssociateVotersPage from './pages/associate/AssociateVotersPage.jsx';

// Voter Pages
import VoterDashboard from './pages/voter/VoterDashboard.jsx';
import VoterProfilePage from './pages/voter/VoterProfilePage.jsx';
import VoterSecurityPage from './pages/voter/VoterSecurityPage.jsx';

export default function App() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const { addToast } = useToast();

  const [currentPath, setCurrentPath] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Reset to 'overview' whenever user role changes
  useEffect(() => {
    setCurrentPath('overview');
  }, [user?.role]);

  // Quick switch role demo handler
  const handleQuickSwitchRole = async (identifier) => {
    try {
      const password = identifier === 'VOTER10026' ? 'Vote#8921' : 'Password@123';
      const res = await login(identifier, password);
      setCurrentPath('overview');
      addToast(`Switched to ${res.user.name} (${res.user.role})`, 'info');
    } catch (err) {
      addToast(err.message || 'Failed to switch role.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wider text-slate-300 uppercase">Loading CivicPulse Portal...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Derive current page title
  const getPageTitle = () => {
    switch (currentPath) {
      case 'overview':
        return user?.role === 'VOTER' ? 'My Voter Dashboard' : 'Dashboard Overview';
      case 'voters':
        return user?.role === 'ASSOCIATE_MEMBER' ? 'Registered Citizens' : 'Voter Records Directory';
      case 'admins':
        return 'Admin Management';
      case 'associates':
        return 'Associate Field Members';
      case 'reports':
        return 'Analytics & Reports';
      case 'audit':
        return 'Activity & Audit Trail';
      case 'settings':
        return 'Portal Configuration';
      case 'register-voter':
        return 'Register New Voter';
      case 'profile':
        return 'Account Profile';
      case 'security':
        return 'Security & Credentials';
      default:
        return 'Portal';
    }
  };

  // Render role-specific page
  const renderCurrentView = () => {
    const role = user?.role;

    if (role === 'SUPER_ADMIN') {
      switch (currentPath) {
        case 'overview':
          return <SuperAdminDashboard onNavigate={setCurrentPath} />;
        case 'voters':
          return <AllVotersPage />;
        case 'admins':
          return <AdminManagementPage />;
        case 'associates':
          return <AssociateManagementPage />;
        case 'reports':
          return <ReportsPage />;
        case 'audit':
          return <AuditLogsPage />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <SuperAdminDashboard onNavigate={setCurrentPath} />;
      }
    }

    if (role === 'ADMIN') {
      switch (currentPath) {
        case 'overview':
          return <AdminDashboard onNavigate={setCurrentPath} />;
        case 'associates':
          return <AdminAssociatesPage />;
        case 'voters':
          return <AdminVotersPage />;
        case 'reports':
          return <AdminReportsPage />;
        case 'profile':
          return <AdminProfilePage />;
        default:
          return <AdminDashboard onNavigate={setCurrentPath} />;
      }
    }

    if (role === 'ASSOCIATE_MEMBER') {
      switch (currentPath) {
        case 'overview':
          return <AssociateDashboard onNavigate={setCurrentPath} />;
        case 'register-voter':
          return <RegisterVoterPage onNavigate={setCurrentPath} />;
        case 'voters':
          return <AssociateVotersPage />;
        default:
          return <AssociateDashboard onNavigate={setCurrentPath} />;
      }
    }

    if (role === 'VOTER') {
      switch (currentPath) {
        case 'overview':
          return <VoterDashboard onNavigate={setCurrentPath} />;
        case 'profile':
          return <VoterProfilePage />;
        case 'security':
          return <VoterSecurityPage />;
        default:
          return <VoterDashboard onNavigate={setCurrentPath} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          pageTitle={getPageTitle()}
          onOpenMobile={() => setIsMobileNavOpen(true)}
          onQuickSwitchRole={handleQuickSwitchRole}
        />

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mandatory Password Reset Modal (for 1st time voter logins) */}
      <ForcedPasswordResetModal />
    </div>
  );
}

