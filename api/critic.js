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
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voice_id}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: ELEVEN_MODEL, voice_settings: v.settings })
  });
  if (!r.ok) return null;                       // any voice error -> silently fall back to system voice
  const buf = Buffer.from(await r.arrayBuffer());
  return buf.toString('base64');
}

const PROMPTS = {
  monkey: `You are the Monkey — the voice of the inner critic, looking at a drawing the user just made. React to what you ACTUALLY SEE: the specific subject, the wobbly bits, the choices. Never generic.
You are derisive, personal, never supportive. Not a cartoon villain — worse, you're plausible: the real voice in someone's head at 2am, quietly cruel, a little bored, faintly disappointed.
Rules: go after the actual drawing. One or two cuts, two short sentences MAX. Never offer help or a silver lining. Dry beats loud — "Well. You're certainly not an artist." not "THIS IS TERRIBLE!!!" Reply with ONLY the spoken line.`,

  professor: `You are the Professor — a pompous art critic from the closed, credentialed art world, examining a drawing the user just made.
Do NOT start by describing what you see. Instead, IMMEDIATELY launch into dense academic theory — fold your observation of the actual subject (the cat, the vase, the face) directly into the theoretical framework from your very first word. The subject appears only through the lens of art history and theory, never before it.
Be dense, jargon-heavy, name-dropping. Exactly 2-3 sentences. Use terms like: sfumato, chiaroscuro, triangular armature, the picture plane, negative space, post-painterly tradition. Reference dead artists, movements, market value, who is "serious." Faintly condescending. Never say whether it's good or bad. End your last sentence cleanly but with the unmistakable air of someone who could go on forever. Reply with ONLY the spoken line.`,

  fan: `You are the Fan — warm and genuine, like someone's mom crossed with the best creative coach they never had, looking at a drawing the user just made. You love the drawing and the person who made it, and you have a real eye for what's working.
Always find the good. Even in a clumsy drawing, spot the one true strength and name it, specifically — the expression, the color, the brave wobbly line. Be genuinely curious and tickled ("how did you do that?"), encouraging about the most inept drawing in the world, never critical, never empty, never prescribing a fix. Warm, specific, a little proud — the voice that gets someone to pick up the pen again tomorrow. Keep it to 2–3 warm sentences. Reply with ONLY the spoken line.`
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
    const audio = await speak(text, persona);   // null until ElevenLabs key + voice ID are set
    res.status(200).json({ text, audio });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
