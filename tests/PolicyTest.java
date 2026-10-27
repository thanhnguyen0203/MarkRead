package vn.markread.local;
public final class PolicyTest {
 static int count=0;
 static void check(boolean condition,String name){count++;if(!condition)throw new AssertionError(name);}
 public static void main(String[] args){
  check(Policy.trustedPage(Policy.ENTRY_URL),"entry");
  for(String s:new String[]{"https://evil.test/app/index.html",Policy.ENTRY_URL+"?x",Policy.ENTRY_URL+"#x","http://appassets.androidplatform.net/app/index.html","https://appassets.androidplatform.net.evil.test/app/index.html","file:///android_asset/index.html","about:blank"})check(!Policy.trustedPage(s),"deny page "+s);
  for(String s:new String[]{"content://com.android.externalstorage.documents/document/primary%3Afoo.md","content://com.android.providers.downloads.documents/document/17","content://com.android.providers.media.documents/document/1","content://media/external/downloads/1","content://downloads/my_downloads/1"})check(Policy.localDocument(s),"local "+s);
  for(String s:new String[]{"file:///etc/passwd","https://media/a","content://evil.test/a","content://com.google.android.apps.docs.storage/a","content://user@media/a","content://media:80/a","content://media.evil/a","javascript:alert(1)","not a uri"})check(!Policy.localDocument(s),"deny URI "+s);
  check(Policy.treeProvider("content://com.android.externalstorage.documents/tree/primary%3ADownload"),"local tree");
  check(!Policy.treeProvider("content://media/tree/1"),"non external tree");
  for(String s:new String[]{"a.md","x.markdown","hình.png","style.css","Ảnh 1.jpeg","a.webp","a.gif","a.avif","a.bmp"})check(Policy.maxBytes(s)>0,"supported "+s);
  for(String s:new String[]{"a.svg","a.html","a.js","a.exe","../a.md","a/b.md","..",".","","a\\b.md","a\n.md"})check(Policy.maxBytes(s)<0,"unsupported "+s);
  check(Policy.maxBytes("A.MD")==5L*1024*1024,"md cap");check(Policy.maxBytes("a.png")==10L*1024*1024,"image cap");check(Policy.maxBytes("a.css")==100000,"css cap");
  check(Policy.exportName("../../secret").equals(".._.._secret"),"export traversal neutralized");check(Policy.exportName("bài.md").equals("bài.md"),"export unicode");
  for(long offset:new long[]{-1,Policy.MAX_DOC+1}){boolean rejected=false;try{Policy.checkRead(offset,1,Policy.MAX_DOC);}catch(IllegalArgumentException e){rejected=true;}check(rejected,"offset bound");}
  for(int length:new int[]{-1,0,65537,Integer.MAX_VALUE}){boolean rejected=false;try{Policy.checkRead(0,length,Policy.MAX_DOC);}catch(IllegalArgumentException e){rejected=true;}check(rejected,"chunk bound");}
  Policy.checkRead(0,65536,Policy.MAX_DOC);check(true,"valid chunk");
  for(String name:new String[]{"a.txt","a.css","a.foo","a"})check(Policy.renameName(name).equals(name),"rename extension "+name);
  check(Policy.renameName("Tên mới.md").equals("Tên mới.md"),"rename unicode");
  for(String name:new String[]{"../escape.md","a/b.md","a\\b.md"," a.md","a.md ","a.","a?.md","a\n.md"}){boolean rejected=false;try{Policy.renameName(name);}catch(IllegalArgumentException e){rejected=true;}check(rejected,"rename rejects "+name);}
  System.out.println("Policy tests: "+count+" passed");
 }
}
