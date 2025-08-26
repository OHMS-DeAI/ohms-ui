// Simple SEO Head component without external dependencies
// Using document API directly for Internet Computer deployment
import { useEffect } from 'react'

interface SEOHeadProps {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  structuredData?: object
  noindex?: boolean
}

const SEOHead = ({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = '/ohms-logo.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  noindex = false
}: SEOHeadProps) => {
  const siteName = 'OHMS - Autonomous AI Platform'
  const siteUrl = 'https://ohms.ai'
  const fullTitle = `${title} | ${siteName}`

  // Default keywords for OHMS platform
  const defaultKeywords = [
    'AI agents',
    'autonomous agents',
    'machine learning',
    'artificial intelligence',
    'DFINITY',
    'Internet Computer',
    'blockchain AI',
    'decentralized AI',
    'NOVAQ compression',
    'quantum AI'
  ]

  const allKeywords = [...defaultKeywords, ...keywords].join(', ')

  useEffect(() => {
    // Set document title
    document.title = fullTitle

    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement

      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, name)
        document.head.appendChild(meta)
      }

      meta.content = content
    }

    // Helper function to set or update link tag
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement

      if (!link) {
        link = document.createElement('link')
        link.rel = rel
        document.head.appendChild(link)
      }

      link.href = href
    }

    // Set basic meta tags
    setMetaTag('description', description)
    setMetaTag('keywords', allKeywords)
    setMetaTag('author', 'OHMS Team')
    setMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow')

    // Set canonical URL
    if (canonical) {
      setLinkTag('canonical', `${siteUrl}${canonical}`)
    }

    // Set Open Graph meta tags
    setMetaTag('og:title', fullTitle, true)
    setMetaTag('og:description', description, true)
    setMetaTag('og:image', `${siteUrl}${ogImage}`, true)
    setMetaTag('og:url', `${siteUrl}${canonical || ''}`, true)
    setMetaTag('og:type', ogType, true)
    setMetaTag('og:site_name', siteName, true)
    setMetaTag('og:locale', 'en_US', true)

    // Set Twitter Card meta tags
    setMetaTag('twitter:card', twitterCard)
    setMetaTag('twitter:title', fullTitle)
    setMetaTag('twitter:description', description)
    setMetaTag('twitter:image', `${siteUrl}${ogImage}`)
    setMetaTag('twitter:site', '@ohms_ai')
    setMetaTag('twitter:creator', '@ohms_ai')

    // Set additional SEO meta tags
    setMetaTag('theme-color', '#1a1a2e')
    setMetaTag('msapplication-TileColor', '#1a1a2e')

    // Security and Performance
    setMetaTag('X-Content-Type-Options', 'nosniff', false)
    setMetaTag('X-Frame-Options', 'DENY', false)
    setMetaTag('X-XSS-Protection', '1; mode=block', false)
    setMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin', false)

    // Set structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(structuredData)
    }

    // Preconnect to external domains for performance
    setLinkTag('preconnect', 'https://fonts.googleapis.com')
    setLinkTag('preconnect', 'https://fonts.gstatic.com')
    setLinkTag('preconnect', 'https://api.coingecko.com')

    // Cleanup function to remove added meta tags when component unmounts
    return () => {
      // Note: In a production app, you might want to clean up these tags
      // For now, we'll leave them as they may be reused by other components
    }
  }, [title, description, keywords, canonical, ogImage, ogType, twitterCard, structuredData, noindex, fullTitle, allKeywords])

  // This component doesn't render anything visible
  return null
}

export default SEOHead
