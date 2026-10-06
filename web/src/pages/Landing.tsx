import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Leaf,
  QrCode,
  Sprout,
  TreePine,
  Trophy,
} from 'lucide-react'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
const typedPhrase = '变成可见的成长'

const journeySteps = [
  {
    title: '认识碳足迹',
    text: '先理解通勤、饮食、用电与循环行为如何影响每天的碳评分。',
    icon: Leaf,
  },
  {
    title: '记录一次行动',
    text: '选择今天的出行、饮食和生活状态，几秒钟完成一次低碳打卡。',
    icon: Edit3,
  },
  {
    title: '点亮绿色森林',
    text: '每次记录都会转化为积分和树木成长，让减排反馈变得可见。',
    icon: TreePine,
  },
  {
    title: '加入低碳挑战',
    text: '用挑战、排行榜和成就机制，把环保行动变成持续习惯。',
    icon: Trophy,
  },
]

const featureSections = [
  {
    title: '行为记录',
    text: '围绕通勤、饮食、居家和循环利用设计轻量记录流程。用户不用填写复杂表单，只要完成一次选择，就能得到即时反馈。',
    image: 'images/forest-illustration.svg',
    icon: Edit3,
    link: '/record',
    action: '进入记录页',
  },
  {
    title: '数据洞察',
    text: '把一周内的碳评分、低碳积分和行为偏好整理成清晰趋势，让用户知道自己在哪些环节已经进步。',
    image: 'images/forest-illustration.svg',
    icon: BarChart2,
    link: '/data',
    action: '查看数据页',
  },
  {
    title: '虚拟森林',
    text: '每一次低碳选择都会形成树木成长反馈。森林页面承担长期激励，让用户看见自己的绿色资产。',
    image: 'images/forest-illustration.svg',
    icon: Sprout,
    link: '/forest',
    action: '查看森林页',
  },
  {
    title: '挑战与成就',
    text: '用每日挑战、徽章和排行榜制造正向动力。适合校园传播，也适合后续扩展到社群活动。',
    image: 'images/forest-illustration.svg',
    icon: Award,
    link: '/achievement',
    action: '查看成就页',
  },
]

export default function Landing() {
  const [typedText, setTypedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!isDeleting && typedText === typedPhrase) {
      const hold = window.setTimeout(() => {
        setIsDeleting(true)
      }, 1300)

      return () => window.clearTimeout(hold)
    }

    if (isDeleting) {
      if (!typedText) {
        setIsDeleting(false)
        return
      }

      const next = window.setTimeout(() => {
        setTypedText((current) => current.slice(0, -1))
      }, 46)

      return () => window.clearTimeout(next)
    }

    const timer = window.setTimeout(() => {
      setTypedText(typedPhrase.slice(0, typedText.length + 1))
    }, 92)

    return () => window.clearTimeout(timer)
  }, [isDeleting, typedText])

  return (
    <div className="landing-page">
      <img className="landing-fixed-video" src={asset('images/forest-illustration.svg')} alt="" aria-hidden="true" />
      <div className="landing-fixed-shade" />

      <section className="landing-hero" id="top">
        <header className="landing-header">
          <a href="#top" className="landing-brand" aria-label="碳迹绿行首页">
            <span className="landing-brand-mark">
              <Leaf className="h-5 w-5" />
            </span>
            <span>碳迹绿行</span>
          </a>
          <nav className="landing-nav" aria-label="页面导航">
            <a href="#guide">引导</a>
            <a href="#features">功能</a>
            <a href="#miniapp">小程序</a>
          </nav>
          <Link to="/app" className="landing-header-action">
            进入 Web 体验
          </Link>
        </header>

        <div className="landing-hero-inner">
          <div className="landing-copy-panel">
            <h1 aria-label="把一次低碳选择，变成可见的成长">
              <span className="landing-title-row landing-title-static">
                把一次
                <span className="landing-title-green">低碳选择</span>
              </span>
              <span className="landing-typing-line">
                {typedText.trim() || typedPhrase.slice(0, 1)}
                <i aria-hidden="true" />
              </span>
            </h1>
            <p>
              记录通勤、饮食、用电与循环行为，让碳减排、绿色能量和虚拟森林在同一条路径里发生。
            </p>
            <div className="landing-prompt">
              <span>今天想记录什么低碳行为？</span>
              <Link to="/record" aria-label="开始记录低碳行为">
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="landing-actions">
              <a href="#guide" className="landing-primary-action">
                开始引导
                <ChevronDown className="h-5 w-5" />
              </a>
              <a href="#features" className="landing-secondary-action">
                查看功能
              </a>
              <Link to="/app" className="landing-secondary-action">
                进入体验
              </Link>
            </div>
          </div>

          <div className="landing-status-panel" aria-label="产品核心反馈预览">
            <div>
              <span className="landing-status-label">今日概览</span>
              <strong>2.34 kg CO₂e</strong>
            </div>
            <div className="landing-line-chart">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="landing-status-row">
              <CheckCircle2 className="h-5 w-5" />
              <span>低碳能量 +560</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-guide" id="guide">
        <div className="landing-section-heading">
          <h2>从这里开始你的低碳旅程</h2>
          <p>官网先解释路径，小程序承接真实行动；用户向下滑就能逐步理解产品。</p>
        </div>
        <div className="landing-journey">
          {journeySteps.map((step, index) => (
            <article className="landing-journey-card" key={step.title}>
              <span className="landing-step-number">{String(index + 1).padStart(2, '0')}</span>
              <step.icon className="h-7 w-7" />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-features" id="features">
        {featureSections.map((feature) => (
          <article className="landing-feature-panel" key={feature.title}>
            <div className="landing-feature-copy">
              <feature.icon className="h-8 w-8 text-emerald-300" />
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
              <Link to={feature.link}>
                {feature.action}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="landing-feature-media">
              <img src={asset(feature.image)} alt={feature.title} />
            </div>
          </article>
        ))}
      </section>

      <section className="landing-section landing-miniapp" id="miniapp">
        <div className="landing-miniapp-panel">
          <div>
            <QrCode className="h-9 w-9 text-emerald-300" />
            <h2>项目已停止服务，源码开放阅读</h2>
            <p>
              这里保留曾经开发的双端实现。原小程序与 Web 服务均已停止，公开源码用于展示与学习。
            </p>
            <Link to="/app" className="landing-secondary-action">
              查看本地 Web 功能
            </Link>
          </div>
          <img src={asset('images/forest-illustration.svg')} alt="森林插画" />
        </div>
      </section>
    </div>
  )
}
