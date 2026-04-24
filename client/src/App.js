import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import UserManagement from "./components/UserManagement";
import Clients from "./components/Clients";
import Pipeline from "./components/Pipeline";
import Tasks from "./components/Tasks";
import Invoices from "./components/Invoices";
import InvoiceDetail from "./components/InvoiceDetail";
import Finance from "./components/Finance";
import HRManagement from "./components/HRManagement";
import PublicQuoteAcceptance from "./components/PublicQuoteAcceptance";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/quote/accept/:token"
            element={<PublicQuoteAcceptance />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RoleBasedRoute
                    allowedRoles={["super_admin", "administrateur", "manager"]}
                  >
                    <UserManagement />
                  </RoleBasedRoute>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RoleBasedRoute
                    allowedRoles={[
                      "super_admin",
                      "administrateur",
                      "manager",
                      "commercial",
                      "comptable",
                    ]}
                  >
                    <Clients />
                  </RoleBasedRoute>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prospects"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RoleBasedRoute
                    allowedRoles={[
                      "super_admin",
                      "administrateur",
                      "manager",
                      "commercial",
                      "comptable",
                    ]}
                  >
                    <Pipeline />
                  </RoleBasedRoute>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Tasks />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RoleBasedRoute
                    allowedRoles={[
                      "super_admin",
                      "administrateur",
                      "manager",
                      "commercial",
                      "comptable",
                    ]}
                  >
                    <Invoices />
                  </RoleBasedRoute>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RoleBasedRoute
                    allowedRoles={[
                      "super_admin",
                      "administrateur",
                      "manager",
                      "commercial",
                      "comptable",
                    ]}
                  >
                    <InvoiceDetail />
                  </RoleBasedRoute>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/finances"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RoleBasedRoute
                    allowedRoles={[
                      "super_admin",
                      "administrateur",
                      "manager",
                      "comptable",
                    ]}
                  >
                    <Finance />
                  </RoleBasedRoute>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RoleBasedRoute
                    allowedRoles={[
                      "super_admin",
                      "administrateur",
                      "manager",
                      "employe",
                    ]}
                  >
                    <HRManagement />
                  </RoleBasedRoute>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
