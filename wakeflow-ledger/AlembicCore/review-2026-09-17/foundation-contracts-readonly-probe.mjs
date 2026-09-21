import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
async function loadSource(file){return import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(fs.readFileSync(file,'utf8'),{mode:'transform'})).toString('base64'));}
const {readFileAtCommit}=await loadSource('src/shared/gitBlob.ts');
const {applyOutputBudget,CORE_TOOL_OUTPUT_BUDGETS}=await loadSource('src/shared/OutputBudget.ts');
const optionResult=readFileAtCommit(process.cwd(),'--format=READONLY_OPTION_PROBE','README.md',{maxBytes:32*1024*1024});
const limit=CORE_TOOL_OUTPUT_BUDGETS.alembic_prime.budgetBytes;
const prefix='a'.repeat(limit-3)+'中';
const bounded=applyOutputBudget('alembic_prime',prefix+'tail');
console.log(JSON.stringify({gitBlob:{invalidCommit:'--format=READONLY_OPTION_PROBE',returnedNonNull:optionResult!==null,gitOptionWasHonored:optionResult?.startsWith('READONLY_OPTION_PROBE:README.md')??false},outputBudget:{limit,prefixBytes:Buffer.byteLength(prefix),returnedBytes:Buffer.byteLength(bounded.content),droppedCompleteFinalCodePoint:!bounded.content.endsWith('中'),truncated:bounded.truncated}},null,2));
