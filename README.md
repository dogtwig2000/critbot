# CritBot

Three files:
- `index.html` — the app (camera, three critics, captions, voices)
- `api/critic.js` — the server: holds your keys, runs the critic + the voice
- this readme

## 1. Connect the brain (no terminal needed)

You've already got it on Vercel via GitHub. To make it think:

1. Get a key at **console.anthropic.com** → API Keys → Create Key → copy it.
2. Vercel dashboard → your project → **Settings → Environment Variables**.
3. Add: name `ANTHROPIC_API_KEY`, value = your key. Save.
4. **Deployments** tab → newest deployment → "⋯" → **Redeploy**.
   (The key only loads on the next deploy — adding it alone does nothing.)

Open your Vercel URL on your phone, allow the camera, point at a drawing, pick a critic, tap **Crit**. A real, specific line = brain connected.

## 2. Real voices (ElevenLabs)

1. In ElevenLabs, pick three voices and copy each one's **Voice ID**
   (click a voice → its ID is on the detail panel). Suggested casting:
   - **Monkey** — intimate, whispery, close. The voice inside your own head.
   - **Professor** — plummy, slightly British, unhurried.
   - **Fan** — warm woman, ~50s, a natural little laugh.
2. Paste those IDs into the `VOICES` map at the top of `api/critic.js`
   (replace the `PASTE_…` placeholders). Commit/push to GitHub.
3. In Vercel → Settings → Environment Variables, add
   `ELEVENLABS_API_KEY` = your ElevenLabs key. Save, then Redeploy.

Voices switch on automatically. Any voice slot you leave as `PASTE_…`
falls back to the phone's system voice, so you can wire them one at a time.

Tweak `voice_settings` (stability / style) in `api/critic.js` to taste, or
swap `ELEVEN_MODEL` to `eleven_v3` to play with expressive audio tags.

## Notes

- **Keys never touch the phone.** They live in Vercel's settings, server-side.
- **Anyone with the URL spends your credits.** Fine for testing and filming; add a password before sharing widely.
- Edit any critic's personality in the `PROMPTS` in `api/critic.js`, push, done.
