import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { postToInstagram } from '@/lib/instagram'

// Vercel calls this with Authorization: Bearer <CRON_SECRET>
export async function GET(request) {
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY not set in Vercel environment variables' }, { status: 503 })
  const auth   = request.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL
  const minVotes     = parseInt(process.env.MIN_VOTES_TO_POST || '1')
  const maxPerRun    = parseInt(process.env.MAX_POSTS_PER_RUN || '3')

  if (!baseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_BASE_URL not set' }, { status: 500 })
  }

  // Fetch ideas that are ready to post:
  // - not yet posted to Instagram
  // - have enough votes
  // - at least 30 minutes old (gives community time to vote)
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('instagram_posted', false)
    .gte('votes', minVotes)
    .lt('created_at', cutoff)
    .order('votes', { ascending: false })
    .limit(maxPerRun)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!ideas || ideas.length === 0) {
    return NextResponse.json({ message: 'No ideas ready to post', posted: 0 })
  }

  const results = []

  for (const idea of ideas) {
    try {
      const postId = await postToInstagram(idea, baseUrl)

      await supabase
        .from('ideas')
        .update({ instagram_posted: true, instagram_post_id: postId })
        .eq('id', idea.id)

      results.push({ id: idea.id, title: idea.title, status: 'posted', postId })
    } catch (err) {
      await supabase
        .from('ideas')
        .update({ instagram_error: err.message })
        .eq('id', idea.id)

      results.push({ id: idea.id, title: idea.title, status: 'failed', error: err.message })
    }
  }

  return NextResponse.json({ posted: results.filter(r => r.status === 'posted').length, results })
}
