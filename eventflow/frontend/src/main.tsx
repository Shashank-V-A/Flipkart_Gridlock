import { lazy, Suspense } from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ApiWarmupProvider } from './context/ApiWarmupContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'

const ChatAgent = lazy(() => import('./pages/ChatAgent'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MapPage = lazy(() => import('./pages/MapPage'))
const EventPlanner = lazy(() => import('./pages/EventPlanner'))
const LearningPage = lazy(() => import('./pages/LearningPage'))

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

function PageLoader() {
  return (
    <div className="app-bg flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
        <p className="text-sm text-[var(--color-muted)]">Loading…</p>
      </div>
    </div>
  )
}

if (!googleClientId) {
  console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google sign-in will not work.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId ?? ''}>
      <AuthProvider>
        <ApiWarmupProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route
                    path="/agent"
                    element={<Suspense fallback={<PageLoader />}><ChatAgent /></Suspense>}
                  />
                  <Route
                    path="/"
                    element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>}
                  />
                  <Route
                    path="/map"
                    element={<Suspense fallback={<PageLoader />}><MapPage /></Suspense>}
                  />
                  <Route
                    path="/planner"
                    element={<Suspense fallback={<PageLoader />}><EventPlanner /></Suspense>}
                  />
                  <Route
                    path="/learning"
                    element={<Suspense fallback={<PageLoader />}><LearningPage /></Suspense>}
                  />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/agent" replace />} />
            </Routes>
          </BrowserRouter>
        </ApiWarmupProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
