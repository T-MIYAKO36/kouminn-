import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('app.js');
const html = read('index.html');
const css = read('styles.css') + read('responsive.css');
const sandbox = { window: {} };
vm.runInNewContext(read('questions.js'), sandbox);
const Q = sandbox.window.HIROPON_Q;

assert.equal(Object.values(Q.basic).flat().length, 30, '基礎問題は30問');
assert.equal(Q.numbers.length, 17, '数字問題は17問');
assert.equal(Q.sequences.length, 5, '並べ替えは5問');
assert.equal(Q.boss.length, 8, 'ボス問題は8問');

const choiceQuestions = [...Object.values(Q.basic).flat(), ...Q.numbers, ...Q.boss];
for (const q of choiceQuestions) {
  assert(q.c.includes(q.a), `正答が選択肢に含まれる: ${q.q}`);
  assert.equal(new Set(q.c).size, q.c.length, `選択肢の重複なし: ${q.q}`);
}

assert.equal((app.match(/mode:'mission'/g) || []).length, 5, '5地区に専用ミッション');
assert.equal((app.match(/mode:'keypad'/g) || []).length, 3, 'テンキーは3ロック');
assert(app.includes("slice(0,2)"), '手続き回廊は2題');
assert(app.includes("slice(0,3)"), 'ボス戦は3題');
assert(app.includes("SAVE='hiropon_ch4_v2'"), 'v2用の保存領域');

const requiredAssets = [
  'assets/ch4-cover-final.webp',
  'assets/se-correct-favorite.mp3',
  'assets/se-whistle-fanfare-favorite.mp3',
  'assets/se-reward-8bit-favorite.mp3',
  'assets/se-fail-gagaan-favorite.mp3',
  'assets/se-countdown-favorite.mp3'
];
const corridorAssets = [
  'assets/corridor-hall.webp',
  'assets/corridor-chamber.webp',
  'assets/corridor-committee.webp',
  'assets/corridor-members.webp',
  'assets/corridor-underground.webp',
  'assets/benzo-inspect.webp',
  'assets/benzo-fall.webp',
  'assets/benzo-despair.webp',
  'assets/hiropon-scold.webp'
];
for (const file of requiredAssets) {
  const full = path.join(root, file);
  assert(fs.existsSync(full), `必須アセットあり: ${file}`);
  assert(fs.statSync(full).size > 1000, `必須アセットが空でない: ${file}`);
  assert(app.includes(file) || html.includes(file), `必須アセットを参照: ${file}`);
}
for (const file of corridorAssets) {
  const full = path.join(root, file);
  assert(fs.existsSync(full), `異変回廊アセットあり: ${file}`);
  assert(fs.statSync(full).size > 10000, `異変回廊アセットが空でない: ${file}`);
  assert(app.includes(file) || html.includes(file) || css.includes(file), `異変回廊アセットを参照: ${file}`);
}

assert(html.includes('苦手復習'), 'クリア後ホームに苦手復習ボタン');
assert(html.includes('学習ステージ'), 'クリア後ホームから学習ステージへ戻れる');
assert(app.includes('enableKeypadNext'), 'テンキー内に次へボタンを表示');
assert(app.includes('enableBossNext'), 'ボス戦の選択肢直下に次へボタンを表示');
assert(app.includes('boss-choice-hidden'), 'ボス回答後は正解カードと進行ボタンだけを表示');
assert(app.includes('keypad-inline-feedback'), 'テンキー内にヒントを表示');
assert(html.includes('国会議事堂・異変回廊'), 'クリア後ボーナスに異変回廊');
assert(html.includes('data-action="map"') && html.includes('data-action="corridor"') && html.includes('data-action="review"'), 'クリア後ホームに3つの進路');
assert(app.includes('corridorGroups') && app.includes('corridorChoice'), '異変回廊のランダム5場面と進む・戻る判定');
assert((app.match(/place:'/g) || []).length >= 10, '正常と異変を混ぜた10場面以上');
assert(!app.includes("sfx('fanfare');playRouteJingle"), '地区クリア後にホイッスルを鳴らさない');
const withoutOfficialTour = (app + html + css).replace('https://www.sangiin.go.jp/VRTour/index.html', '');
assert(!/https?:\/\//.test(withoutOfficialTour), '参議院公式VR以外の外部URL・CDNなし');
assert.equal((app.match(/code:'(?:46|40|10)'/g) || []).length, 3, '数字コード46・40・10');

console.log('QA PASS: 問題60問／1周18活動／5ミッション／3テンキー／2並べ替え／3ボス');
