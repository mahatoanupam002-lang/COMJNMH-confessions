import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createHash } from 'crypto'

function fingerprint(request, ideaId) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  return createHash('sha256').update(`${ip}:${ideaId}`).digest('hex')
}

export async function POST(request) {
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY not set in Vercel environment variables' }, { status: 503 })
  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { id, action } = body
  if (!id || !['vote', 'unvote'].includes(action)) {
    return NextResponse.json({ error: 'id and action (vote|unvote) are required' }, { status: 400 })
  }

  const fp = fingerprint(request, id)

  if (action === 'vote') {
    // Record the vote (ignore if already voted from this IP)
    const { error: voteErr } = await supabase
      .from('votes')
      .insert({ idea_id: id, fingerprint: fp })

    // If unique constraint violated, they already voted — still return OK (client handles state)
    if (voteErr && !voteErr.message.includes('unique')) {
      return NextResponse.json({ error: voteErr.message }, { status: 500 })
    }

    if (!voteErr) {
      // Only increment if the insert succeeded (i.e., first vote from this IP)
      await supabase.rpc('increment_votes', { row_id: id })
    }
  } else {
    // Remove vote record
    const { data: deleted } = await supabase
      .from('votes')
      .delete()
      .eq('idea_id', id)
      .eq('fingerprint', fp)
      .select()

    if (deleted?.length > 0) {
      await supabase.rpc('decrement_votes', { row_id: id })
    }
  }

  return NextResponse.json({ ok: true })
}
