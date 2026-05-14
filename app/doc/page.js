'use client'
import { useState } from 'react'
import Link from 'next/link'

const NAV = [
  { id: 'overview', label: 'Product Overview', icon: '◎' },
  { id: 'users', label: 'User Goals', icon: '👤' },
  { id: 'prd', label: 'PRD & Features', icon: '📋' },
  { id: 'arch', label: 'Architecture', icon: '🏗' },
  { id: 'stack', label: 'Tech Stack', icon: '⚙️' },
  { id: 'specs', label: 'Technical Specs', icon: '📐' },
  { id: 'uxdoc', label: 'UI/UX Design Doc', icon: '🎨' },
  { id: 'roadmap', label: 'Go-To-Market', icon: '🚀' },
]

const Tag = ({ children, color = '#8B5CF6' }) => (
  <span style={{
    background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: '2px 10px', fontSize: 11, fontWeight: 600,
    letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap'
  }}>{children}</span>
)

const Card = ({ children, accent, style = {} }) => (
  <div style={{
    background: '#111117', border: `1px solid ${accent || '#ffffff18'}`,
    borderRadius: 10, padding: '20px 24px', marginBottom: 14,
    borderLeft: accent ? `3px solid ${accent}` : '1px solid #ffffff18',
    ...style
  }}>{children}</div>
)

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F5F5F5', margin: 0, letterSpacing: '-0.03em' }}>{children}</h2>
    {sub && <p style={{ color: '#888', fontSize: 14, marginTop: 6, marginBottom: 0 }}>{sub}</p>}
  </div>
)

const H3 = ({ children }) => (
  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E2E2E2', marginBottom: 10, marginTop: 22, letterSpacing: '-0.01em' }}>{children}</h3>
)

const P = ({ children }) => (
  <p style={{ color: '#AAA', fontSize: 14, lineHeight: 1.75, marginBottom: 12 }}>{children}</p>
)

const CodeBlock = ({ children }) => (
  <pre style={{
    background: '#0D0D12', border: '1px solid #ffffff12', borderRadius: 8,
    padding: '14px 18px', fontSize: 12, color: '#7EE787', overflowX: 'auto',
    fontFamily: 'monospace', lineHeight: 1.7, marginBottom: 14, whiteSpace: 'pre-wrap'
  }}>{children}</pre>
)

const Grid2 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
    {children}
  </div>
)

const Badge = ({ label, value, color }) => (
  <div style={{ background: '#111117', border: '1px solid #ffffff15', borderRadius: 8, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <span style={{ fontSize: 18, fontWeight: 700, color: color || '#E2E2E2' }}>{value}</span>
  </div>
)

const Chip = ({ children, color }) => (
  <span style={{
    display: 'inline-block', background: (color || '#8B5CF6') + '18',
    color: color || '#A78BFA', border: `1px solid ${(color || '#8B5CF6')}33`,
    borderRadius: 99, padding: '3px 12px', fontSize: 12, marginRight: 6, marginBottom: 6
  }}>{children}</span>
)

const FeatureRow = ({ name, desc, priority, phase }) => {
  const pcolor = priority === 'P0' ? '#EF4444' : priority === 'P1' ? '#F59E0B' : '#10B981'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #ffffff08' }}>
      <span style={{ background: pcolor + '22', color: pcolor, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4, marginTop: 2, minWidth: 28, textAlign: 'center' }}>{priority}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E2E2', marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#777' }}>{desc}</div>
      </div>
      <Chip color={phase === 'MVP' ? '#8B5CF6' : phase === 'V2' ? '#0EA5E9' : '#10B981'}>{phase}</Chip>
    </div>
  )
}

function Overview() {
  const currentGaps = [
    'Hero image is dark and non-representative',
    'Pink/purple gradient overused as only accent',
    'No onboarding or trust-building flow',
    'Missing size/fit guidance system',
    'No real-time availability calendar',
    'Zero community/social proof layer'
  ]
  const targetState = [
    'Editorial-quality photography per listing',
    'Single accent color with clear hierarchy',
    'Guided 3-step onboarding flow',
    'Size chart + fit confidence score',
    'Live calendar with instant booking',
    'Reviews, ratings, community badges'
  ]

  return (
    <div>
      <SectionTitle sub="Community-first fashion rental & resale platform for India">
        WearShare — Product Overview
      </SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 28 }}>
        <Badge label="Stage" value="Pre-Launch" color="#F59E0B" />
        <Badge label="Market" value="India — Local" color="#8B5CF6" />
        <Badge label="Model" value="P2P Rental" color="#10B981" />
        <Badge label="Target" value="18-35 yrs" color="#0EA5E9" />
        <Badge label="MVP Timeline" value="12 Weeks" color="#EC4899" />
      </div>

      <Card accent="#8B5CF6">
        <H3>Problem Statement</H3>
        <P>Urban Indians overspend on outfits worn once — weddings, parties, college events. 73% of garments in Indian wardrobes are worn fewer than 3 times. Fast fashion drives textile waste. Meanwhile, there is no trusted, community-level platform to rent premium clothing peer-to-peer at accessible prices. WearShare solves this for local communities first.</P>
      </Card>

      <Card accent="#10B981">
        <H3>Mission</H3>
        <P>Make premium fashion accessible to everyone, enable idle wardrobes to earn, and build India's most trusted community clothing network — starting neighbourhood by neighbourhood.</P>
      </Card>

      <Grid2>
        <Card accent="#0EA5E9">
          <H3>Renter Value</H3>
          <P>Wear premium outfits for 10-20% of purchase price. No storage hassle. Fresh look every event.</P>
        </Card>
        <Card accent="#EC4899">
          <H3>Lister Value</H3>
          <P>Earn ₹500-₹5000/month from clothes sitting idle. Zero upfront cost to list.</P>
        </Card>
        <Card accent="#F59E0B">
          <H3>Community Value</H3>
          <P>Reduce textile waste. Build local trust networks. Discover fashion within your pincode.</P>
        </Card>
        <Card accent="#8B5CF6">
          <H3>Platform Value</H3>
          <P>15% commission on each rental. Premium "Luxe" tier subscription. Verified lister badges.</P>
        </Card>
      </Grid2>

      <Card>
        <H3>Current State vs. Target State</H3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.06em' }}>Current Gaps</div>
            {currentGaps.map(g => (
              <div key={g} style={{ fontSize: 12, color: '#888', padding: '4px 0', borderBottom: '1px solid #ffffff08', display: 'flex', gap: 8 }}>
                <span style={{ color: '#EF4444' }}>✗</span>{g}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.06em' }}>Target State</div>
            {targetState.map(g => (
              <div key={g} style={{ fontSize: 12, color: '#888', padding: '4px 0', borderBottom: '1px solid #ffffff08', display: 'flex', gap: 8 }}>
                <span style={{ color: '#10B981' }}>✓</span>{g}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function Users() {
  const personas = [
    {
      name: 'Priya, 24 — The Occasion Shopper',
      color: '#EC4899', role: 'Primary Renter',
      context: 'College student in Bengaluru. Has 3-4 events/year where she needs a fresh outfit but cannot afford ₹8,000 dresses repeatedly.',
      goals: ['Find verified, well-maintained outfits near her', 'See real photos on real bodies (not mannequins)', 'Trust the lister before handing over anything', 'Return pickup to be as easy as drop-off'],
      pains: ['Fear of receiving a dirty/damaged garment', 'Unclear sizing — photos do not show fit', 'No easy refund or damage resolution process', 'Transport inconvenience for bulky clothes']
    },
    {
      name: 'Rahul, 29 — The Working Professional',
      color: '#0EA5E9', role: 'Renter + Occasional Lister',
      context: 'Software engineer with a wardrobe full of suits bought for interviews and weddings. Travels often, needs 3-4 formal looks/year.',
      goals: ['Quick browse by occasion type', 'Filter by pickup distance (within 5km)', 'Confident about damage deposit terms', 'Ability to relist own clothes easily'],
      pains: ['Does not want to spend time on listing management', 'Worried about damage to his own items', 'Unclear pricing for damage vs normal wear']
    },
    {
      name: 'Deepa, 35 — The Community Lister',
      color: '#10B981', role: 'Primary Lister',
      context: 'Homemaker with a premium saree & suit collection. Wants passive income. Has 20+ high-value garments barely worn.',
      goals: ['Easy photo upload + AI-assisted listing', 'Control over who can rent her items', 'Clear earning dashboard and payout schedule', 'Damage protection that does not require paperwork'],
      pains: ['Complicated listing flow', 'Fear of damage with no recourse', 'Unclear tax implications of rental income', 'No way to vet renters before approval']
    },
    {
      name: 'Karan, 21 — The Streetwear Explorer',
      color: '#F59E0B', role: 'Power Renter',
      context: 'College student who follows fashion drops. Wants to experiment with styles without buying. High engagement, low budget.',
      goals: ['Discover rare / trendy pieces in his city', 'Try before deciding to buy', 'Build a style profile others can follow', 'Rate and review his rental experiences'],
      pains: ['No discovery feed curated to his taste', 'No try-before-buy option', 'Cannot follow specific listers he likes']
    }
  ]

  return (
    <div>
      <SectionTitle sub="Four core user archetypes driving platform behavior">User Goals & Personas</SectionTitle>
      {personas.map(p => (
        <Card key={p.name} accent={p.color} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: p.color, fontWeight: 800 }}>{p.name[0]}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#E2E2E2' }}>{p.name}</div>
              <Tag color={p.color}>{p.role}</Tag>
            </div>
          </div>
          <P>{p.context}</P>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: p.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Goals</div>
              {p.goals.map(g => <div key={g} style={{ fontSize: 12, color: '#AAA', padding: '3px 0', display: 'flex', gap: 8 }}><span style={{ color: '#10B981' }}>→</span>{g}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Pain Points</div>
              {p.pains.map(g => <div key={g} style={{ fontSize: 12, color: '#AAA', padding: '3px 0', display: 'flex', gap: 8 }}><span style={{ color: '#EF4444' }}>!</span>{g}</div>)}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function PRD() {
  const features = [
    { name: 'User Registration & OTP Login', desc: 'Phone/email signup, OTP verification, Google OAuth', priority: 'P0', phase: 'MVP' },
    { name: 'Clothing Listing Flow', desc: 'Multi-photo upload, category tagging, size entry, pricing, availability calendar', priority: 'P0', phase: 'MVP' },
    { name: 'Search & Discovery', desc: 'Filter by category, size, distance, price range, occasion, availability date', priority: 'P0', phase: 'MVP' },
    { name: 'Listing Detail Page', desc: 'Photo gallery, size guide, condition rating, lister profile, reviews, availability picker', priority: 'P0', phase: 'MVP' },
    { name: 'Booking & Payment Flow', desc: 'Date selection, security deposit, Razorpay/UPI integration, booking confirmation', priority: 'P0', phase: 'MVP' },
    { name: 'Messaging System', desc: 'In-app chat between renter and lister before/after booking', priority: 'P0', phase: 'MVP' },
    { name: 'Order Management', desc: 'Active rentals, upcoming, past orders, return tracking', priority: 'P0', phase: 'MVP' },
    { name: 'Review & Rating System', desc: 'Post-rental review for both renter and lister', priority: 'P0', phase: 'MVP' },
    { name: 'Lister Dashboard', desc: 'Earnings summary, upcoming bookings, item performance, payout requests', priority: 'P1', phase: 'MVP' },
    { name: 'Location-Based Discovery', desc: 'Pincode-based radius filter, map view for nearby listings', priority: 'P1', phase: 'MVP' },
    { name: 'AI Listing Assistant', desc: 'Auto-suggest category, pricing, and description from uploaded photos', priority: 'P1', phase: 'V2' },
    { name: 'Fit Confidence Score', desc: 'Size comparison between lister measurements and renter saved profile', priority: 'P1', phase: 'V2' },
    { name: 'Style Feed', desc: 'Curated discovery feed based on occasion, saved styles, trending in city', priority: 'P1', phase: 'V2' },
    { name: 'Lister Trust Badges', desc: 'Verified ID, Premium Lister, Response Rate, Damage-Free record', priority: 'P1', phase: 'V2' },
    { name: 'Damage Claim Portal', desc: 'Photo evidence upload, admin mediation, deposit release workflow', priority: 'P0', phase: 'MVP' },
    { name: 'Notifications (Push/SMS)', desc: 'Booking alerts, message notifications, return reminders, payment receipts', priority: 'P1', phase: 'MVP' },
    { name: 'Wishlist / Save Items', desc: 'Save items for future events, get availability alerts', priority: 'P2', phase: 'V2' },
    { name: 'Referral Program', desc: 'Invite friends, earn rental credits. Dual-sided incentive.', priority: 'P2', phase: 'V2' },
    { name: 'Subscription — Luxe Tier', desc: '4 rentals/month, priority booking, free delivery, premium support', priority: 'P2', phase: 'V3' },
    { name: 'Multi-city Expansion Framework', desc: 'City onboarding, local moderators, geo-routing, city-level analytics', priority: 'P1', phase: 'V3' },
  ]

  const userStories = [
    ['As a renter,', 'I want to search for a lehenga near me for a wedding on Dec 15, so that I can rent it for 3 days without visiting multiple shops.'],
    ['As a lister,', 'I want to upload photos of my suit and set rental dates in under 5 minutes, so that my idle wardrobe starts earning.'],
    ['As a renter,', 'I want to message the lister before booking to confirm measurements, so I feel confident about fit before paying.'],
    ['As a lister,', 'I want to receive a security deposit that covers potential damage, so I can rent out with zero financial risk.'],
    ['As an admin,', 'I want to mediate damage disputes with photo evidence from both parties, so I can release deposits fairly.'],
  ]

  const mvpCriteria = [
    ['50 active listers', 'in first community'],
    ['200 successful rentals', 'in first 60 days'],
    ['4.2+ avg rating', 'on completed rentals'],
    ['₹0 unresolved disputes', 'in damage claims'],
    ['< 3 min listing time', 'from photo to live'],
    ['< 48h response SLA', 'lister to renter']
  ]

  return (
    <div>
      <SectionTitle sub="Product Requirements Document — WearShare v1.0 to v3.0">PRD & Feature Roadmap</SectionTitle>

      <Grid2>
        <Badge label="P0 Features (Must Have)" value={features.filter(f => f.priority === 'P0').length} color="#EF4444" />
        <Badge label="P1 Features (Should Have)" value={features.filter(f => f.priority === 'P1').length} color="#F59E0B" />
        <Badge label="P2 Features (Nice to Have)" value={features.filter(f => f.priority === 'P2').length} color="#10B981" />
        <Badge label="Total Features Mapped" value={features.length} color="#8B5CF6" />
      </Grid2>

      <Card accent="#8B5CF6">
        <H3>MVP Success Criteria</H3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {mvpCriteria.map(([v, l]) => (
            <div key={v} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#A78BFA' }}>{v}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>

      <H3>Feature List — Priority & Phase</H3>
      <div style={{ background: '#111117', borderRadius: 10, border: '1px solid #ffffff12', padding: '4px 16px', marginBottom: 16 }}>
        {features.map(f => <FeatureRow key={f.name} {...f} />)}
      </div>

      <Card accent="#0EA5E9">
        <H3>User Stories (Core Flows)</H3>
        {userStories.map(([who, what]) => (
          <div key={who + what.slice(0, 20)} style={{ padding: '8px 0', borderBottom: '1px solid #ffffff08', fontSize: 13, color: '#AAA', lineHeight: 1.6 }}>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>{who}</span> {what}
          </div>
        ))}
      </Card>
    </div>
  )
}

function Architecture() {
  return (
    <div>
      <SectionTitle sub="System design for local-first, city-scalable platform">System Architecture</SectionTitle>

      <Card accent="#8B5CF6">
        <H3>Architecture Pattern: Modular Monolith → Microservices</H3>
        <P>Start with a well-structured monolith for speed. Split into microservices at 10k+ users or when specific services need independent scaling (payments, search, notifications).</P>
      </Card>

      <H3>High-Level Architecture</H3>
      <CodeBlock>{`┌─────────────────────────────────────────┐
│           CLIENT LAYER                  │
│  Next.js Web App   │  React Native App  │
│  (SSR + CSR)       │  (iOS + Android)   │
└──────────┬──────────────────┬───────────┘
           │                  │
           ▼                  ▼
┌─────────────────────────────────────────┐
│      API GATEWAY (REST + WebSocket)     │
│  Rate Limiting  │  Auth Middleware       │
└──────────┬────────────┬─────────────────┘
           │            │
     ┌─────┴────┐  ┌────┴────┐  ┌─────────┐
     │  Auth    │  │Listings │  │Bookings │
     │ Service  │  │Service  │  │& Pay    │
     └─────┬────┘  └────┬────┘  └────┬────┘
           │            │            │
     ┌─────┴────┐  ┌────┴────┐  ┌─────────┐
     │ Search   │  │Messaging│  │Notifications
     │ Service  │  │Service  │  │ Service  │
     └─────┬────┘  └────┬────┘  └────┬────┘
           │            │            │
           ▼            ▼            ▼
┌─────────────────────────────────────────┐
│           DATA LAYER                    │
│  PostgreSQL    │  Redis (cache/session) │
│  Elasticsearch │  S3/Cloudflare R2      │
└─────────────────────────────────────────┘`}</CodeBlock>

      <H3>Data Flow — Booking a Rental</H3>
      <CodeBlock>{`1. Renter searches → Search Service (Elasticsearch) → Results
2. Renter selects dates → Listings Service checks calendar
3. Renter initiates booking → Bookings Service creates pending order
4. Payment via Razorpay → Webhook → Order confirmed
5. Notifications → SMS to both parties (Firebase + MSG91)
6. Post-rental → Review flow → Rating update → Deposit release`}</CodeBlock>

      <Grid2>
        <Card accent="#10B981">
          <H3>Location Strategy</H3>
          <P>Phase 1: Pincode-based radius (5km default, up to 20km). Phase 2: City-level routing with neighbourhood tags. Phase 3: Interstate shipping for high-value Luxe items.</P>
        </Card>
        <Card accent="#F59E0B">
          <H3>Multi-tenancy Plan</H3>
          <P>Single database with city_id partitioning. Each city gets a community moderator account. City-specific trending & featured sections.</P>
        </Card>
        <Card accent="#0EA5E9">
          <H3>Media Pipeline</H3>
          <P>Upload → Cloudflare R2 → Auto-compress to WebP → CDN edge cache. 5 photos max per listing. 2MB limit per photo. Auto-watermark with WearShare logo.</P>
        </Card>
        <Card accent="#EC4899">
          <H3>Security Layer</H3>
          <P>JWT access tokens (15 min expiry) + Refresh tokens (30 days). All PII encrypted at rest. Payment data never stored — tokenised via Razorpay vault.</P>
        </Card>
      </Grid2>
    </div>
  )
}

function Stack() {
  const layers = [
    {
      layer: 'Frontend — Web', color: '#8B5CF6',
      items: [
        ['Next.js 14 (App Router)', 'SSR + CSR hybrid. SEO for listing pages. Fast navigation.'],
        ['TypeScript', 'Type safety across the codebase.'],
        ['Tailwind CSS', 'Utility-first. Consistent spacing. Fast iteration.'],
        ['Framer Motion', 'Animations — carousel, modals, page transitions.'],
        ['React Query (TanStack)', 'Server state, caching, optimistic updates.'],
        ['Zustand', 'Lightweight global state (cart, auth, filters).'],
        ['Mapbox GL', 'Map view for nearby listings.'],
      ]
    },
    {
      layer: 'Frontend — Mobile', color: '#EC4899',
      items: [
        ['React Native (Expo)', 'Single codebase for iOS + Android. Fast iteration.'],
        ['Expo Router', 'File-based navigation. Deep links.'],
        ['React Native Reanimated', '60fps animations on native thread.'],
        ['Expo Camera + ImagePicker', 'In-app listing photo flow.'],
        ['React Native Maps', 'Location-based discovery.'],
      ]
    },
    {
      layer: 'Backend', color: '#10B981',
      items: [
        ['Node.js + Express', 'Primary API server. Proven ecosystem for marketplace apps.'],
        ['Prisma ORM', 'Type-safe DB queries. Easy migrations.'],
        ['Socket.IO', 'Real-time messaging between renter and lister.'],
        ['Bull + Redis', 'Job queues for async tasks (emails, webhooks, reminders).'],
        ['Zod', 'Input validation and schema contracts.'],
        ['Multer + Sharp', 'Image upload processing and compression.'],
      ]
    },
    {
      layer: 'Database & Storage', color: '#0EA5E9',
      items: [
        ['PostgreSQL (Supabase)', 'Primary relational DB. Row-level security. Real-time subscriptions.'],
        ['Redis (Upstash)', 'Session cache, rate limiting, availability calendar lock.'],
        ['Elasticsearch', 'Full-text search with filters, geo queries, facets.'],
        ['Cloudflare R2', 'Media storage. S3-compatible. Zero egress cost.'],
      ]
    },
    {
      layer: 'Payments & Comms', color: '#F59E0B',
      items: [
        ['Razorpay', 'Payment gateway — UPI, cards, netbanking. Marketplace split payments.'],
        ['MSG91 / Exotel', 'OTP delivery, SMS notifications.'],
        ['Firebase Cloud Messaging', 'Push notifications for mobile.'],
        ['Resend (email)', 'Transactional emails — booking confirm, receipts.'],
        ['Twilio (future)', 'WhatsApp notification channel for scale.'],
      ]
    },
    {
      layer: 'Infrastructure & DevOps', color: '#6366F1',
      items: [
        ['Vercel', 'Next.js hosting. Edge functions. Analytics.'],
        ['Railway / Render', 'Node.js backend hosting. Easy scaling.'],
        ['Supabase', 'Managed Postgres + Auth + Realtime.'],
        ['Cloudflare', 'CDN, WAF, DNS, R2 storage.'],
        ['GitHub Actions', 'CI/CD pipeline. Auto-deploy on merge.'],
        ['Sentry', 'Error tracking and performance monitoring.'],
        ['PostHog', 'Product analytics, funnels, session recording.'],
      ]
    }
  ]

  return (
    <div>
      <SectionTitle sub="Chosen for speed-to-market, Indian infrastructure compatibility, and scale">Technology Stack</SectionTitle>
      {layers.map(l => (
        <Card key={l.layer} accent={l.color} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Tag color={l.color}>{l.layer}</Tag>
          </div>
          {l.items.map(([name, desc]) => (
            <div key={name} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #ffffff08' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E2E2', minWidth: 200 }}>{name}</span>
              <span style={{ fontSize: 12, color: '#777' }}>{desc}</span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}

function Specs() {
  return (
    <div>
      <SectionTitle sub="API contracts, database schema, and integration specs">Technical Specifications</SectionTitle>

      <H3>Core Database Schema</H3>
      <CodeBlock>{`-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(13) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  city_id INTEGER REFERENCES cities(id),
  pincode VARCHAR(6),
  role ENUM('renter','lister','both','admin') DEFAULT 'renter',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Listings
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  lister_id UUID REFERENCES users(id),
  title VARCHAR(150) NOT NULL,
  description TEXT,
  category ENUM('women','men','footwear','accessories','kids'),
  occasion VARCHAR(50),
  condition ENUM('like_new','excellent','good','fair'),
  size VARCHAR(20),
  brand VARCHAR(100),
  original_price INTEGER,
  rent_per_day INTEGER NOT NULL,
  deposit_amount INTEGER NOT NULL,
  city_id INTEGER,
  pincode VARCHAR(6),
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  is_available BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  photos TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  renter_id UUID REFERENCES users(id),
  lister_id UUID REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount INTEGER NOT NULL,
  deposit_amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  status ENUM('pending','confirmed','active','returned','cancelled','disputed'),
  payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id),
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  type ENUM('renter_review','lister_review'),
  created_at TIMESTAMP DEFAULT NOW()
);`}</CodeBlock>

      <H3>Core API Endpoints</H3>
      <CodeBlock>{`-- Auth
POST /api/auth/send-otp { phone }
POST /api/auth/verify-otp { phone, otp }
POST /api/auth/google { token }
POST /api/auth/refresh { refreshToken }

-- Listings
GET /api/listings?city&category&size&minPrice&maxPrice&startDate&endDate&lat&lng&radius
POST /api/listings { title, category, photos[], rentPerDay, depositAmount, ... }
GET /api/listings/:id
PATCH /api/listings/:id
DELETE /api/listings/:id

-- Bookings
POST /api/bookings { listingId, startDate, endDate }
GET /api/bookings/my
PATCH /api/bookings/:id/confirm
PATCH /api/bookings/:id/return
POST /api/bookings/:id/dispute

-- Payments
POST /api/payments/create-order { bookingId }
POST /api/payments/webhook
POST /api/payouts/request { amount }

-- Search
GET /api/search?q=lehenga&city=bangalore&date=2024-12-15&size=M`}</CodeBlock>

      <Grid2>
        <Card accent="#EF4444">
          <H3>Availability Lock System</H3>
          <P>When a renter initiates payment, hold dates in Redis for 15 minutes (TTL). If payment fails, release lock. This prevents double-booking during checkout.</P>
          <CodeBlock>SETEX listing:{'{id}'}:lock:{'{dates}'} 900 {'{userId}'}</CodeBlock>
        </Card>
        <Card accent="#F59E0B">
          <H3>Razorpay Split Payments</H3>
          <P>Use Razorpay Route to auto-split on payment: 85% to lister's linked account, 15% held by WearShare. Deposit goes to escrow until return confirmed.</P>
        </Card>
        <Card accent="#10B981">
          <H3>Photo Processing Pipeline</H3>
          <CodeBlock>{`Upload → S3 presigned URL
  → Sharp: resize to 1200px, WebP
  → Store 3 sizes: thumb, medium, full
  → CDN: Cloudflare edge cache
  → Watermark overlay (optional)`}</CodeBlock>
        </Card>
        <Card accent="#0EA5E9">
          <H3>Search Indexing (Elasticsearch)</H3>
          <CodeBlock>{`Index: listings
Fields: title, category, occasion,
  size, brand, city, pincode,
  rent_per_day, condition,
  geo_point { lat, lng }
Queries: multi-match + geo_distance
  + range filter + date availability`}</CodeBlock>
        </Card>
      </Grid2>
    </div>
  )
}

function UXDoc() {
  const screens = [
    {
      screen: 'Home / Discovery Feed', color: '#8B5CF6',
      sections: [
        'Sticky header: Logo + Search bar + Location pill + Avatar',
        'Hero banner: Occasion-based editorial (this week: Diwali outfits near you)',
        'Category pills: Women / Men / Footwear / Accessories / Kids (horizontal scroll)',
        'Nearby Listings grid: 2-column card grid. Card = photo + title + price/day + distance + rating',
        'Trending in [City]: Horizontal scroll of 3 featured listings',
        'Featured Listers: Avatar + name + item count + avg rating',
      ]
    },
    {
      screen: 'Listing Detail Page', color: '#EC4899',
      sections: [
        'Photo carousel: Full-width, swipeable, dot indicators, zoom on tap',
        'Sticky bottom bar: Price/day + Deposit + "Book Now" CTA button',
        'Info block: Title (Playfair 28px) + Brand + Condition badge + Distance',
        'Size section: Size label + lister measurements + "Compare with my size" CTA',
        'Availability picker: Calendar component with blocked dates highlighted',
        'Lister card: Avatar + name + rating + response time + "Message" button',
        'Reviews: Last 5 reviews with star rating + date + comment',
        'Similar listings: Horizontal scroll of 4 nearby alternatives',
      ]
    },
    {
      screen: 'Listing Upload Flow', color: '#10B981',
      sections: [
        'Step 1 Photos: Grid of 5 slots. Tap to add. Drag to reorder. Min 1, max 5.',
        'Step 2 Details: Category select → Occasion → Size → Condition → Brand → Description (AI-suggest)',
        'Step 3 Pricing: Rent/day slider + Deposit slider (auto-suggest = 30% of original price)',
        'Step 4 Availability: Calendar block with date range picker for unavailability',
        'Step 5 Location: Auto-detect pincode or manual entry. Show radius preview on map.',
        'Preview screen: Exactly as renters see it. Edit inline. Then publish.',
      ]
    },
    {
      screen: 'Booking & Checkout', color: '#F59E0B',
      sections: [
        'Date picker: Inline calendar with price summary updating in real-time',
        'Order summary: Rent x days + Platform fee (shown) + Security deposit (refundable badge)',
        'Trust signals: Damage protection icon + Verified lister badge + Secure payment lock',
        'Payment: Razorpay sheet (UPI / Card / Netbanking) — native sheet, not redirect',
        'Confirmation screen: Animated checkmark + Booking ID + Lister contact + Return date',
      ]
    },
  ]

  const animations = [
    ['Page transitions', 'Fade + slide up, 250ms ease-out'],
    ['Card hover', 'Scale 1.02 + shadow lift, 150ms'],
    ['Booking CTA', 'Pulse glow on first view, stop on hover'],
    ['Photo carousel', 'Spring physics swipe, velocity-based'],
    ['Price update', 'Number counter animation on date change'],
    ['Success state', 'Lottie confetti on booking confirm'],
    ['Loading skeleton', 'Shimmer pulse matching card layout'],
    ['Filter apply', 'Items stagger-fade in 50ms intervals'],
  ]

  const colors = [
    ['Background', '#0A0A0F', '#0A0A0F'],
    ['Surface', '#111117', '#111117'],
    ['Surface 2', '#1A1A22', '#1A1A22'],
    ['Primary Accent', '#9333EA', '#9333EA'],
    ['Success', '#10B981', '#10B981'],
    ['Warning', '#F59E0B', '#F59E0B'],
    ['Danger', '#EF4444', '#EF4444'],
    ['Text Primary', '#F5F5F5', '#F5F5F5'],
    ['Text Muted', '#888888', '#888888'],
  ]

  const typography = [
    ['Display', 'Playfair Display', '48px / 800', 'Hero headlines'],
    ['Heading 1', 'DM Sans', '32px / 700', 'Page titles'],
    ['Heading 2', 'DM Sans', '22px / 600', 'Section headers'],
    ['Heading 3', 'DM Sans', '16px / 600', 'Card titles'],
    ['Body', 'DM Sans', '15px / 400', 'Main content'],
    ['Caption', 'DM Sans', '12px / 400', 'Meta info'],
    ['Overline', 'DM Sans', '11px / 700', 'CATEGORY LABELS'],
  ]

  return (
    <div>
      <SectionTitle sub="Design system, user flows, and screen-by-screen specifications">UI/UX Design Document</SectionTitle>

      <Card accent="#8B5CF6">
        <H3>Design Philosophy</H3>
        <P>Editorial minimalism meets community warmth. Think Vogue India meets Airbnb. Dark-first with sharp typography, editorial photography, and micro-animations that reward exploration. Every screen must answer: "Does this make the user feel confident about renting?"</P>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {['Trust-first', 'Fashion-editorial', 'Community warmth', 'Conversion clarity', 'Mobile-native', 'Speed'].map(t => <Chip key={t}>{t}</Chip>)}
        </div>
      </Card>

      <H3>Design System — Tokens</H3>
      <Grid2>
        <Card>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Color Palette</div>
          {colors.map(([name, hex, bg]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #ffffff08' }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, background: bg, border: '1px solid #ffffff20', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#AAA', flex: 1 }}>{name}</span>
              <code style={{ fontSize: 11, color: '#666' }}>{hex}</code>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Typography Scale</div>
          {typography.map(([role, font, size, use]) => (
            <div key={role} style={{ padding: '5px 0', borderBottom: '1px solid #ffffff08' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#E2E2E2', fontWeight: 600 }}>{role}</span>
                <code style={{ fontSize: 10, color: '#666' }}>{size}</code>
              </div>
              <div style={{ fontSize: 11, color: '#555' }}>{font} — {use}</div>
            </div>
          ))}
        </Card>
      </Grid2>

      <H3>Key Screen Specifications</H3>
      {screens.map(s => (
        <Card key={s.screen} accent={s.color} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Tag color={s.color}>{s.screen}</Tag>
          </div>
          {s.sections.map((sec, i) => (
            <div key={i} style={{ fontSize: 12, color: '#AAA', padding: '5px 0', borderBottom: '1px solid #ffffff08', display: 'flex', gap: 8, lineHeight: 1.6 }}>
              <span style={{ color: s.color, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>{sec}
            </div>
          ))}
        </Card>
      ))}

      <Card accent="#6366F1">
        <H3>Animation Principles</H3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {animations.map(([name, spec]) => (
            <div key={name} style={{ padding: '5px 0', borderBottom: '1px solid #ffffff08' }}>
              <div style={{ fontSize: 12, color: '#E2E2E2', fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{spec}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Roadmap() {
  const phases = [
    {
      phase: 'Phase 0 — Foundation', duration: 'Weeks 1-4', color: '#8B5CF6',
      items: ['Design system setup (Figma + Tailwind tokens)', 'Next.js + Expo project scaffolding', 'Supabase DB setup + Prisma migrations', 'Auth service (OTP + Google)', 'Cloudflare R2 media pipeline', 'Razorpay integration (test mode)']
    },
    {
      phase: 'Phase 1 — MVP (Beta)', duration: 'Weeks 5-10', color: '#10B981',
      items: ['Listing upload + management flow', 'Search + discovery + map view', 'Listing detail + availability calendar', 'Booking + payment flow', 'In-app messaging', 'Review + rating system', 'Basic lister dashboard', 'Damage claim portal']
    },
    {
      phase: 'Phase 2 — Community Launch', duration: 'Weeks 11-16', color: '#F59E0B',
      items: ['Onboard 50 listers in target neighbourhood (Koramangala, Bengaluru)', 'Community ambassador program (5 power listers)', 'Instagram + WhatsApp community launch', 'Push notifications + reminders', 'AI listing assistant (photo → auto-fill)', 'Fit confidence score (size comparison)', 'Wishlist + save items']
    },
    {
      phase: 'Phase 3 — City Expansion', duration: 'Month 5-8', color: '#0EA5E9',
      items: ['Expand to 3 Bengaluru neighbourhoods', 'City leaderboard + top listers', 'Referral program launch', 'Luxe subscription tier', 'Mumbai + Hyderabad onboarding', 'Admin moderation dashboard', 'City-level analytics']
    },
    {
      phase: 'Phase 4 — Scale & Monetise', duration: 'Month 9-18', color: '#EC4899',
      items: ['10 cities live', 'B2B: Boutique & stylist partnerships', 'WearShare Pro for frequent renters', 'Delivery integration (courier for non-local)', 'Fashion calendar (weddings, festivals) integration', 'Resale marketplace (buy used from listers)', 'Series A fundraise preparation']
    }
  ]

  const listerChannels = [
    'College fashion group admins on Instagram',
    'WhatsApp community groups for women\'s fashion',
    'Local boutique tie-ups (list unsold inventory)',
    'Door-to-door wardrobe audit in target area',
    'Lister referral: ₹500 credit per new lister'
  ]

  const renterChannels = [
    'Instagram Reels showing "I rented this for ₹400"',
    'College fest partnerships (sponsor outfit contests)',
    'Wedding FB/WhatsApp groups — seasonal targeting',
    'Google Ads: "rent lehenga Bangalore"',
    'Renter referral: ₹200 off first rental'
  ]

  const bizModels = [
    ['Platform Commission', '15% of each rental value', '#8B5CF6'],
    ['Security Deposit Float', 'Earn interest on held deposits', '#10B981'],
    ['Luxe Subscription', '₹499/month for premium renters', '#EC4899'],
    ['Featured Listings', '₹199/week to boost visibility', '#F59E0B'],
    ['B2B Boutique Listings', 'Monthly SaaS fee for inventory mgmt', '#0EA5E9'],
    ['Delivery Partnerships', 'Commission on courier bookings', '#6366F1'],
  ]

  return (
    <div>
      <SectionTitle sub="From local community to pan-India fashion rental network">Go-To-Market Strategy & Roadmap</SectionTitle>

      <Card accent="#10B981">
        <H3>GTM Strategy: Hyper-Local First</H3>
        <P>Do not launch city-wide. Launch in ONE dense, fashion-aware neighbourhood (suggested: Koramangala, Bengaluru). Achieve depth before breadth. 50 verified listers, 200 completed rentals, and a 4.2+ rating before expanding to the next area. This builds the trust and density that makes the marketplace work.</P>
      </Card>

      <Grid2>
        <Badge label="Launch Neighbourhood" value="Koramangala, BLR" color="#8B5CF6" />
        <Badge label="Target Listers at Launch" value="50" color="#10B981" />
        <Badge label="Break-even GMV" value="₹2L / month" color="#F59E0B" />
        <Badge label="City Expansion Trigger" value="500 rentals" color="#0EA5E9" />
      </Grid2>

      <H3>Acquisition Channels</H3>
      <Grid2>
        <Card accent="#EC4899">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E2E2', marginBottom: 8 }}>Lister Acquisition</div>
          {listerChannels.map(i => <div key={i} style={{ fontSize: 12, color: '#AAA', padding: '3px 0', display: 'flex', gap: 6 }}><span>{'>'}</span>{i}</div>)}
        </Card>
        <Card accent="#0EA5E9">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E2E2', marginBottom: 8 }}>Renter Acquisition</div>
          {renterChannels.map(i => <div key={i} style={{ fontSize: 12, color: '#AAA', padding: '3px 0', display: 'flex', gap: 6 }}><span>{'>'}</span>{i}</div>)}
        </Card>
      </Grid2>

      {phases.map(p => (
        <Card key={p.phase} accent={p.color} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Tag color={p.color}>{p.phase}</Tag>
            <span style={{ fontSize: 12, color: '#666' }}>{p.duration}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {p.items.map(i => <div key={i} style={{ fontSize: 12, color: '#AAA', padding: '3px 0', display: 'flex', gap: 6 }}><span style={{ color: p.color }}>✓</span>{i}</div>)}
          </div>
        </Card>
      ))}

      <Card accent="#8B5CF6">
        <H3>Business Model Summary</H3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {bizModels.map(([name, desc, c]) => (
            <div key={name}>
              <div style={{ fontSize: 13, fontWeight: 700, color: c, marginBottom: 3 }}>{name}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

const SECTIONS = { overview: Overview, users: Users, prd: PRD, arch: Architecture, stack: Stack, specs: Specs, uxdoc: UXDoc, roadmap: Roadmap }

export default function WearShareDoc() {
  const [active, setActive] = useState('overview')
  const ActiveSection = SECTIONS[active]

  return (
    <div style={{ minHeight: '100vh', background: '#08080E', color: '#E2E2E2', fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #ffffff12', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 56, position: 'sticky', top: 0, background: '#08080Eee', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #9333EA, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👗</div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>WearShare</span>
          <span style={{ fontSize: 11, color: '#555', marginLeft: 4 }}>Product Docs v1.0</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', fontSize: 11, color: '#A78BFA', border: '1px solid #9333EA66', borderRadius: 6, padding: '4px 8px', fontWeight: 700 }}>
            Open Web App
          </Link>
          <Tag color="#10B981">Pre-Launch</Tag>
          <Tag color="#8B5CF6">Bengaluru</Tag>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        {/* sidebar */}
        <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid #ffffff0c', padding: '20px 12px', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: active === n.id ? '#9333EA22' : 'transparent', color: active === n.id ? '#A78BFA' : '#666', fontSize: 13, fontWeight: active === n.id ? 600 : 400, textAlign: 'left', marginBottom: 2, transition: 'all 0.15s', borderLeft: active === n.id ? '2px solid #9333EA' : '2px solid transparent' }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div style={{ marginTop: 24, padding: '12px', background: '#111117', borderRadius: 8, border: '1px solid #ffffff1e' }}>
            <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Quick Stats</div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 2 }}>
              <div>20 Features Mapped</div>
              <div>4 User Personas</div>
              <div>6 Tech Layers</div>
              <div>5 GTM Phases</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', maxWidth: 860 }}>
          <ActiveSection />
        </div>
      </div>
    </div>
  )
}
