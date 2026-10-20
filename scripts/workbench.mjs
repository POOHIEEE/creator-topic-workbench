import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const iso = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
const url = value => {
  try { const parsed = new URL(value); return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password; }
  catch { return false; }
};
const text = value => typeof value === 'string' && value.trim().length > 0;

export function validate(data) {
  const errors = [], warnings = [];
  if (!data || typeof data !== 'object') return {errors:['Expected an object'], warnings};
  if (!iso(data.generatedAt)) errors.push('generatedAt must be an ISO timestamp with timezone');
  if (typeof data.demo !== 'boolean') errors.push('demo must be boolean');
  for (const name of ['authors','works','topics']) {
    if (!Array.isArray(data[name]) || data[name].some(item => !item || typeof item !== 'object' || Array.isArray(item))) errors.push(`${name} must be an array of objects`);
  }
  if (errors.length) return {errors,warnings};
  const ids = {};
  for (const name of ['authors','works','topics']) {
    ids[name] = new Set();
    for (const item of data[name]) {
      if (!text(item.id) || ids[name].has(item.id)) errors.push(`${name}: missing or duplicate id`);
      ids[name].add(item.id);
    }
  }
  for (const author of data.authors) {
    for (const field of ['name','platform']) if (!text(author[field])) errors.push(`${author.id}: missing ${field}`);
    if (!url(author.url)) errors.push(`${author.id}: invalid profile URL`);
  }
  for (const work of data.works) {
    if (!ids.authors.has(work.authorId)) errors.push(`${work.id}: unknown authorId`);
    if (!text(work.title) || !url(work.url)) errors.push(`${work.id}: missing title or invalid source URL`);
    if (!['metadata','transcript','full-work'].includes(work.basis)) errors.push(`${work.id}: invalid evidence basis`);
    for (const field of ['publishedAt','observedAt']) {
      if (work[field] === null) warnings.push(`${work.id}: ${field} unknown`);
      else if (!iso(work[field])) errors.push(`${work.id}: invalid ${field}`);
    }
    if (iso(work.publishedAt) && iso(work.observedAt) && Date.parse(work.publishedAt) > Date.parse(work.observedAt)) errors.push(`${work.id}: publication follows observation`);
    if (iso(work.observedAt) && Date.parse(work.observedAt) > Date.parse(data.generatedAt)) errors.push(`${work.id}: observation follows report date`);
    if (iso(work.observedAt) && Date.parse(data.generatedAt) - Date.parse(work.observedAt) > 7*86400000) warnings.push(`${work.id}: evidence older than seven days`);
    for (const field of ['views','likes','favorites']) {
      const value = work.metrics?.[field];
      if (value !== null && (!Number.isSafeInteger(value) || value < 0)) errors.push(`${work.id}: ${field} must be a nonnegative integer or null`);
    }
  }
  for (const topic of data.topics) {
    if (!ids.works.has(topic.workId)) errors.push(`${topic.id}: unknown workId`);
    if (!['AIGC','通用'].includes(topic.category)) errors.push(`${topic.id}: invalid category`);
    for (const field of ['title','audienceProblem','borrow','ownCase']) if (!text(topic[field])) errors.push(`${topic.id}: missing ${field}`);
    if (!Array.isArray(topic.validation) || !topic.validation.length || !topic.validation.every(text)) errors.push(`${topic.id}: validation steps required`);
  }
  if (data.demo) warnings.unshift('DEMO: fictional teaching examples, not real creator evidence');
  return {errors,warnings};
}

export function render(data, qa = validate(data)) {
  if (qa.errors.length) throw new Error(qa.errors.join('\n'));
  const link = (href, label) => `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
  const count = value => value === null ? '未知' : value.toLocaleString('zh-CN');
  const day = value => value === null ? '未知' : escape(value.slice(0,10));
  const basis = {'metadata':'仅标题/简介','transcript':'已读转写','full-work':'已检查完整原作'};
  const authors = data.authors.map(author => {
    const works = data.works.filter(w => w.authorId === author.id);
    const topics = data.topics.filter(t => works.some(w => w.id === t.workId));
    const originals = works.map(w => `<li><strong>${link(w.url,w.title)}</strong><p>发布 ${day(w.publishedAt)} · 采样 ${day(w.observedAt)} · ${basis[w.basis]}</p><p>播放 ${count(w.metrics.views)} · 赞 ${count(w.metrics.likes)} · 收藏 ${count(w.metrics.favorites)}</p></li>`).join('');
    const groups = ['AIGC','通用'].map(category => `<section><h3>${category}选题</h3>${topics.filter(t=>t.category===category).map(t=>{
      const source = works.find(w=>w.id===t.workId);
      return `<details><summary>${escape(t.title)}</summary><p>参考：${link(source.url,source.title)}</p><dl><dt>观众问题</dt><dd>${escape(t.audienceProblem)}</dd><dt>借鉴点</dt><dd>${escape(t.borrow)}</dd><dt>自己的案例</dt><dd>${escape(t.ownCase)}</dd></dl><h4>制作前验证</h4><ol>${t.validation.map(step=>`<li>${escape(step)}</li>`).join('')}</ol><small>编辑草案，尚未实测或发布</small></details>`;
    }).join('') || '<p>暂无已整理选题</p>'}</section>`).join('');
    return `<article><header><h2>${escape(author.name)}</h2><span>${escape(author.platform)}</span> ${link(author.url,'作者主页')}</header><div class="columns"><section><h3>原作与证据</h3><ul>${originals || '<li>暂无原作证据，不做推荐</li>'}</ul></section><div>${groups}</div></div></article>`;
  }).join('');
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>竞品选题工作台</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f7f5;color:#152b24;font:15px/1.6 system-ui,sans-serif;letter-spacing:0}main{max-width:1120px;margin:auto;padding:28px 20px}h1{font-size:28px}h2{font-size:22px;margin:0}h3{font-size:16px}header{display:flex;gap:12px;align-items:center;flex-wrap:wrap}article{border-top:1px solid #cbd5cf;padding:24px 0}.columns{display:grid;grid-template-columns:1fr 1fr;gap:32px}a{color:#166e69;overflow-wrap:anywhere}ul{padding-left:18px}li{margin:12px 0}p{margin:7px 0}small,span{color:#52655c}details{padding:12px 0;border-bottom:1px solid #cbd5cf}summary{cursor:pointer;font-weight:600}dt{font-weight:600}dd{margin:0 0 10px}aside{padding:12px 0;color:#8f3c17}.demo{background:#fff1b5;padding:10px} @media(max-width:640px){.columns{grid-template-columns:1fr;gap:8px}main{padding:20px 16px}}</style><main><h1>竞品选题工作台</h1><p>作者原作 → 借鉴角度 → 自己的案例</p>${data.demo?'<p class="demo">虚构教学数据，仅用于验证界面和流程</p>':''}<p>整理时间：${escape(data.generatedAt)} · 不是实时榜单</p>${qa.warnings.length?`<aside><strong>证据提醒</strong><ul>${qa.warnings.map(w=>`<li>${escape(w)}</li>`).join('')}</ul></aside>`:''}${authors}</main></html>`;
}

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node scripts/workbench.mjs input.json output-directory');
  const data = JSON.parse(await readFile(resolve(input),'utf8'));
  const qa = validate(data);
  if (qa.errors.length) throw new Error(qa.errors.join('\n'));
  await mkdir(resolve(output),{recursive:true});
  await writeFile(join(output,'index.html'),render(data,qa));
  await writeFile(join(output,'qa.json'),JSON.stringify({status:qa.warnings.length?'PASS_WITH_WARNINGS':'PASS',...qa},null,2));
  console.log(resolve(output,'index.html'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error=>{console.error(error.message);process.exitCode=1;});
