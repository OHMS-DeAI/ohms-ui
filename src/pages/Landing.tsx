import { useState } from 'react'
import Button from '../components/Button'
import SEOHead from '../components/SEOHead'

const Landing = () => {
  const [activeFeature, setActiveFeature] = useState(0)

  // Structured data for landing page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "OHMS - Autonomous AI Platform Landing Page",
    "description": "Professional landing page for OHMS AI platform featuring autonomous agents, advanced AI integration, and decentralized deployment",
    "url": "https://ohms.ai",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "OHMS",
      "description": "Autonomous AI agent platform with NOVAQ compression and advanced AI integration",
      "applicationCategory": "AI Platform",
      "operatingSystem": "Internet Computer Protocol",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Freemium model with subscription tiers"
      }
    }
  }

  const features = [
    {
      title: "AI Agent Creation",
      description: "Create autonomous AI agents from simple instructions. Our platform analyzes your requirements and builds customized agents that work independently.",
      demo: "/demo/agent-creation.gif",
      stats: "500+ Agents Created",
      icon: "🤖"
    },
    {
      title: "Multi-Agent Coordination",
      description: "Deploy multiple AI agents that coordinate seamlessly. Watch as they communicate, share tasks, and achieve complex objectives together.",
      demo: "/demo/coordination.gif",
      stats: "99.9% Uptime",
      icon: "🎯"
    },
    {
      title: "Real-time Chat Interface",
      description: "Interact with your AI agents through our intuitive chat interface. Get instant responses, track progress, and manage conversations effortlessly.",
      demo: "/demo/chat-interface.gif",
      stats: "1M+ Messages Processed",
      icon: "💬"
    },
    {
      title: "Advanced AI Integration",
      description: "Powered by cutting-edge AI infrastructure with enterprise-grade security and decentralized processing.",
      demo: "/demo/advanced-integration.gif",
      stats: "Enterprise Security",
      icon: "🔗"
    }
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "AI Research Lead",
      company: "TechCorp",
      content: "OHMS has revolutionized how we deploy AI agents. The autonomous coordination capabilities are unprecedented.",
      avatar: "/avatars/sarah-chen.jpg"
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO",
      company: "DeFi Solutions",
      content: "The advanced AI integration is seamless. Our agents are now more intelligent and cost-effective.",
      avatar: "/avatars/marcus-rodriguez.jpg"
    },
    {
      name: "Emily Watson",
      role: "Product Manager",
      company: "InnovateAI",
      content: "From instructions to autonomous operation in minutes. OHMS delivers on its promise of democratizing AI.",
      avatar: "/avatars/emily-watson.jpg"
    }
  ]

  return (
    <>
      <SEOHead
        title="OHMS - Autonomous AI Platform"
        description="Create autonomous AI agents with simple instructions. Powered by advanced AI and decentralized infrastructure. Professional AI platform for businesses and developers."
        keywords={['autonomous AI', 'AI agents', 'decentralized AI', 'blockchain AI', 'AI platform', 'smart agents']}
        canonical="/"
        ogImage="/ohms-landing-hero.png"
        ogType="website"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10"></div>
          <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
                <span className="bg-gradient-to-r from-secondary via-secondary-light to-accent bg-clip-text text-transparent">
                  OHMS
                </span>
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl text-text-secondary mb-4 font-light">
                Autonomous AI Agents
              </p>
              <p className="text-lg md:text-xl text-text-muted mb-8 max-w-2xl mx-auto">
                Create intelligent AI agents from simple instructions. Powered by advanced AI and decentralized infrastructure for the future of decentralized AI.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white border-none px-8 py-4 text-lg">
                  🚀 Try Demo
                </Button>
                <Button size="lg" variant="outline" className="border-secondary/50 text-secondary hover:bg-secondary/10 px-8 py-4 text-lg">
                  📖 Get Started
                </Button>
              </div>

              {/* Hero Image/Video Placeholder */}
              <div className="relative mx-auto max-w-4xl">
                <div className="aspect-video bg-gradient-to-br from-secondary/20 to-accent/20 rounded-2xl border border-secondary/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-text-secondary">Interactive Platform Demo</p>
                    <p className="text-text-muted text-sm">Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showcase */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Revolutionary AI Platform
              </h2>
              <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                Experience the future of AI with our comprehensive platform featuring autonomous agents, decentralized infrastructure, and seamless coordination.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Feature Navigation */}
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`w-full text-left p-6 rounded-xl transition-all duration-300 ${
                      activeFeature === index
                        ? 'bg-secondary/20 border border-secondary/50 shadow-lg'
                        : 'bg-surface/50 border border-border hover:bg-surface/80'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{feature.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-text-primary mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-text-secondary leading-relaxed">
                          {feature.description}
                        </p>
                        <div className="mt-3 text-sm text-accent font-medium">
                          {feature.stats}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Feature Demo */}
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-primary-dark to-primary-darker rounded-2xl border border-border flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{features[activeFeature].icon}</div>
                    <h3 className="text-2xl font-bold text-text-primary mb-2">
                      {features[activeFeature].title}
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Interactive Demo Coming Soon
                    </p>
                    <div className="bg-secondary/20 px-4 py-2 rounded-lg">
                      <span className="text-accent font-mono text-sm">
                        {features[activeFeature].stats}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof & Statistics */}
        <section className="py-20 bg-gradient-to-r from-secondary/5 to-accent/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Trusted by Leading Companies
              </h2>
              <p className="text-lg text-text-secondary">
                Join thousands of businesses already using OHMS for their AI needs
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">10K+</div>
                <div className="text-text-secondary">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">500+</div>
                <div className="text-text-secondary">AI Agents Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent-light mb-2">1M+</div>
                <div className="text-text-secondary">Messages Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent-success mb-2">99.9%</div>
                <div className="text-text-secondary">Uptime</div>
              </div>
            </div>

            {/* Integration Logos */}
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-text-secondary">Advanced AI</div>
              <div className="text-2xl font-bold text-text-secondary">Internet Computer</div>
              <div className="text-2xl font-bold text-text-secondary">NOVAQ</div>
              <div className="text-2xl font-bold text-text-secondary">Autonomous Agents</div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                What Our Users Say
              </h2>
              <p className="text-lg text-text-secondary">
                Hear from businesses already transforming their operations with OHMS
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-surface/50 border border-border rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-xl">
                      {testimonial.avatar ? (
                        <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        testimonial.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{testimonial.name}</h4>
                      <p className="text-sm text-text-secondary">{testimonial.role}</p>
                      <p className="text-sm text-text-muted">{testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-text-secondary italic">"{testimonial.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-text-secondary mb-8">
                Join the future of AI with OHMS. Create autonomous agents, coordinate complex workflows, and scale your operations like never before.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white border-none px-8 py-4 text-lg">
                  🚀 Start Building Today
                </Button>
                <Button size="lg" variant="outline" className="border-secondary/50 text-secondary hover:bg-secondary/10 px-8 py-4 text-lg">
                  📞 Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default Landing
