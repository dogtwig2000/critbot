# CritBot — getting it on your phone

Three files:
- `index.html` — the app (camera, three voices, captions, speech)
- `api/critic.js` — a tiny server that holds your key and runs the voices
- this readme

## Deploy (about 5 minutes, free)

1. Make a free account at **vercel.com** (sign in with GitHub).
2. Put these files in a folder (keep `api/critic.js` inside an `api` folder — that's what makes it a server function).
3. Easiest path: install the CLI once in Terminal — `npm i -g vercel` — then from the folder run `vercel`. Follow the prompts. Or: push the folder to a GitHub repo and "Import Project" on vercel.com.
4. Add your key: Vercel dashboard → your project → **Settings → Environment Variables** → add
   `ANTHROPIC_API_KEY` = your key (get one at console.anthropic.com).
   Redeploy after adding it (`vercel --prod`).

You'll get a URL like `the-critic.vercel.app`. Open it on your iPhone, allow the camera, point it at a drawing, snap, tap a critic.

## Notes

- **The key never touches the phone.** It lives in that Vercel setting, server-side. Safe.
- **Voices right now** are the iPhone's built-in text-to-speech (free, a bit robotic). The whisper / British / mom-chuckle cast needs a real voice service (ElevenLabs) — that slots into the same `api/` folder later. Tell me when you want it.
- **iPhone speech can be finicky** the first tap. If it doesn't speak, tapping a critic again usually wakes it. If it stays flaky, that's our cue to go to ElevenLabs sooner.
- Tweak a voice anytime by editing the prompts in `api/critic.js` and re-pushing.
