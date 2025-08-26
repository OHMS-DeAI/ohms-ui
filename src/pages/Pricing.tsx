import { useState } from 'react'
import Button from '../components/Button'
import SEOHead from '../components/SEOHead'

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  // Structured data for Pricing page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "OHMS Pricing - Autonomous AI Platform",
    "description": "Transparent pricing for OHMS autonomous AI platform. Choose from Free, Basic, Pro, and Enterprise plans with advanced AI integration.",
    "url": "https://ohms.ai/pricing",
    "mainEntity": {
      "@type": "Product",
      "name": "OHMS AI Platform",
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Plan",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Perfect for getting started with AI agents"
        },
        {
          "@type": "Offer",
          "name": "Basic Plan",
          "price": "29",
          "priceCurrency": "USD",
          "description": "For growing businesses and teams"
        },
        {
          "@type": "Offer",
          "name": "Pro Plan",
          "price": "99",
          "priceCurrency": "USD",
          "description": "For advanced users and organizations"
        },
        {
          "@type": "Offer",
          "name": "Enterprise Plan",
          "price": "299",
          "priceCurrency": "USD",
          "description": "For large-scale deployments and custom needs"
        }
      ]
    }
  }

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started with AI agents',
      features: [
        '100 requests/month',
        'Basic AI models',
        'Community support',
        'Standard response time',
        'Basic agent coordination',
        'Web interface access'
      ],
      limitations: [
        'Limited to 1 agent',
        'Basic model access only',
        'Community support only'
      ],
      cta: 'Get Started Free',
      popular: false,
      color: 'gray'
    },
    {
      name: 'Basic',
      price: { monthly: 29, yearly: 279 },
      description: 'For growing businesses and teams',
      features: [
        '1,000 requests/month',
        'All AI models',
        'Priority support',
        'Fast response time',
        'Multi-agent coordination',
        'API access',
        'Custom agent creation',
        'Usage analytics'
      ],
      limitations: [
        'Up to 5 agents',
        'Standard rate limits'
      ],
      cta: 'Start Basic Plan',
      popular: false,
      color: 'blue'
    },
    {
      name: 'Pro',
      price: { monthly: 99, yearly: 999 },
      description: 'For advanced users and organizations',
      features: [
        '10,000 requests/month',
        'Premium AI models',
        'Dedicated support',
        'Ultra-fast response time',
        'Advanced coordination',
        'Full API access',
        'White-label options',
        'Advanced analytics',
        'Custom integrations',
        'Priority feature requests'
      ],
      limitations: [
        'Up to 25 agents',
        'Higher rate limits'
      ],
      cta: 'Go Pro',
      popular: true,
      color: 'purple'
    },
    {
      name: 'Enterprise',
      price: { monthly: 299, yearly: 2999 },
      description: 'For large-scale deployments and custom needs',
      features: [
        'Unlimited requests',
        'Custom AI models',
        '24/7 phone support',
        'Dedicated account manager',
        'Enterprise security',
        'Custom SLAs',
        'On-premise deployment',
        'Advanced integrations',
        'Custom training',
        'White-label platform'
      ],
      limitations: [
        'Unlimited agents',
        'Custom rate limits'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'gold'
    }
  ]

  const costBreakdown = {
    dfinityLlm: {
      baseCost: 0.0001, // $0.10 per 1K tokens
      description: 'Advanced AI processing costs'
    },
    infrastructure: {
      baseCost: 0.02, // $0.02 per agent per hour
      description: 'Internet Computer Protocol infrastructure'
    },
    coordination: {
      baseCost: 0.005, // $0.005 per coordination event
      description: 'Multi-agent coordination overhead'
    }
  }

  const calculateTotalCost = (plan: typeof plans[0]) => {
    if (plan.price[billingCycle] === 0) return 0

    // Base plan cost
    const baseCost = plan.price[billingCycle]

    // Additional costs based on usage
    const estimatedUsage = plan.name === 'Basic' ? 500 :
                          plan.name === 'Pro' ? 2500 : 10000

    const dfinityCost = (estimatedUsage / 1000) * costBreakdown.dfinityLlm.baseCost
    const infraCost = plan.name === 'Basic' ? 10 :
                     plan.name === 'Pro' ? 50 : 200
    const coordinationCost = plan.name === 'Basic' ? 5 :
                           plan.name === 'Pro' ? 25 : 100

    return baseCost + dfinityCost + infraCost + coordinationCost
  }

  return (
    <>
      <SEOHead
        title="Pricing - OHMS Autonomous AI Platform"
        description="Transparent pricing for OHMS AI platform. Choose from Free, Basic, Pro, and Enterprise plans with real AI processing costs. No hidden fees, no surprises."
        keywords={['OHMS pricing', 'AI platform pricing', 'autonomous AI pricing', 'subscription plans', 'AI costs']}
        canonical="/pricing"
        ogImage="/ohms-pricing.png"
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
                  Transparent Pricing
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-text-secondary mb-4">
                Real costs, real value, no surprises
              </p>
              <p className="text-lg text-text-muted max-w-2xl mx-auto">
                Choose the plan that fits your needs. All plans include access to advanced AI
                with transparent pricing based on real usage costs.
              </p>

              {/* Billing Toggle */}
              <div className="mt-12 flex justify-center">
                <div className="bg-surface/30 backdrop-blur-sm rounded-xl p-2 border border-border">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        billingCycle === 'monthly'
                          ? 'bg-secondary text-white shadow-lg'
                          : 'text-text-secondary hover:bg-secondary/20 hover:text-secondary'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                        billingCycle === 'yearly'
                          ? 'bg-secondary text-white shadow-lg'
                          : 'text-text-secondary hover:bg-secondary/20 hover:text-secondary'
                      }`}
                    >
                      Yearly
                      <span className="bg-accent-success text-white px-2 py-1 rounded-full text-xs font-bold">
                        Save 20%
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-surface/50 border rounded-xl p-8 transition-all duration-300 hover:scale-105 ${
                    plan.popular
                      ? 'border-secondary shadow-xl shadow-secondary/20'
                      : 'border-border hover:border-secondary/50'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-secondary to-accent px-4 py-2 rounded-full text-white text-sm font-bold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">{plan.name}</h3>
                    <p className="text-text-secondary mb-4">{plan.description}</p>

                    <div className="mb-4">
                      <span className="text-4xl font-bold text-text-primary">
                        ${plan.price[billingCycle]}
                      </span>
                      {plan.price[billingCycle] > 0 && (
                        <span className="text-text-secondary">
                          /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                      {billingCycle === 'yearly' && plan.price.monthly > 0 && (
                        <div className="text-sm text-accent-success font-medium">
                          ${(plan.price.monthly * 12 * 0.8).toFixed(0)} billed yearly
                        </div>
                      )}
                    </div>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-secondary to-accent hover:from-secondary-light hover:to-accent-light text-white border-none'
                          : 'bg-surface border border-border hover:bg-secondary/10'
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-text-primary mb-3">What's included:</h4>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-accent-success mt-1">✓</span>
                        <span className="text-text-secondary text-sm">{feature}</span>
                      </div>
                    ))}

                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="font-semibold text-text-primary mt-6 mb-3">Limitations:</h4>
                        {plan.limitations.map((limitation, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <span className="text-text-muted mt-1">•</span>
                            <span className="text-text-muted text-sm">{limitation}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cost Breakdown */}
        <section className="py-20 bg-gradient-to-r from-secondary/5 to-accent/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  Transparent Cost Breakdown
                </h2>
                <p className="text-lg text-text-secondary">
                  Understand exactly what you're paying for with our detailed cost analysis
                </p>
              </div>

              <div className="bg-surface/50 border border-border rounded-xl p-8">
                <h3 className="text-xl font-bold text-text-primary mb-6">Cost Components:</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🧠</span>
                      <h4 className="font-semibold text-text-primary">DFINITY LLM</h4>
                    </div>
                    <p className="text-text-secondary text-sm mb-2">
                      {costBreakdown.dfinityLlm.description}
                    </p>
                    <div className="text-lg font-bold text-blue-400">
                      ${(costBreakdown.dfinityLlm.baseCost * 1000).toFixed(2)}/1K tokens
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🌐</span>
                      <h4 className="font-semibold text-text-primary">Infrastructure</h4>
                    </div>
                    <p className="text-text-secondary text-sm mb-2">
                      {costBreakdown.infrastructure.description}
                    </p>
                    <div className="text-lg font-bold text-green-400">
                      ${costBreakdown.infrastructure.baseCost}/agent/hour
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🤝</span>
                      <h4 className="font-semibold text-text-primary">Coordination</h4>
                    </div>
                    <p className="text-text-secondary text-sm mb-2">
                      {costBreakdown.coordination.description}
                    </p>
                    <div className="text-lg font-bold text-purple-400">
                      ${costBreakdown.coordination.baseCost}/event
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-accent-success/10 to-accent-success/5 border border-accent-success/20 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary mb-2">Total Transparency</h4>
                      <p className="text-text-secondary text-sm">
                        We pass through real costs with minimal markup. No hidden fees, no vendor lock-in.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-accent-success">
                        100%
                      </div>
                      <div className="text-sm text-text-secondary">Cost Transparency</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  Compare Plans
                </h2>
                <p className="text-lg text-text-secondary">
                  Choose the perfect plan for your AI needs
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full bg-surface/50 border border-border rounded-xl">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold text-text-primary">Features</th>
                      <th className="text-center p-4 font-semibold text-text-primary">Free</th>
                      <th className="text-center p-4 font-semibold text-text-primary">Basic</th>
                      <th className="text-center p-4 font-semibold text-text-primary">Pro</th>
                      <th className="text-center p-4 font-semibold text-text-primary">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Monthly Requests</td>
                      <td className="p-4 text-center text-text-secondary">100</td>
                      <td className="p-4 text-center text-text-secondary">1,000</td>
                      <td className="p-4 text-center text-text-secondary">10,000</td>
                      <td className="p-4 text-center text-text-secondary">Unlimited</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">AI Agents</td>
                      <td className="p-4 text-center text-text-secondary">1</td>
                      <td className="p-4 text-center text-text-secondary">5</td>
                      <td className="p-4 text-center text-text-secondary">25</td>
                      <td className="p-4 text-center text-text-secondary">Unlimited</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Response Time</td>
                      <td className="p-4 text-center text-text-secondary">Standard</td>
                      <td className="p-4 text-center text-text-secondary">Fast</td>
                      <td className="p-4 text-center text-text-secondary">Ultra-fast</td>
                      <td className="p-4 text-center text-text-secondary">Dedicated</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Support</td>
                      <td className="p-4 text-center text-text-secondary">Community</td>
                      <td className="p-4 text-center text-text-secondary">Priority</td>
                      <td className="p-4 text-center text-text-secondary">Dedicated</td>
                      <td className="p-4 text-center text-text-secondary">24/7 Phone</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Custom Integrations</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-text-primary">White-label</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gradient-to-r from-secondary/5 to-accent/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg text-text-secondary">
                  Everything you need to know about OHMS pricing
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-surface/50 border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">
                    How are DFINITY LLM costs calculated?
                  </h3>
                  <p className="text-text-secondary">
                    DFINITY LLM costs are based on token usage. Each plan includes a certain number of requests,
                    and additional usage is billed at $0.0001 per token (or $0.10 per 1K tokens). We pass these
                    costs directly to you with minimal markup.
                  </p>
                </div>

                <div className="bg-surface/50 border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">
                    What happens if I exceed my plan limits?
                  </h3>
                  <p className="text-text-secondary">
                    If you exceed your monthly request limit, you'll be charged for overage at the same rate as your plan.
                    For agent limits, you'll need to upgrade your plan or delete existing agents to create new ones.
                  </p>
                </div>

                <div className="bg-surface/50 border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">
                    Can I change plans at any time?
                  </h3>
                  <p className="text-text-secondary">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                    and we'll prorate any billing adjustments.
                  </p>
                </div>

                <div className="bg-surface/50 border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">
                    Is there a free trial?
                  </h3>
                  <p className="text-text-secondary">
                    Our Free plan gives you 100 requests per month to try out the platform. No credit card required,
                    no time limits. Upgrade anytime to unlock more features and higher limits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-text-secondary mb-8">
                Choose the plan that fits your needs and start building autonomous AI agents today.
                No hidden fees, no surprises, just transparent pricing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white border-none px-8 py-4 text-lg">
                  🚀 Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-secondary/50 text-secondary hover:bg-secondary/10 px-8 py-4 text-lg">
                  📞 Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default Pricing
