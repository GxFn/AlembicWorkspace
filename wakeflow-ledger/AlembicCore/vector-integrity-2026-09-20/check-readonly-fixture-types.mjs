// 从 Plugin 根目录执行，显式纳入默认 tsconfig 排除的已修改测试文件，不输出编译产物。
import {createRequire} from 'node:module';
import path from 'node:path';
const root=process.cwd();
const ts=createRequire(path.join(root,'package.json'))('typescript');
const config=ts.readConfigFile('tsconfig.json',ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
const name=path.join(root,'test/unit/ReadOnlySearchFingerprint.test.ts');
const program=ts.createProgram([name],{...parsed.options,noEmit:true,types:['node','vitest/globals']});
const file=program.getSourceFile(name);
const errors=program.getSemanticDiagnostics(file).map(d=>({code:d.code,line:file.getLineAndCharacterOfPosition(d.start).line+1,message:ts.flattenDiagnosticMessageText(d.messageText,' ').replaceAll(root,'AlembicPlugin')}));
console.log(JSON.stringify({file:'test/unit/ReadOnlySearchFingerprint.test.ts',diagnostics:errors},null,2));
if(errors.length)process.exitCode=1;
