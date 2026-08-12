import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import { useBackendKeepAlive } from './hooks/useBackendKeepAlive';
import { AppLayout } from './components/layout/AppLayout';

// Lazy load pages for optimal initial bundle sizes (Best Practices)
const Login = lazy(() => import('./pages/Login'));
const Workspaces = lazy(() => import('./pages/Workspaces'));
const AgentCoordinator = lazy(() => import('./pages/AgentCoordinator'));
const TaskManagement = lazy(() => import('./pages/TaskManagement'));
const ScheduleOverlaps = lazy(() => import('./pages/ScheduleOverlaps'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Settings = lazy(() => import('./pages/Settings'));
const UserAdmin = lazy(() => import('./pages/admin/UserAdmin'));
const WorkspaceAdmin = lazy(() => import('./pages/admin/WorkspaceAdmin'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Verify = lazy(() => import('./pages/Verify'));

const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      height: '100%',
      minHeight: '200px',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: '14px',
      fontFamily: 'var(--font-sans)',
    }}
  >
    <span>Loading panel...</span>
  </div>
);

function App() {
  useBackendKeepAlive();

  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  Loading application...
                </div>
              }
            >
              <Routes>
                {/* Public Authenticated Landing Redirect */}
                <Route path="/" element={<Navigate to="/agent" replace />} />

                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/verify" element={<Verify />} />

                {/* Workspace Selection Guard Route */}
                <Route path="/workspaces" element={<Workspaces />} />

                {/* Private Routes with Global Shell Layout */}
                <Route element={<AppLayout />}>
                  <Route
                    path="/agent"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <AgentCoordinator />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/todo"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <TaskManagement />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ScheduleOverlaps />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/integrations"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Integrations />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Settings />
                      </Suspense>
                    }
                  />

                  {/* System Operator Role Gated Views */}
                  <Route
                    path="/admin/users"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <UserAdmin />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/admin/workspaces"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <WorkspaceAdmin />
                      </Suspense>
                    }
                  />
                </Route>

                {/* Catch-all Fallback (Not Found Page) */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
