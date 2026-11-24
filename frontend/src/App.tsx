
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import Signup from './pages/signup'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/home'
import CreateDecision from './pages/CreateDecision'
import ExploreDecisions from './pages/ExploreDecision'
import DecisionDetails from './pages/DecisionDetails'
import EditDecision from './pages/EditDecisions'
import VersionHistory from './pages/VersionHistory'
import CompareVersions from './pages/CompareVersions'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/decisions/new" element={<CreateDecision />} />
          <Route path="/decisions" element={<ExploreDecisions />} />
          <Route path="/decisions/:id/history" element={<VersionHistory />} />
          <Route path="/decisions/:id/edit" element={<EditDecision />} />
          <Route path="/decisions/:id" element={<DecisionDetails />} />
          <Route path="/decisions/:id/compare" element={<CompareVersions />} />
        </Route>


      </Routes>

    </BrowserRouter>
  )
}

export default App
