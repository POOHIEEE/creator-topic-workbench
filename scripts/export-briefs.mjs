import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validate } from './workbench.mjs';

export function buildBriefs(data) {
  const qa=validate(data);
  if(qa.errors.length) throw Error(qa.errors.join('\n'));
  return data.topics.map((topic,index)=>{
    const work=data.works.find(w=>w.id===topic.workId);
    const author=data.authors.find(a=>a.id===work.authorId);
    const lines=[`# ${topic.title}`,'',`状态：${data.demo?'虚构教学样例':'编辑草案'}，未证明实际制作效果`, `分类：${topic.category}`,
      '',`参考作者：${author.name}`,`原作：${work.title}`,work.url,`证据深度：${work.basis}`,`发布时间：${work.publishedAt??'未知'}`,`采样时间：${work.observedAt??'未知'}`,
      '','## 观众的问题',topic.audienceProblem,'','## 借鉴什么',topic.borrow,'','## 我自己的案例',topic.ownCase,
      '','## 录屏与画面准备',...topic.validation.map((s,i)=>`${i+1}. ${s}`),
      '','## 发布前检查','- 用自己的素材实际验证，不把草案写成亲测。','- 每句结果都要有对应原始画面。','- 核对原作、日期和权限；未授权不转载媒体。',''];
    return {file:`topic-${String(index+1).padStart(2,'0')}.md`,category:topic.category,title:topic.title,content:lines.join('\n')};
  });
}

async function main(){
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw Error('Usage: node scripts/export-briefs.mjs input.json output-directory');
  const data=JSON.parse(await readFile(resolve(input),'utf8'));
  const briefs=buildBriefs(data);
  await mkdir(resolve(output),{recursive:true});
  for(const brief of briefs)await writeFile(join(output,brief.file),brief.content);
  await writeFile(join(output,'index.md'),['# 选题制作卡',...['AIGC','通用'].flatMap(category=>['',`## ${category}`,...briefs.filter(b=>b.category===category).map(b=>`- [${b.title.replace(/[\[\]\n\r]/g,' ')}](${b.file})`)]),''].join('\n'));
  console.log(`Exported ${briefs.length} topic brief(s) to ${resolve(output)}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
