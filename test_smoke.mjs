// dingli-tai 冒烟测试：抽取内联脚本做语法检查 + 关键函数符号存在性（回归守卫）
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const __dir = dirname(fileURLToPath(import.meta.url));
const NODE = process.execPath;
const html = readFileSync(join(__dir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

let ok = true;
scripts.forEach((s, i) => {
  const f = join(mkdtempSync(join(tmpdir(), 'smk-')), 's' + i + '.mjs');
  writeFileSync(f, s);
  try { execFileSync(NODE, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { ok = false; console.log('[syntax] FAIL script#' + i + ': ' + (e.stderr || '').toString().split('\n')[0]); }
});
console.log('[syntax] 检查内联脚本 ' + scripts.length + ' 段');

const all = scripts.join('\n');
const expect = ['esc', 'load', 'save', 'addTask', 'renderTasks', 'setMode', 'startPomo', 'enterLock', 'remainingQuota'];
for (const s of expect) {
  const re = new RegExp('(function\\s+' + s + '\\b|const\\s+' + s + '\\s*=)');
  const has = re.test(all);
  console.log((has ? '[sym] OK   ' : '[sym] MISS ') + s);
  if (!has) ok = false;
}
console.log(ok ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(ok ? 0 : 1);
