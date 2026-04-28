import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import DoctorDashboard from '../components/dashboard/DoctorDashboard';
import PatientDashboard from '../components/dashboard/PatientDashboard';
import PharmacistDashboard from '../components/dashboard/PharmacistDashboard';

const Dashboard = () => {
  const { userRole } = useAuth();

  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'patient':
        return <PatientDashboard />;
      case 'pharmacist':
        return <PharmacistDashboard />;
      default:
        return <div>Invalid Role</div>;
    }
  };

  return (
    <div className="w-full">
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
