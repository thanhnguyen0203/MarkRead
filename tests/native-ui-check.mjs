// Reproducible JVM policy checks; no Android SDK, downloads or third-party test dependencies.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {themes} from '../web/src/themes.js';
import {resolvedThemes} from '../web/src/tokens.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,process.argv[2]||'build/ui-p2d');
const classes=path.join(output,'policy-classes'),ext=process.platform==='win32'?'.exe':'';
const bundled=path.join(root,'toolchain/jdk');
const home=process.env.JAVA_HOME||(fs.existsSync(bundled)?fs.readdirSync(bundled).map(x=>path.join(bundled,x)).find(x=>fs.existsSync(path.join(x,'bin','javac'+ext))):null);
const tool=name=>home?path.join(home,'bin',name+ext):name;
const fixture=path.join(output,'theme-fixture.tsv'),probe=path.join(output,'ready-script.js');
fs.mkdirSync(classes,{recursive:true});
fs.writeFileSync(fixture,Object.entries(resolvedThemes).map(([id,{tokens:t}])=>[id,themes[id].light,t['mr-bg'],t['mr-surface'],t['mr-text-primary'],t['mr-accent-text']].join('\t')).join('\n'));
function run(name,args){
 const result=spawnSync(tool(name),args,{cwd:root,encoding:'utf8'});
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
}
run('javac',['-encoding','UTF-8','-d',classes,path.join(root,'app/src/main/java/vn/markread/local/NativeUiPolicy.java'),path.join(root,'tests/NativeUiPolicyTest.java')]);
run('java',['-cp',classes,'vn.markread.local.NativeUiPolicyTest',fixture,probe]);
console.log('Java readiness expression exported to '+probe);
