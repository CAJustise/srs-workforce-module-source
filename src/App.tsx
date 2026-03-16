import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/Admin/AdminLayout';
import Dashboard from './components/Admin/Dashboard';
import WorkforceManagement from './components/Admin/WorkforceManagement';
import LoginPage from './components/Auth/LoginPage';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/host/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/staff/login" element={<Navigate to="/admin/login" replace />} />

        <Route
          path="/admin"
          element={
            <AdminLayout requiredSection="operations">
              <Dashboard />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/workforce"
          element={
            <AdminLayout requiredSection="workforce" requiredCapability="schedule_write">
              <WorkforceManagement />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/workforce/log-archive"
          element={
            <AdminLayout requiredSection="workforce" requiredCapability="schedule_write">
              <WorkforceManagement archiveOnly />
            </AdminLayout>
          }
        />

        <Route path="/admin/team-members" element={<Navigate to="/admin/workforce" replace />} />
        <Route path="/admin/workforce/team-access" element={<Navigate to="/admin/workforce" replace />} />
        <Route path="/host/*" element={<Navigate to="/admin/login" replace />} />
        <Route path="/staff/*" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
