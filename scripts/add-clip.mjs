// Adds one clip by hand.
// node scripts/add-clip.mjs --ceo jensen --url https://x.com/... --title "..." --take "..." --moods grit,focus
import fs from 'node:fs';
const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
const file = new URL('../data/clips.json', import.meta.url);
const clips = JSON.parse(fs.readFileSync(file, 'utf8'));
const { ceo, url, title, take } = args;
if (!ceo || !url || !title || !take) { console.error('Need --ceo --url --title --take (and optionally --moods a,b)'); process.exit(1); }
let m = url.match(/status\/(\d+)/), id = m && 'x' + m[1];
if (!id) { m = url.match(/[?&]v=([\w-]+)/) || url.match(/youtu\.be\/([\w-]+)/); id = m && 'y' + m[1]; }
if (!id) { console.error('Could not read a post or video id from the url'); process.exit(1); }
if (clips.some(c => c.url === url || c.id === id)) { console.error('Already in clips.json'); process.exit(1); }
clips.push({ id, ceo, url, title, take, src: /youtu/.test(url) ? 'YouTube' : 'X', moods: (args.moods || '').split(',').filter(Boolean), added: new Date().toISOString().slice(0, 10) });
fs.writeFileSync(file, JSON.stringify(clips, null, 1) + '\n');
console.log('added', id);
