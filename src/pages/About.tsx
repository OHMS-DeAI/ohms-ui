import { useState } from 'react'
import Button from '../components/Button'
import SEOHead from '../components/SEOHead'

const About = () => {
  const [activeSection, setActiveSection] = useState('story')

  // Structured data for About page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About OHMS - Autonomous AI Platform",
    "description": "Learn about OHMS mission to democratize AI through autonomous agents, Internet Computer Protocol, and DFINITY LLM integration",
    "url": "https://ohms.ai/about",
    "mainEntity": {
      "@type": "Organization",
      "name": "OHMS",
      "description": "Revolutionary autonomous AI platform democratizing access to intelligent agents",
      "foundingDate": "2024",
      "mission": "Create the world's first subscription-based autonomous agent platform",
      "technology": ["Internet Computer Protocol", "DFINITY LLM", "NOVAQ Compression", "Autonomous Agents"]
    }
  }

  const team = [
    {
      name: "Dedan Okware",
      role: "Project Lead & Founder",
      bio: "Full-stack developer with expertise in blockchain, AI, and decentralized systems. Passionate about democratizing access to advanced AI technologies.",
      image: "/team/dedan-okware.jpg",
      linkedin: "https://linkedin.com/in/dedan-okware",
      github: "https://github.com/dedan-okware"
    },
    {
      name: "AI Research Team",
      role: "Machine Learning Engineers",
      bio: "Our AI research team specializes in autonomous systems, natural language processing, and distributed computing architectures.",
      image: "/team/ai-research.jpg",
      skills: ["Machine Learning", "NLP", "Autonomous Systems", "Distributed Computing"]
    },
    {
      name: "Blockchain Engineers",
      role: "ICP & DFINITY Specialists",
      bio: "Experts in Internet Computer Protocol development, canister optimization, and decentralized application architecture.",
      image: "/team/blockchain-engineers.jpg",
      skills: ["Internet Computer", "Rust", "Canister Development", "Decentralized Systems"]
    },
    {
      name: "Full-Stack Developers",
      role: "Platform Architects",
      bio: "Skilled developers building the user interface, API integrations, and system orchestration for the OHMS platform.",
      image: "/team/fullstack-developers.jpg",
      skills: ["React", "TypeScript", "Node.js", "System Architecture"]
    }
  ]

  const technologies = [
    {
      name: "Internet Computer Protocol",
      description: "Decentralized cloud computing platform powering our autonomous agents with true decentralization and scalability.",
      icon: "🔗",
      benefits: ["True Decentralization", "Infinite Scalability", "Direct Integration", "No Downtime"]
    },
    {
      name: "DFINITY LLM",
      description: "Advanced large language model integration providing intelligent reasoning and natural language processing capabilities.",
      icon: "🧠",
      benefits: ["Advanced AI", "Natural Language", "Context Awareness", "Real-time Processing"]
    },
    {
      name: "NOVAQ Compression",
      description: "Revolutionary model compression technology achieving 93-100x reduction while maintaining model performance.",
      icon: "⚡",
      benefits: ["Extreme Compression", "Performance Preservation", "Edge Deployment", "Cost Efficiency"]
    },
    {
      name: "Autonomous Coordination",
      description: "Multi-agent orchestration system enabling complex task completion through intelligent agent collaboration.",
      icon: "🤝",
      benefits: ["Multi-Agent Systems", "Intelligent Routing", "Task Orchestration", "Seamless Collaboration"]
    }
  ]

  return (
    <>
      <SEOHead
        title="About OHMS - Autonomous AI Platform"
        description="Discover OHMS mission to democratize AI through autonomous agents, Internet Computer Protocol, and DFINITY LLM integration. Learn about our technology stack and team."
        keywords={['about OHMS', 'autonomous AI', 'Internet Computer', 'DFINITY', 'AI platform', 'decentralized AI', 'team']}
        canonical="/about"
        ogImage="/ohms-about-hero.png"
        ogType="website"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10"></div>
          <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-secondary via-secondary-light to-accent bg-clip-text text-transparent">
                  About OHMS
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-text-secondary mb-8">
                Democratizing AI through autonomous agents and decentralized infrastructure
              </p>
              <p className="text-lg text-text-muted max-w-3xl mx-auto">
                We're building the future of AI accessibility, where anyone can create and deploy intelligent autonomous agents
                without technical barriers, powered by the Internet Computer Protocol and DFINITY LLM.
              </p>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex justify-center">
              <div className="bg-surface/30 backdrop-blur-sm rounded-xl p-2 border border-border">
                <div className="flex space-x-2">
                  {[
                    { id: 'story', label: 'Our Story', icon: '📖' },
                    { id: 'technology', label: 'Technology', icon: '⚙️' },
                    { id: 'team', label: 'Team', icon: '👥' },
                    { id: 'values', label: 'Values', icon: '💎' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSection(tab.id)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                        activeSection === tab.id
                          ? 'bg-secondary text-white shadow-lg'
                          : 'text-text-secondary hover:bg-secondary/20 hover:text-secondary'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {activeSection === 'story' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                    Our Story
                  </h2>
                  <p className="text-xl text-text-secondary">
                    From vision to reality: Building the autonomous AI revolution
                  </p>
                </div>

                <div className="space-y-12">
                  <div className="bg-surface/50 border border-border rounded-xl p-8">
                    <h3 className="text-2xl font-bold text-secondary mb-4">The Vision</h3>
                    <p className="text-text-secondary leading-relaxed mb-6">
                      OHMS was born from a simple yet powerful realization: the future of AI should be accessible to everyone,
                      not just large corporations with unlimited resources. We envisioned a world where entrepreneurs,
                      developers, and businesses of all sizes could harness the power of autonomous AI agents without
                      the technical complexity or prohibitive costs typically associated with advanced AI systems.
                    </p>
                    <div className="bg-secondary/10 border-l-4 border-secondary p-4 rounded">
                      <p className="text-secondary font-medium italic">
                        "AI should empower everyone, not just the elite few with deep pockets and technical expertise."
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-surface/50 border border-border rounded-xl p-8">
                      <h4 className="text-xl font-bold text-accent mb-4">The Challenge</h4>
                      <ul className="space-y-3 text-text-secondary">
                        <li className="flex items-start gap-3">
                          <span className="text-red-400 mt-1">•</span>
                          <span>AI deployment requires expensive infrastructure and technical expertise</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-400 mt-1">•</span>
                          <span>Autonomous agents are complex to build and maintain</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-400 mt-1">•</span>
                          <span>Centralized AI systems create single points of failure</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-red-400 mt-1">•</span>
                          <span>Limited accessibility for small businesses and individuals</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-surface/50 border border-border rounded-xl p-8">
                      <h4 className="text-xl font-bold text-accent-success mb-4">Our Solution</h4>
                      <ul className="space-y-3 text-text-secondary">
                        <li className="flex items-start gap-3">
                          <span className="text-green-400 mt-1">•</span>
                          <span>Instruction-based agent creation with natural language</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-green-400 mt-1">•</span>
                          <span>Decentralized infrastructure on Internet Computer Protocol</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-green-400 mt-1">•</span>
                          <span>Autonomous coordination and intelligent routing</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-green-400 mt-1">•</span>
                          <span>Transparent pricing and fair usage policies</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'technology' && (
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                    Technology Stack
                  </h2>
                  <p className="text-xl text-text-secondary">
                    Cutting-edge technologies powering the autonomous AI revolution
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {technologies.map((tech, index) => (
                    <div key={index} className="bg-surface/50 border border-border rounded-xl p-8 hover:bg-surface/80 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{tech.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-text-primary mb-3">
                            {tech.name}
                          </h3>
                          <p className="text-text-secondary leading-relaxed mb-4">
                            {tech.description}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {tech.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-accent text-sm">✓</span>
                                <span className="text-sm text-text-secondary">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-16 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-2xl p-8 border border-secondary/20">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-text-primary mb-4">
                      Performance Metrics
                    </h3>
                    <p className="text-text-secondary">
                      Real-world performance benchmarks demonstrating our technological excellence
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary mb-2">93-100x</div>
                      <div className="text-sm text-text-secondary">Model Compression</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent mb-2">&lt;2s</div>
                      <div className="text-sm text-text-secondary">Agent Creation Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent-light mb-2">99.9%</div>
                      <div className="text-sm text-text-secondary">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent-success mb-2">∞</div>
                      <div className="text-sm text-text-secondary">Scalability</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'team' && (
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                    Meet Our Team
                  </h2>
                  <p className="text-xl text-text-secondary">
                    Passionate experts driving the autonomous AI revolution
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {team.map((member, index) => (
                    <div key={index} className="bg-surface/50 border border-border rounded-xl p-8">
                      <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                          {member.image ? (
                            <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-text-primary mb-2">
                            {member.name}
                          </h3>
                          <p className="text-secondary font-medium mb-3">{member.role}</p>
                          <p className="text-text-secondary leading-relaxed mb-4">
                            {member.bio}
                          </p>
                          {member.skills && (
                            <div className="flex flex-wrap gap-2">
                              {member.skills.map((skill, idx) => (
                                <span key={idx} className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'values' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                    Our Values
                  </h2>
                  <p className="text-xl text-text-secondary">
                    Principles guiding our mission to democratize AI
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl p-8">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">🌍</span>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary mb-3">Decentralization</h3>
                        <p className="text-text-secondary leading-relaxed">
                          We believe in true decentralization as the foundation for a fair and accessible AI ecosystem.
                          No single points of failure, no corporate control over AI capabilities.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-8">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">🚀</span>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary mb-3">Innovation</h3>
                        <p className="text-text-secondary leading-relaxed">
                          Constantly pushing the boundaries of what's possible with AI and blockchain technology.
                          Our team stays at the forefront of technological advancement.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-accent-light/10 to-accent-light/5 border border-accent-light/20 rounded-xl p-8">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">🤝</span>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary mb-3">Accessibility</h3>
                        <p className="text-text-secondary leading-relaxed">
                          Making advanced AI technology accessible to everyone, regardless of technical background or resources.
                          Breaking down barriers and democratizing innovation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-accent-success/10 to-accent-success/5 border border-accent-success/20 rounded-xl p-8">
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">🔒</span>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary mb-3">Trust & Security</h3>
                        <p className="text-text-secondary leading-relaxed">
                          Building systems that users can trust with their data and operations. Security-first approach
                          with transparent operations and verifiable decentralization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Join the Autonomous AI Revolution
              </h2>
              <p className="text-lg text-text-secondary mb-8">
                Be part of the future where AI works for everyone, not just the privileged few.
                Experience the power of autonomous agents on the Internet Computer Protocol.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white border-none px-8 py-4 text-lg">
                  🚀 Start Building Today
                </Button>
                <Button size="lg" variant="outline" className="border-secondary/50 text-secondary hover:bg-secondary/10 px-8 py-4 text-lg">
                  📖 Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default About
