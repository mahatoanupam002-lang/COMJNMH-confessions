import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

const CAT_COLOR = {
  governance:     '#60a5fa',
  safety:         '#f87171',
  academic:       '#fbbf24',
  infrastructure: '#4ade80',
  welfare:        '#c084fc',
}

export async function GET(request) {
  if (!supabase) return new Response('SUPABASE_URL / SUPABASE_SERVICE_KEY not set in Vercel environment variables', { status: 503 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return new Response('Missing id', { status: 400 })

  const { data: idea } = await supabase
    .from('ideas')
    .select('title, description, category, votes, feasibility, author')
    .eq('id', id)
    .single()

  if (!idea) return new Response('Not found', { status: 404 })

  const color   = CAT_COLOR[idea.category] || '#4ade80'
  const title   = idea.title.length > 72 ? idea.title.slice(0, 72) + '…' : idea.title
  const desc    = idea.description.length > 220 ? idea.description.slice(0, 220) + '…' : idea.description
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1080px',
          background: '#0a0f0d',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(#2a3830 1px, transparent 1px), linear-gradient(90deg, #2a3830 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          opacity: 0.25,
        }} />

        {/* Top glow */}
        <div style={{
          position: 'absolute',
          top: '-150px', right: '-150px',
          width: '500px', height: '500px',
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '56px', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: '52px', height: '52px',
              background: '#4ade80',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0a0f0d', fontWeight: '900', fontSize: '22px',
            }}>M+</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ color: '#e8f0eb', fontSize: '26px', fontWeight: '700' }}>MedReform</div>
              <div style={{ color: '#7a9485', fontSize: '14px', letterSpacing: '0.08em' }}>COMJNMH · KALYANI</div>
            </div>
          </div>
          <div style={{
            background: `${color}22`,
            border: `1px solid ${color}`,
            color: color,
            padding: '10px 22px',
            borderRadius: '24px',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '0.1em',
          }}>
            {idea.category.toUpperCase()}
          </div>
        </div>

        {/* Title */}
        <div style={{
          color: '#e8f0eb',
          fontSize: title.length > 50 ? '46px' : '54px',
          fontWeight: '800',
          lineHeight: 1.1,
          marginBottom: '36px',
          letterSpacing: '-0.5px',
          position: 'relative',
        }}>
          {title}
        </div>

        {/* Divider */}
        <div style={{ width: '60px', height: '3px', background: color, marginBottom: '32px', borderRadius: '2px' }} />

        {/* Description */}
        <div style={{
          color: '#7a9485',
          fontSize: '28px',
          lineHeight: 1.6,
          flex: 1,
          position: 'relative',
        }}>
          {desc}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #2a3830',
          paddingTop: '36px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: '#4ade80', fontSize: '36px', fontWeight: '700' }}>▲ {idea.votes}</div>
              <div style={{ color: '#4a6358', fontSize: '14px', letterSpacing: '0.06em' }}>VOTES CAST</div>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#2a3830' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: idea.feasibility > 70 ? '#4ade80' : idea.feasibility > 40 ? '#fbbf24' : '#f87171', fontSize: '36px', fontWeight: '700' }}>{idea.feasibility}%</div>
              <div style={{ color: '#4a6358', fontSize: '14px', letterSpacing: '0.06em' }}>FEASIBILITY</div>
            </div>
          </div>
          <div style={{ color: '#4a6358', fontSize: '18px' }}>{baseUrl.replace('https://', '')}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
