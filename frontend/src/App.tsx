import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const Layout = lazy(() => import("./components/Layout"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ApiDocsPage = lazy(() => import("./pages/ApiDocsPage"));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen bg-gray-950 text-gray-300 grid place-items-center">
              Loading...
            </div>
          }
        >
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/docs" element={<ApiDocsPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/chat/:userId" element={<ChatPage />} />
              <Route path="/admin/moderation" element={<AdminPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/friends" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
