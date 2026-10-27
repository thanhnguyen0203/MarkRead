import test from 'node:test';
import assert from 'node:assert/strict';
import {searchDocument as search} from '../src/search.js';
const scan=(text,query,rest={})=>search({text,query,...rest});
test('literal search escapes every regular-expression metacharacter',()=>{const text='.*+?^${}()|[]\\';assert.equal(scan(text,text).matches.length,1);assert.equal(scan('a.b axb','a.b').matches.length,1);});
test('Vietnamese case folding and sensitive option',()=>{assert.equal(scan('Xác suất XÁC SUẤT xác suất','xác suất').matches.length,3);assert.equal(scan('Xác suất XÁC SUẤT xác suất','xác suất',{caseSensitive:true}).matches.length,1);});
test('offsets remain UTF-16 code-unit offsets with emoji',()=>assert.deepEqual(scan('📝đỏ 📝ĐỎ','đỏ').matches,[{start:2,end:4},{start:7,end:9}]));
test('empty query has no matches and never inserts text',()=>assert.deepEqual(scan('abc','',{action:'replaceAll',replacement:'x'}),{matches:[],limited:false}));
test('invalid regex has a readable error',()=>assert.throws(()=>scan('a','[',{regex:true}),/regex không hợp lệ/));
test('multiline anchors operate per line',()=>assert.deepEqual(scan('a\nb\n','^',{regex:true}).matches.map(m=>m.start),[0,2,4]));
test('zero-width matches advance over Unicode code points',()=>assert.deepEqual(scan('📝a','(?=.)',{regex:true}).matches.map(m=>m.start),[0,2]));
test('replace one targets selected occurrence and preserves surrounding bytes',()=>{const r=scan('a a a','a',{action:'replace',index:1,replacement:'Việt'});assert.equal(r.text,'a Việt a');assert.equal(r.count,1);assert.equal(r.nextOffset,6);});
test('plain replacement treats dollar signs literally',()=>assert.equal(scan('a a','a',{action:'replaceAll',replacement:'$1$&$$'}).text,'$1$&$$ $1$&$$'));
test('deleting all matches uses empty replacement',()=>assert.equal(scan('a b a','a',{action:'replaceAll',replacement:''}).text,' b '));
test('replacement matches built-in JavaScript capture expansion',()=>{
 const text='a-12 b-34';
 for(const replacement of ['$2/$1','$&','$$',"$`", "$'",'$0','$01','$12','$99','$<letter>','$<missing>','<script>$1</script>']){
  const regex='(?<letter>[a-z])-(\\d+)';
  assert.equal(scan(text,regex,{regex:true,action:'replaceAll',replacement}).text,text.replace(new RegExp(regex,'gimu'),replacement),replacement);
 }
});
test('nonparticipating capture becomes empty',()=>assert.equal(scan('b','(a)?b',{regex:true,action:'replaceAll',replacement:'[$1]'}).text,'[]'));
test('zero-width replacement is finite and does not split emoji',()=>assert.equal(scan('📝a','(?=.)',{regex:true,action:'replaceAll',replacement:'_'}).text,'_📝_a'));
test('replacement text is never searched again in the same replace-all',()=>assert.equal(scan('a a','a',{action:'replaceAll',replacement:'aa'}).text,'aa aa'));
test('output UTF-8 limit is enforced before building oversized result',()=>assert.throws(()=>scan('a a','a',{action:'replaceAll',replacement:'ế',maxBytes:6}),/vượt giới hạn/));
test('too many matches cannot cause a partial replace-all',()=>{const text='a'.repeat(20001);assert.equal(scan(text,'a').limited,true);assert.throws(()=>scan(text,'a',{action:'replaceAll',replacement:'b'}),/20.000/);});
test('no-match replacement keeps exact input',()=>{const r=scan('# Việt\n','absent',{action:'replaceAll',replacement:'x'});assert.equal(r.text,'# Việt\n');assert.equal(r.count,0);});
test('query length is bounded',()=>assert.throws(()=>scan('a','a'.repeat(2001)),/2.000/));

test('regex replacement expansion respects budget before joining large strings',()=>assert.throws(()=>search({text:'a'.repeat(1000),query:'a',regex:true,replacement:"$'".repeat(10000),action:'replace',maxBytes:5000}),/vượt giới hạn/));
