import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const VALID_CATS = new Set(['governance', 'safety', 'academic', 'infrastructure', 'welfare'])

export async function GET() {
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY not set in Vercel environment variables' }, { status: 503 })
  const { data, error } = await supabase
    .from('ideas')
    .select('id, title, description, category, author, role, feasibility, votes, created_at')
    .order('votes', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request) {
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY not set in Vercel environment variables' }, { status: 503 })
  let body
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { title, description, category, author, role, feasibility } = body

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }
  if (!VALID_CATS.has(category)) {
    return NextResponse.json({ error: 'invalid category' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      title:       title.trim().slice(0, 200),
      description: description.trim().slice(0, 2000),
      category,
      author:      (author || 'Anonymous').slice(0, 100),
      role:        (role   || '').slice(0, 100),
      feasibility: Math.min(100, Math.max(0, parseInt(feasibility) || 50)),
      votes:       1,
    })
    .select('id, title, description, category, author, role, feasibility, votes, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
