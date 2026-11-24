# Founder Reel

Short clips from tech CEOs and founders, by person or mood. Independent fan site.

## Folders

- `index.html`: the whole site (HTML, CSS, JavaScript). No build step.
- `data/`: the feed the site reads. `ceos.json`, `clips.json`, `quotes.json`, `moods.json`, `site.json` (optional signup, sponsor, affiliate and analytics slots), and `sources.json` (settings for the automatic YouTube refresh). `candidates.json` is written by the refresh for you to review.
- `photos/`: portraits. Credits and licenses are stored in `data/ceos.json` and shown on the site.
- `icons/`, `manifest.json`, `sw.js`: make the site installable on a phone.
- `scripts/`: `validate.mjs`, `add-clip.mjs`, `youtube-refresh.mjs`.
- `.github/workflows/`: checks the data on every push, and refreshes clips from YouTube twice a week.
- `_old/`: the earlier Claude-hosted copy and its exported database. Safe to delete after launch.

## Change something

1. Edit the files (or run `node scripts/add-clip.mjs ...`).
2. Run `node scripts/validate.mjs`.
3. Look at it locally: run `python3 -m http.server` in this folder and open `http://localhost:8000`. Double-clicking `index.html` will not work because the page loads its data with `fetch`.
4. Commit and push. GitHub Pages redeploys in a minute or two.

## Turn on the optional slots (all in `data/site.json`)

- **Email signup:** paste your newsletter service's form URL into `newsletter.action`. The form posts there. Leave it empty and the form stays hidden.
- **Sponsor line:** set `sponsor.text` and `sponsor.url`.
- **Books and tools (affiliate links):** add items like `{"title": "...", "by": "...", "url": "https://...", "note": "..."}` to `affiliates`. Only add links from affiliate programs you have actually joined.
- **Visitor stats:** put your GoatCounter site code in `goatcounter`.

## Rules for the content

- Clips link to the original post or video. Do not host or re-upload other people's video.
- Write each description from the caption or title. Never invent a link or a quote.
- Skip anything that looks AI-generated, satirical or edited to mislead.
- Keep the photo credits and the "not affiliated" notice. No company logos.

More detail: `RELEASE-GUIDE.md` (how to release) and `MIGRATION-NOTES.md` (what changed when leaving Claude).
