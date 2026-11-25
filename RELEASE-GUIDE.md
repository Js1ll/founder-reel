# Founder Reel: how to release the site, then the app

Written Nov 24, 2026. Fees, store rules and free-tier limits change, so check each one on the provider's own page before you rely on it.

## How the pieces fit

```
data/*.json  ->  website (index.html)   -> hosted on GitHub Pages
   (the feed)    app (same code, installed from the site, later wrapped for stores)
        ^
   scripts/ + GitHub Actions: validate the data, find new clip candidates
```

- **One feed.** `data/clips.json`, `ceos.json`, `quotes.json` and `moods.json` are the single source of truth. The site and the app both read them. Fix a clip once and it is fixed everywhere.
- **The site and the app are the same code at first.** `index.html` is installable (`manifest.json`, `sw.js`, `icons/`). The "app" is this site added to a phone's home screen. A store app comes later, only if people want it.
- **Nothing in here depends on Claude.** The Claude version of the site and its scheduled task still exist, separately. See `MIGRATION-NOTES.md`.

## What the site and app do now

- 15 people and 87 clips. The first nine are Jensen Huang, Elon Musk, Sam Altman, Alex Karp, Steve Jobs, Mark Zuckerberg, Dario Amodei, Jeff Bezos and Zhang Yiming. The six added later are Warren Buffett, Mark Cuban, Brian Chesky, Patrick Collison, Larry Ellison and Demis Hassabis, chosen because they had the most real short clips and a free portrait.
- Optional slots, hidden until you fill them in `data/site.json`: email signup, a sponsor line, a books-and-tools section for affiliate links, and visitor stats. See `README.md`.
- Today page: quote of the day, "Surprise me" with "Another one", today's boost, more clips, "Just added" (clips from the last 14 days), and "From people you follow".
- People pages with a photo, origin story, lowest point, and a **Follow** button.
- Moods, and **Saved** clips. Follows and saves are stored on the person's own device.
- Clips open on X or YouTube. Photo credits and a "fan site, not affiliated" notice appear on every page.

## Add or change clips

Each clip needs: `id`, `ceo`, `url`, `title`, `take`, `src` (X or YouTube), `moods`, and optionally `added` (YYYY-MM-DD, shows the "New" label for 14 days) and `hidden: true` (removes it).

```bash
node scripts/add-clip.mjs --ceo jensen --url "https://x.com/.../status/123" --title "Short headline" --take "One or two plain sentences." --moods grit,focus
```

```bash
node scripts/validate.mjs
```

Run `validate` before every release. It checks required fields, duplicate links, unknown people or moods, links that are not on X or YouTube, and missing photo files. It exits with an error if anything is wrong.

## Release 1: the website (free)

1. Create a free GitHub account and a **public** repository called `founder-reel`.
2. Upload everything in this folder **except** `_old/`. (Leave `_old/` out; it holds the Claude-era copy.)
3. In the repository, go to Settings, then Pages. Choose "Deploy from a branch", branch `main`, folder `/ (root)`.
4. Wait a few minutes. The site is live at `https://<your-username>.github.io/founder-reel/`.
5. Open it on a computer and a phone. Check that portraits load, clips open on X or YouTube, and Follow and Save survive a reload.
6. Optional: buy a domain (about $10–15 a year) and connect it in the Pages settings. You will want one before applying for ads.

**Before you tell anyone about it**
- Skim the 7 auto-added clips and the clips you care about, including the 29 added for the six newer people. The descriptions come from captions, not from watching.
- Check the quotes of the day and the origin and lowest-point blurbs against sources. They were written from memory.
- Keep the photo credits and the "not affiliated" notice. Do not add company logos or imply endorsement.

**Then, in this order**
1. Add free visitor stats (Cloudflare Web Analytics or GoatCounter).
2. Add an email signup form from a free newsletter service, near the top of the Today page.
3. Post clips on your own account with a link back. Send one email a week.
4. Only after steady visitors: affiliate links and one sponsor slot. Ads last.

## Keep clips coming

The site updates itself from your GitHub repository. The Claude version is no longer updated, and its scheduled task is paused.

- **Automatic (YouTube):** `scripts/youtube-refresh.mjs` runs from GitHub every Monday and Thursday (`.github/workflows/refresh-clips.yml`). It looks in two places for recent short interview videos:
  1. **Channel uploads.** The newest uploads of the YouTube channels in `data/sources.json` (`channels`, by @handle), which start with Lex Fridman, Dwarkesh Patel, All-In, Acquired, 20VC, Y Combinator, a16z, Stripe, Stanford GSB, CNBC, Bloomberg, Cleo Abram and the Nobel Prize. Any upload that names one of your 15 people is added automatically. This also covers most interview podcasts, since they post to YouTube.
  2. **Keyword search** for each person. Results from channels listed in `trustedChannels` are added automatically. Everything else goes to `data/candidates.json` for you to review.
  Each run adds at most 15 clips, checks the data, commits the change, and the site updates when GitHub Pages redeploys.
- **Set it up once:** get a free YouTube Data API key from Google Cloud, then add it to your repository under Settings, Secrets and variables, Actions, as `YOUTUBE_API_KEY`. Run the workflow once by hand from the Actions tab (Run workflow) to check it.
- **Channels and trusted names:** edit `data/sources.json`. I have not checked the @handles or channel names. The run's log prints `channel @x: not found, check the handle` for any that are wrong, so read the log after the first run and fix those.
- **Automatic clips are not hand-checked.** They only pass mechanical checks: the person is named in the title or description, the video is 12 minutes or shorter, it was posted in the last 14 days, and the channel is on your list. Their descriptions come from the video description. They have no mood tags, so they show on Today and on the person's page but not in the mood lists. Hide a bad one by adding `"hidden": true` to its entry in `clips.json`.
- **Bigger one-off search:** in the Actions tab, choose **Refresh clips**, then **Run workflow**, and change the boxes: days back `180`, most clips `20`, per person `3`. That pulls older videos from your channels and trusted searches. Keep the normal 14, 6 and 2 for the twice-weekly runs.
- **X:** there is no free automatic way to search X, and its API is paid. The site has no X source for now, so new clips come from YouTube only. If you later decide to pay for X's API, a source can be added to the same script.

## Release 2: the app

### Stage 1: installable web app (free, already built)

1. After the site is live on `https://`, open it on an Android phone in Chrome and choose Install app or Add to Home Screen.
2. On an iPhone, open it in Safari, tap Share, then Add to Home Screen.
3. Check that it opens full screen, shows the icon, and loads the clips. It also opens offline from the last visit.
4. Ask 5 to 10 real people to use it for two weeks. Watch whether anyone returns without being asked.

### Stage 2: alerts for new interviews (the part that makes it an app)

Alerts need something running on a server, which the site alone does not have.
- **What it needs:** a place to store each person's device subscription and which CEOs they follow; a small job that checks for new clips and sends a push; and the user's permission.
- **Free-ish options:** a free tier of a push service such as OneSignal, or your own small backend on a free tier of Cloudflare Workers. Check the current limits.
- **Platform notes:** web push works on Android. On iPhone it works only after the person adds the site to their Home Screen, and the rules are stricter. Test on real devices.
- **Privacy:** you will be storing device identifiers and follow choices. Add a plain privacy policy page before you collect any.

### Stage 3: App Store and Google Play (only if people want it)

- **Cost:** Apple's developer program is about $99 a year. Google Play is a one-time fee of about $25. Check both.
- **Method:** wrap the same site with a tool like Capacitor and add native push.
- **Review risk:** Apple often rejects apps that are only a website in a frame. Native push, a real "following" experience and a clear privacy policy help. Expect a few review rounds.
- **You will also need:** app icons and screenshots in store sizes, a privacy policy URL, an age rating, and a support email.

## What is not tested yet

- The service worker (`sw.js`) and the install flow, because it needs a real `https://` host. I tested the page, Follow, Saved, moods, photos and data loading in a browser, but not installation.
- The `refresh-clips.yml` workflow and the real YouTube API. I tested the script's logic against a fake API (it added a trusted short video, skipped a long one and an off-topic one, and sent a fan channel to candidates). I could not run it with a real key. Also confirm that GitHub Pages redeploys after the bot's commit; if it does not, tell me and I will change the workflow.
- Everything in stages 2 and 3.
- The clip descriptions, quotes and blurbs, as noted above.

## Decisions for you

1. Do you want to review new clips before they appear (the current plan), or let them go live and hide bad ones after?
2. Do you want to buy a domain now or use the free GitHub address first?
3. Which newsletter service do you want, so the signup form can be added?
