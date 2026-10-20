# Evidence contract v1

Input is JSON with `generatedAt` (ISO timestamp), `demo` (boolean), `authors`, `works`, `topics` arrays. IDs must be unique within each collection.

- Author: `id`, `name`, `platform`, `url` (public profile URL).
- Work: `id`, `authorId`, `title`, `url`, `publishedAt`, `observedAt`, `basis` (`metadata`, `transcript` or `full-work`), `metrics` with nullable `views`, `likes`, `favorites`.
- Topic: `id`, `workId`, `category` (`AIGC` or `通用`), `title`, `audienceProblem`, `borrow`, `ownCase`, `validation` (nonempty array of steps).

Missing metrics are null, not zero. Real zero remains zero. Dates must be ISO timestamps with timezone; missing dates are null and produce a QA warning. Publication cannot follow observation. Source URLs must use HTTP(S) and contain no username or password. IDs reference existing authors/works. Unknown timestamps do not become the current time.

QA warns on evidence more than seven days older than `generatedAt`. This is only a freshness flag, not a claim that older content is unusable or that new collection ran. Sample size, platform and exposure age must be examined by the agent before performance comparison. The script does not rank or infer causal performance differences.

Demo URLs use example.com, with `demo: true`. For real research use `demo: false` and inspected original-work links; the program validates structure, not whether the remote page actually exists or whether an author identity is correct.
