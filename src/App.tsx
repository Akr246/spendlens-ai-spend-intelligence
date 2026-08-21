import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import AppShell from './components/AppShell'
import { useStore } from './store/store'
import CaseStudy from './pages/CaseStudy'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import RedPriority from './pages/RedPriority'
import GreenPriority from './pages/GreenPriority'
import Transactions from './pages/Transactions'
import Goals from './pages/Goals'
import Insights from './pages/Insights'
import Forecast from './pages/Forecast'
import Settings from './pages/Settings'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Shell({ children }: { children: React.ReactNode }) {
  const { profile } = useStore()
  if (!profile.onboarded) return <Navigate to="/onboarding" replace />
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<CaseStudy />} />
        <Route path="/case-study" element={<CaseStudy />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<Shell><Dashboard /></Shell>} />
        <Route path="/red" element={<Shell><RedPriority /></Shell>} />
        <Route path="/green" element={<Shell><GreenPriority /></Shell>} />
        <Route path="/transactions" element={<Shell><Transactions /></Shell>} />
        <Route path="/goals" element={<Shell><Goals /></Shell>} />
        <Route path="/insights" element={<Shell><Insights /></Shell>} />
        <Route path="/forecast" element={<Shell><Forecast /></Shell>} />
        <Route path="/settings" element={<Shell><Settings /></Shell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
