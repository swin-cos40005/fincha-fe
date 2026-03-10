'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  MessageSquareText,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/app/_components/theme-toggle'

function Logo({ size = 30 }: { size?: number }) {
  return (
    <>
      <Image
        src="/logo-light.png"
        alt="Fincha"
        width={size}
        height={size}
        className="object-contain block dark:hidden"
        priority
      />
      <Image
        src="/logo-dark.png"
        alt="Fincha"
        width={size}
        height={size}
        className="object-contain hidden dark:block"
        priority
      />
    </>
  )
}

function AnimatedSection({
  children,
  className = '',
  delay = 0
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const features = [
  {
    icon: BrainCircuit,
    title: 'AI-Powered Analysis',
    description:
      'Advanced language models analyze market data, financial reports, and economic indicators to deliver actionable insights.'
  },
  {
    icon: MessageSquareText,
    title: 'Conversational Interface',
    description:
      'Ask questions in plain English. Get clear, contextual answers about stocks, portfolios, and market trends.'
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Market Data',
    description:
      'Stay ahead with live market feeds, price alerts, and instant analysis of breaking financial news.'
  },
  {
    icon: Shield,
    title: 'Risk Assessment',
    description:
      'Understand your portfolio risk exposure with intelligent analysis tailored to your investment profile.'
  },
  {
    icon: BarChart3,
    title: 'Portfolio Insights',
    description:
      'Get comprehensive breakdowns of your holdings, diversification metrics, and rebalancing suggestions.'
  },
  {
    icon: Zap,
    title: 'Instant Answers',
    description:
      'No more sifting through pages of data. Get the exact financial information you need in seconds.'
  }
]

const steps = [
  {
    number: '01',
    title: 'Connect Your Accounts',
    description:
      'Sign up in seconds and optionally link your brokerage accounts for personalized insights.'
  },
  {
    number: '02',
    title: 'Ask Anything',
    description:
      'Chat naturally about investments, market trends, financial planning, or any money question on your mind.'
  },
  {
    number: '03',
    title: 'Get Smarter Insights',
    description:
      'Receive AI-powered analysis backed by real data, helping you make confident financial decisions.'
  }
]

const testimonials = [
  {
    quote:
      'Fincha completely changed how I research stocks. Instead of spending hours reading reports, I just ask and get exactly what I need.',
    name: 'Sarah Chen',
    role: 'Individual Investor',
    avatar: 'SC'
  },
  {
    quote:
      'The portfolio risk analysis is incredible. It caught a concentration risk I had completely overlooked. Saved me from a significant loss.',
    name: 'Marcus Rivera',
    role: 'Portfolio Manager',
    avatar: 'MR'
  },
  {
    quote:
      "As someone new to investing, Fincha makes complex financial concepts accessible. It's like having a patient financial advisor available 24/7.",
    name: 'Aisha Patel',
    role: 'First-Time Investor',
    avatar: 'AP'
  }
]

function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="text-lg font-bold tracking-tight">Fincha</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#testimonials"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonials
          </a>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Log In
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">
              Get Started
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/4 -right-1/4 size-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3" />
              AI-Powered Financial Advisor
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          >
            Your Finances,{' '}
            <span className="text-primary">Simplified</span>
            <br />
            by AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Fincha is your intelligent financial companion. Ask questions, analyze
            markets, and make smarter investment decisions — all through a
            simple conversation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/chat">
              <Button size="lg" className="h-12 px-8 text-base">
                Start Chatting Free
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
              >
                See How It Works
              </Button>
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <div className="size-3 rounded-full bg-red-400/80" />
              <div className="size-3 rounded-full bg-yellow-400/80" />
              <div className="size-3 rounded-full bg-green-400/80" />
              <span className="ml-2 text-xs text-muted-foreground">
                Fincha AI Chat
              </span>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Users className="size-4 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm">
                  What are the top performing tech stocks this quarter and should
                  I rebalance my portfolio?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="size-4 text-primary-foreground" />
                </div>
                <div className="max-w-lg space-y-2 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 text-sm">
                  <p>
                    Based on Q4 data, the top performers in tech include:
                  </p>
                  <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span>NVDA</span>
                      <span className="text-green-500">+42.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>META</span>
                      <span className="text-green-500">+31.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MSFT</span>
                      <span className="text-green-500">+18.2%</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Your portfolio is 68% tech-weighted. I&apos;d recommend
                    rebalancing to reduce sector concentration risk...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function StatsBar() {
  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '2M+', label: 'Questions Answered' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' }
  ]

  return (
    <section className="border-y border-border/50 bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        {stats.map((stat, i) => (
          <AnimatedSection key={stat.label} delay={i * 0.1}>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need for smarter investing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powered by advanced AI, Fincha gives you institutional-grade
            financial analysis through a simple chat interface.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <AnimatedSection key={feature.title} delay={i * 0.08}>
              <div className="group relative h-full rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-y border-border/50 bg-muted/30 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Get started in three simple steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From sign-up to your first insight in under two minutes.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <AnimatedSection key={step.number} delay={i * 0.15}>
              <div className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute top-8 left-[calc(50%+3rem)] hidden h-px w-[calc(100%-6rem)] bg-gradient-to-r from-primary/40 to-primary/10 md:block" />
                )}
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                  {step.number}
                </div>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Testimonials
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by investors everywhere
          </h2>
        </AnimatedSection>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} delay={i * 0.1}>
              <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-6">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      className="size-4 fill-primary text-primary"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="border-t border-border/50 bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center md:px-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 -right-24 size-64 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/10 blur-2xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                Ready to transform your financial journey?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/80">
                Join thousands of investors who use Fincha to make smarter,
                data-driven financial decisions every day.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/chat">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 px-8 text-base font-semibold"
                  >
                    Start Free Today
                    <ChevronRight className="ml-1.5 size-4" />
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-primary-foreground/60">
                No credit card required. Free forever for basic features.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={32} />
              <span className="text-lg font-bold tracking-tight">Fincha</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-powered financial advice that helps you make smarter investment
              decisions.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-3 space-y-2.5">
              <li>
                <a
                  href="#features"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Testimonials
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2.5">
              <li>
                <span className="text-sm text-muted-foreground">About</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Careers</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Blog</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-3 space-y-2.5">
              <li>
                <span className="text-sm text-muted-foreground">Privacy</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Terms</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Security</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Fincha. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Fincha provides AI-generated financial information, not professional
            financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}

export function Homepage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
