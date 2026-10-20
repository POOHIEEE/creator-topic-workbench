import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate, render } from '../scripts/workbench.mjs';
const sample = () => JSON.parse(readFileSync(new URL('../examples/evidence.json',import.meta.url),'utf8'));

test('sample produces a clearly labelled demo and separate categories',()=>{
  const data=sample(),qa=validate(data),html=render(data,qa);
  assert.deepEqual(qa.errors,[]); assert.match(html,/虚构教学数据/); assert.match(html,/AIGC选题/); assert.match(html,/通用选题/); assert.match(html,/播放 未知/);
});
test('unknown metric and real zero are not conflated',()=>{
  const data=sample();data.works[0].metrics.views=0;
  assert.match(render(data),/播放 0/);data.works[0].metrics.likes=-1;
  assert.ok(validate(data).errors.some(e=>e.includes('likes')));
});
test('dangling source and duplicate IDs fail',()=>{
  const data=sample();data.topics[0].workId='missing';data.authors.push({...data.authors[0]});
  assert.ok(validate(data).errors.some(e=>e.includes('unknown workId')));assert.ok(validate(data).errors.some(e=>e.includes('duplicate')));
});
test('old and missing observation timestamps warn instead of pretending freshness',()=>{
  const data=sample();data.generatedAt='2026-11-20T00:00:00Z';
  assert.ok(validate(data).warnings.some(e=>e.includes('seven days')));
  data.works[0].observedAt=null;assert.ok(validate(data).warnings.some(e=>e.includes('unknown')));
});
test('unsafe URLs fail and evidence text is escaped',()=>{
  const data=sample();data.works[0].url='javascript:alert(1)';assert.ok(validate(data).errors.length);
  data.works[0].url='https://user:password@example.com/';assert.ok(validate(data).errors.length);
  data.works[0].url='https://example.com/work';data.topics[0].title='<script>alert(1)</script>';
  const html=render(data);assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});
test('malformed dates, future observations and absent validation fail',()=>{
  const data=sample();data.works[0].publishedAt='yesterday';data.works[0].observedAt='2030-01-01T00:00:00Z';data.topics[0].validation=[];
  assert.ok(validate(data).errors.length>=3);
});
test('invalid collections are rejected without crashing',()=>{
  assert.ok(validate(null).errors.length);const data=sample();data.authors=[null];assert.ok(validate(data).errors.length);
});
