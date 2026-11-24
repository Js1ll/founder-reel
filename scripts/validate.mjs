// Checks data/*.json before a release. Exit code 1 means do not deploy.
import fs from 'node:fs';
const read = n => JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const ceos = read('ceos'), clips = read('clips'), moods = read('moods'), quotes = read('quotes');
const OKHOST = /^https:\/\/(www\.)?(x\.com|twitter\.com|youtube\.com|youtu\.be)\//;
const ceoIds = new Set(ceos.map(c => c.id)), moodIds = new Set(moods.map(m => m.id));
const errors = [];
const fail = m => errors.push(m);

for (const c of ceos) {
  for (const k of ['id', 'name', 'company', 'start', 'low', 'photo', 'photoCredit', 'photoLicense', 'photoSource'])
    if (!c[k]) fail(`ceo ${c.id || '?'} missing ${k}`);
  if (c.photo && !fs.existsSync(new URL(`../${c.photo}`, import.meta.url))) fail(`ceo ${c.id}: photo file ${c.photo} not found`);
}
const ids = new Set(), urls = new Set();
for (const c of clips) {
  const tag = `clip ${c.id || c.url || '?'}`;
  for (const k of ['id', 'ceo', 'url', 'title', 'take', 'src', 'moods']) if (c[k] == null || c[k] === '') fail(`${tag} missing ${k}`);
  if (c.id && !/^[A-Za-z0-9_-]{1,200}$/.test(c.id)) fail(`${tag}: bad id`);
  if (ids.has(c.id)) fail(`${tag}: duplicate id`); ids.add(c.id);
  if (urls.has(c.url)) fail(`${tag}: duplicate url`); urls.add(c.url);
  if (!ceoIds.has(c.ceo)) fail(`${tag}: unknown ceo ${c.ceo}`);
  if (!OKHOST.test(c.url || '')) fail(`${tag}: url must be https on x.com, twitter.com, youtube.com or youtu.be`);
  if (!['X', 'YouTube'].includes(c.src)) fail(`${tag}: src must be X or YouTube`);
  if (!Array.isArray(c.moods) || c.moods.some(m => !moodIds.has(m))) fail(`${tag}: moods must come from ${[...moodIds].join(', ')}`);
  if (c.added && !/^\d{4}-\d{2}-\d{2}$/.test(c.added)) fail(`${tag}: added must be YYYY-MM-DD`);
  if ((c.title || '').length > 120) fail(`${tag}: title over 120 characters`);
}
for (const q of quotes) if (!ceoIds.has(q.ceo) || !q.text || !q.who) fail(`quote "${(q.text || '').slice(0, 30)}" is incomplete or has an unknown ceo`);

if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`ok: ${ceos.length} ceos, ${clips.length} clips, ${quotes.length} quotes, ${moods.length} moods`);
