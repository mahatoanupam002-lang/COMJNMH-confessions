const GRAPH_URL = 'https://graph.facebook.com/v20.0'
const IG_USER_ID = process.env.IG_USER_ID
const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN

const CAT_EMOJI = {
  governance:     '🏛️',
  safety:         '🚨',
  academic:       '📚',
  infrastructure: '🔧',
  welfare:        '💚',
}

function buildCaption(idea, baseUrl) {
  const emoji = CAT_EMOJI[idea.category] || '💡'
  const tag = idea.category.toUpperCase()
  const desc = idea.description.length > 800
    ? idea.description.slice(0, 800) + '…'
    : idea.description

  return [
    `${emoji} ${tag} · MedReform COMJNMH`,
    '',
    idea.title,
    '',
    desc,
    '',
    '━━━━━━━━━━━━━━━━━━',
    `🗳 ${idea.votes} vote${idea.votes !== 1 ? 's' : ''} on our platform`,
    `💬 Submit your own ideas anonymously 👇`,
    `${baseUrl}`,
    '',
    '#COMJNMH #MedReform #KalyaniMedicalCollege #StudentVoice #MedicalEducation #WestBengal',
  ].join('\n')
}

export async function postToInstagram(idea, baseUrl) {
  if (!IG_USER_ID || !ACCESS_TOKEN) {
    throw new Error('Instagram credentials not configured (IG_USER_ID / IG_ACCESS_TOKEN missing)')
  }

  const imageUrl = `${baseUrl}/api/og?id=${idea.id}`
  const caption  = buildCaption(idea, baseUrl)

  // Step 1 — create media container
  const containerRes = await fetch(`${GRAPH_URL}/${IG_USER_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: ACCESS_TOKEN }),
  })
  const container = await containerRes.json()
  if (!container.id) {
    throw new Error(`Container creation failed: ${JSON.stringify(container)}`)
  }

  // Small delay so Instagram can fetch and process the image
  await new Promise(r => setTimeout(r, 3000))

  // Step 2 — publish the container
  const publishRes = await fetch(`${GRAPH_URL}/${IG_USER_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: ACCESS_TOKEN }),
  })
  const published = await publishRes.json()
  if (!published.id) {
    throw new Error(`Publish failed: ${JSON.stringify(published)}`)
  }

  return published.id
}
