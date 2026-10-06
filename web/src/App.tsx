import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import AIFloating from './components/AIFloating'
import AuthGuard from './components/AuthGuard'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Record from './pages/Record'
import Data from './pages/Data'
import Achievement from './pages/Achievement'
import Forest from './pages/Forest'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'

function App() {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="min-h-screen bg-dark text-white">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }>
          <Route path="app" element={<Home />} />
          <Route path="record" element={<Record />} />
          <Route path="data" element={<Data />} />
          <Route path="achievement" element={<Achievement />} />
          <Route path="forest" element={<Forest />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
      {!isLanding && !isAuthPage && <AIFloating />}
    </div>
  )
}

export default App
