import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import ChatAgent from './pages/ChatAgent'
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import EventPlanner from './pages/EventPlanner'
import LearningPage from './pages/LearningPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/agent" element={<ChatAgent />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/planner" element={<EventPlanner />} />
          <Route path="/learning" element={<LearningPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
