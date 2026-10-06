import { Outlet, NavLink, Link } from 'react-router-dom'
import { ArrowLeft, Home, Edit3, BarChart2, Award, TreePine, Trophy, User, Leaf } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

const navItems = [
  { path: '/app', icon: Home, label: '首页' },
  { path: '/record', icon: Edit3, label: '记录' },
  { path: '/data', icon: BarChart2, label: '数据' },
  { path: '/achievement', icon: Award, label: '成就' },
  { path: '/forest', icon: TreePine, label: '森林' },
  { path: '/leaderboard', icon: Trophy, label: '排行' },
  { path: '/profile', icon: User, label: '我的' },
]

export default function Layout() {
  const { user } = useAuth()

  return (
    <div className="app-shell">
      <video
        className="app-fixed-video"
        autoPlay
        muted
        loop
        playsInline
        poster={asset('videos/forest-background-poster.jpg')}
        aria-hidden="true"
      >
        <source src={asset('videos/forest-background.mp4')} type="video/mp4" />
      </video>
      <div className="app-fixed-shade" />

      <header className="app-header">
        <Link to="/" className="app-brand" aria-label="返回碳迹绿行导览主页">
          <span className="app-brand-mark">
            <Leaf className="h-5 w-5" />
          </span>
          <span>碳迹绿行</span>
        </Link>

        <Link to="/" className="app-back-link">
          <ArrowLeft className="h-4 w-4" />
          返回导览
        </Link>

        <div className="app-user-chip">
          <span>{user?.total_points ?? 0} 积分</span>
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
              {user?.nickname?.[0] ?? '?'}
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-bottom-nav" aria-label="功能体验导航">
        <div className="app-bottom-nav-inner">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'app-tab-link',
                  isActive ? 'app-tab-link-active' : 'app-tab-link-muted'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
