import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildBriefs } from '../scripts/export-briefs.mjs';
const sample=()=>JSON.parse(readFileSync(new URL('../examples/evidence.json',import.meta.url),'utf8'));
test('brief carries source, creator, case and every validation step',()=>{
  const data=sample(),[brief]=buildBriefs(data);
  for(const expected of [data.authors[0].name,data.works[0].url,data.topics[0].ownCase,...data.topics[0].validation])assert.ok(brief.content.includes(expected));
  assert.match(brief.content,/未证明实际制作效果/);
});
test('filenames are controlled and do not use external IDs',()=>{
  const data=sample();data.topics[0].id='../../private';
  assert.equal(buildBriefs(data)[0].file,'topic-01.md');
});
test('unknown source prevents exporting misleading briefs',()=>{
  const data=sample();data.topics[0].workId='missing';
  assert.throws(()=>buildBriefs(data),/unknown workId/);
});
