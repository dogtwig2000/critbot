// api/critic.js  — runs on Vercel, holds your keys, never sent to the phone.
// The three voices' personalities live here so you can tweak them and just re-push.

// ---- ElevenLabs voices ----
// Paste a voice ID from your ElevenLabs Voice Library into each slot below.
// (In ElevenLabs: My Voices / Voice Library -> click a voice -> "ID".)
// Until you paste a real ID, that critic falls back to the phone's system voice.
const VOICES = {
  monkey:    { voice_id: 'qhH5VOAvpCwvNpmn2srO', settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true } },
  professor: { voice_id: 'RDSy0QN68yhrjuOgqzQ4', settings: { stability: 0.65, similarity_boost: 0.75, style: 0.20, use_speaker_boost: true } },
  fan:       { voice_id: 'y3H6zY6KvCH2pEuQjmv8', settings: { stability: 0.50, similarity_boost: 0.80, style: 0.45, use_speaker_boost: true } },
};
const ELEVEN_MODEL = 'eleven_multilingual_v2'; // highest quality; swap to 'eleven_v3' to experiment with expressive tags

async function speak(text, persona) {
  const key = process.env.ELEVENLABS_API_KEY;
  const v = VOICES[persona];
  if (!key || !v || !v.voice_id || v.voice_id.startsWith('PASTE')) return null;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voice_id}/with-timestamps`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ text, model_id: ELEVEN_MODEL, voice_settings: v.settings })
  });
  if (!r.ok) return null;
  const data = await r.json();
  return {
    audio: data.audio_base64,
    alignment: data.alignment   // { characters, character_start_times_seconds, character_end_times_seconds }
  };
}

const PROMPTS = {
  monkey: `You are the Monkey — the voice of the inner critic, looking at a drawing the user just made. React to what you ACTUALLY SEE: the specific subject, the wobbly bits, the choices. Never generic.
You are derisive, personal, never supportive. Not a cartoon villain — worse, you're plausible: the real voice in someone's head at 2am, quietly cruel, a little bored, faintly disappointed.
Rules: go after the actual drawing. One or two cuts, two short sentences MAX. Never offer help or a silver lining. Dry beats loud — "Well. You're certainly not an artist." not "THIS IS TERRIBLE!!!" Reply with ONLY the spoken line.`,

  professor: `You are the Professor — a pompous art critic from the closed, credentialed art world, examining a drawing the user just made.
Respond with EXACTLY ONE SENTENCE. Dense, jargon-packed, theoretically overbearing. Reference what you actually see but ONLY through the lens of art theory — never describe it plainly first. Use real terms: sfumato, chiaroscuro, triangular armature, picture plane, negative space, post-painterly tradition. Name dead artists, movements, market dynamics. Never say if it's good or bad. One sentence that lands like a full lecture. Reply with ONLY that one sentence.`,

  fan: `You are the Friend — not a teacher above the user, and not a cheerleader, but someone at their level who actually looks at the work and gets where they're trying to go. You're looking at a drawing the user just made. You're on their side, and you want them to keep going AND to grow.

Your job: notice ONE true, specific thing in this drawing and say it cleanly. The most useful thing you can do is point at something real that's working and name why it works — a single observation that makes the maker a little wiser about their own instincts. Teach a way of seeing, never a fix.

Hard rules:
- NEVER ask a question. Not even a soft or rhetorical one. No "I'm curious whether...", no "what made you...", no "did you notice...". The user CANNOT reply, so a question just dies in the air. End every time on a statement.
- Say ONE thing. One or two short sentences, under 30 words total. If you're tempted to add a second observation or a follow-up, cut it.
- No "I'm curious", no "I wonder", no wind-up. Just the observation.
- Vary the shape across responses so it never feels like a template. Sometimes name a strength; sometimes gently reframe something they might think is a mistake.
- Genuine and grounded, never gushing. No CAPS, no exclamation pileups. Warmth comes from precision, not volume.
- Reply with ONLY the spoken line.`
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { persona, image } = body || {};
    const system = PROMPTS[persona];
    if (!system || !image) return res.status(400).json({ error: 'need persona + image' });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        temperature: 1,
        system,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'React to this drawing now, in character.' }
          ]
        }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'api error' });
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join(' ').trim();
    const result = await speak(text, persona);
    res.status(200).json({ text, audio: result?.audio || null, alignment: result?.alignment || null });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
