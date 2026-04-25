import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
import Layout from './components/Layout';

// Guard para rota privada
const PrivateRoute = ({ children }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Registration />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          {/* Rota genérica para pacientes (placeholder por enquanto) */}
          <Route 
            path="/pacientes" 
            element={
              <PrivateRoute>
                <Patients />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/pacientes/novo" 
            element={
              <PrivateRoute>
                <PatientForm />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/pacientes/:id" 
            element={
              <PrivateRoute>
                <PatientProfile />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
