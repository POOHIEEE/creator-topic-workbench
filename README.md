# Creator Topic Workbench · 竞品选题工作台

**别只收藏同行的内容，把它变成自己下一条能拍的选题。**

一个作者优先、证据可追溯的 Agent Skill，附零依赖离线看板生成器。适合内容创作者、AI博主和做实践分享的产品经理。

## 它帮你做什么

作者是谁 → 最近做了什么 → 数据是否可比 → 借鉴哪一部分 → 换成自己的案例 → 形成脚本与镜头计划。

不是让你对着一堆链接自己写。Skill指导Agent解释转化理由，生成面向观众、简短口语化的标题，并写清需要验证的部分。

| 能力 | 当前边界 |
| --- | --- |
| 作者维度的原作和选题总览 | 支持导入结构化证据；不是全网实时搜索引擎 |
| AIGC / 通用选题分开 | 不把所有题目混进一个榜单 |
| 原作、时间、指标可追溯 | 缺失指标显示未知，不编造播放或收藏 |
| 转成自己的标题、案例和制作步骤 | 由Agent结合上下文整理，不是本地脚本自动调用大模型 |
| 可运行离线看板 | 生成HTML和QA；没有内置爬虫、定时器、账号托管或发布功能 |

## 最快试一次

需要 Node.js 20+。不需要安装依赖或配置API Key。

```bash
node scripts/workbench.mjs examples/evidence.json out
node --test
```

打开 `out/index.html`。示例全部标注为虚构教学数据，不能用来论证任何作者表现。

接真实资料时，把作者、原作、日期、已观察到的指标填入同样的JSON，再让Agent按 `SKILL.md` 填写选题的转化理由和验证步骤。数据字段见 [证据契约](references/evidence-contract.md)。

## 作为Skill使用

将本目录放入支持Agent Skills的工具的技能目录，确保 `SKILL.md` 可发现。例如Codex使用 `~/.codex/skills/creator-topic-workbench/`。安装不意味着已获得任何平台的登录态或采集权限。

可以这样问：

> 根据这些作者原作，找出适合我做的内容。先给作者和证据，再给我的标题、借鉴点、自己的案例、待验证项。AIGC和通用分开，不只改写原标题。

## 一条选题应包含什么

| 字段 | 要回答的问题 |
| --- | --- |
| 参考原作 | 借鉴的是谁、哪一篇？ |
| 观众问题 | 他为什么要看？ |
| 借鉴点 | 学的是表达、工作流还是结果？ |
| 自己的案例 | 不是搬运，我拿什么来证明？ |
| 验证步骤 | 拍之前还缺什么？ |

## 设计参考

参考 [social-media-research-skills](https://github.com/ScrapeCreators/social-media-research-skills) 的来源引用与作者内基线意识，以及 [huashu-report](https://github.com/alchaincyf/huashu-report) 的成果交付思路。本项目代码与说明独立编写，未复制第三方Skill正文或媒体资产。外部采集服务可能收费，本地看板生成器不依赖它们。

## 不承诺什么

- 不保证爆款、涨粉或内容效果。
- 不绕过登录、验证码、平台限制，不抓私密内容。
- 不把累计播放直接当质量，不把作者宣称写成亲测。
- 没有内置实时数据或自动运营；定期监控需要单独配置数据入口与调度器。
- 仓库不包含任何个人工作版的私有地址、账号历史、凭据或转载视频。

## 文件结构

```text
SKILL.md                       Agent工作方法
scripts/workbench.mjs           校验与HTML生成器
references/evidence-contract.md 数据约定
examples/evidence.json         虚构教学样例
test/workbench.test.mjs         回归测试
```
