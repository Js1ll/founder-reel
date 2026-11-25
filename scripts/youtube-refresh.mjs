// Finds recent YouTube interview videos for each person, from two places:
//  1. The newest uploads of the channels in data/sources.json ("channels", by @handle). Uploads that name one of your people are added automatically.
//  2. A keyword search per person. Results from channels in "trustedChannels" are added automatically; everything else goes to data/candidates.json for review.
// Needs YOUTUBE_API_KEY (free key, YouTube Data API v3). X cannot be searched for free, so there is no X source.
import fs from 'node:fs';
const key = process.env.YOUTUBE_API_KEY;
if (!key) { console.error('Set YOUTUBE_API_KEY'); process.exit(1); }
const file = n => new URL(`../data/${n}.json`, import.meta.url);
const read = n => JSON.parse(fs.readFileSync(file(n), 'utf8'));
const ceos = read('ceos'), clips = read('clips'), src = read('sources');
const trusted = new Set((src.trustedChannels || []).map(s => s.toLowerCase()));
const known = new Set(clips.map(c => c.url));
const daysBack = Number(process.env.DAYS_BACK) || src.daysBack || 14;   // set DAYS_BACK=180 for a one-off backfill
const since = new Date(Date.now() - daysBack * 864e5).toISOString();
const today = new Date().toISOString().slice(0, 10);
const maxAdd = Number(process.env.MAX_ADD) || src.maxAutoAddPerRun || 6, maxPer = Number(process.env.PER_PERSON) || src.maxAutoAddPerPerson || 2, maxMin = src.maxMinutes || 15;
const block = (src.blockWords || []).map(w => w.toLowerCase());
const perPerson = {};
const decode = s => (s || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const minutes = iso => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || ''); return m ? (+m[1] || 0) * 60 + (+m[2] || 0) + (+m[3] || 0) / 60 : 999; };
const api = async (path, params) => {
  const u = new URL('https://www.googleapis.com/youtube/v3/' + path);
  u.search = new URLSearchParams({ ...params, key });
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${path} ${r.status} ${await r.text()}`);
  return r.json();
};
const added = [], candidates = [];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const personIn = (title, desc) => ceos.find(p => {
  const last = p.name.split(' ').slice(-1)[0];
  return new RegExp('\\b' + esc(p.name) + '\\b', 'i').test(title + ' ' + desc) || new RegExp('\\b' + esc(last) + '\\b', 'i').test(title);
});
const details = async ids => ids.length ? (await api('videos', { part: 'snippet,contentDetails', id: ids.slice(0, 50).join(',') })).items || [] : [];
const toClip = (v, ceo) => {
  const channel = decode(v.snippet.channelTitle), title = decode(v.snippet.title).trim();
  const desc = decode(v.snippet.description).replace(/\s+/g, ' ').trim();
  let take = (desc.split(/(?<=[.!?])\s/)[0] || '').slice(0, 200);
  if (take.length < 25 || /https?:|www\.|follow |subscribe|@/i.test(take)) take = `From ${channel}.`;
  return { id: 'y' + v.id, ceo: ceo.id, url: `https://www.youtube.com/watch?v=${v.id}`, title: title.slice(0, 120), take, src: 'YouTube', moods: [], added: today };
};
const accept = (v, ceo, auto) => {
  if (known.has(`https://www.youtube.com/watch?v=${v.id}`)) return;
  if (minutes(v.contentDetails.duration) > maxMin) return;
  known.add(`https://www.youtube.com/watch?v=${v.id}`);
  const title = decode(v.snippet.title).toLowerCase();
  const okAuto = auto && added.length < maxAdd && (perPerson[ceo.id] || 0) < maxPer
    && title.includes(ceo.name.toLowerCase()) && !block.some(w => title.includes(w));
  if (okAuto) { added.push(toClip(v, ceo)); perPerson[ceo.id] = (perPerson[ceo.id] || 0) + 1; }
  else candidates.push({ ceo: ceo.id, url: `https://www.youtube.com/watch?v=${v.id}`, title: decode(v.snippet.title), channel: decode(v.snippet.channelTitle), published: v.snippet.publishedAt, minutes: Math.round(minutes(v.contentDetails.duration)) });
};

// 1. Newest uploads from the listed channels
for (const handle of src.channels || []) {
  try {
    const ch = await api('channels', { part: 'contentDetails', forHandle: handle });
    const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) { console.error(`channel ${handle}: not found, check the handle`); continue; }
    const list = await api('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: '30' });
    const ids = (list.items || []).filter(i => i.contentDetails.videoPublishedAt >= since).map(i => i.contentDetails.videoId);
    for (const v of await details(ids)) {
      const ceo = personIn(decode(v.snippet.title), decode(v.snippet.description));
      if (ceo) accept(v, ceo, true);
    }
  } catch (e) { console.error(`channel ${handle}:`, e.message); }
}
// 2. Keyword search per person
for (const p of ceos) {
  try {
    const found = await api('search', { part: 'snippet', type: 'video', q: `"${p.name}" interview`, publishedAfter: since, maxResults: '15', order: 'relevance' });
    const ids = (found.items || []).map(i => i.id.videoId).filter(Boolean);
    const last = p.name.split(' ').slice(-1)[0].toLowerCase();
    for (const v of await details(ids)) {
      if (!decode(v.snippet.title).toLowerCase().includes(last)) continue;
      accept(v, p, trusted.has(decode(v.snippet.channelTitle).toLowerCase()));
    }
  } catch (e) { console.error(p.id, e.message); }
}
if (added.length) fs.writeFileSync(file('clips'), JSON.stringify([...clips, ...added], null, 1) + '\n');
fs.writeFileSync(file('candidates'), JSON.stringify(candidates, null, 1) + '\n');
console.log(`added ${added.length} clips automatically, ${candidates.length} candidates to review`);
