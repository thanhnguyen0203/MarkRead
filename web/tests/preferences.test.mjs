import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,appearanceSettings} from '../src/preferences.js';

test('appearance restores automatically without the former opt-in flag',()=>{
  const saved={theme:'nord',font:'merriweather',size:24,width:1080,leading:2.1,css:'h1{color:red}',mermaid:false,unified:true,descending:true};
  assert.deepEqual(appearanceSettings(saved),saved);
  assert.deepEqual(appearanceSettings({...saved,remember:false}),saved);
  assert.deepEqual(appearanceSettings({...saved,remember:true}),saved);
});
test('invalid appearance data falls back safely and clamps numeric values',()=>{
  for(const saved of [null,false,[],17])assert.deepEqual(appearanceSettings(saved),DEFAULTS);
  const settings=appearanceSettings({theme:'__proto__',font:'missing',size:999,width:-1,leading:NaN,css:'@import "https://example.com/a.css";',unified:'yes'});
  assert.deepEqual(settings,{...DEFAULTS,size:32,width:480});
});
test('invalid CSS does not discard the other saved choices',()=>{
  assert.equal(appearanceSettings({theme:'sepia',css:'body{background:url(https://example.com)}'}).theme,'sepia');
  assert.equal(appearanceSettings({css:'body{background:url(https://example.com)}'}).css,'');
});
