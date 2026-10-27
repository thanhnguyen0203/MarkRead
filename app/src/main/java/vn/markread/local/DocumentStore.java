package vn.markread.local;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Only IDs minted from explicit system-picker results can be read. No arbitrary URI API. */
public final class DocumentStore {
    public static final class Entry {
        public final String id, name, path; public final Uri uri; public final long size, maxBytes; public final boolean document;
        Entry(String name,String path,Uri uri,long size){this(UUID.randomUUID().toString(),name,path,uri,size);}
        Entry(String id,String name,String path,Uri uri,long size){this(id,name,path,uri,size,Policy.maxBytes(name),name.toLowerCase(java.util.Locale.ROOT).matches(".*\\.(md|markdown|txt)$"));}
        Entry(String id,String name,String path,Uri uri,long size,long maxBytes,boolean document){this.id=id;this.name=name;this.path=path;this.uri=uri;this.size=size;this.maxBytes=maxBytes;this.document=document;}
        JSONObject json() throws Exception {return new JSONObject().put("id",id).put("name",name).put("path",path).put("size",Math.max(0,size)).put("document",document);}
    }
    public static final class Snapshot {
        public final String generation=UUID.randomUUID().toString();
        public final Map<String,Entry> entries=new LinkedHashMap<>(); public String label="Các tệp đã chọn"; public boolean folder=false,limited=false; public Uri tree;
        public JSONObject json() throws Exception {return new JSONObject().put("count",entries.size()).put("generation",generation).put("label",label).put("folder",folder).put("limited",limited);}
    }
    public static final class Chunk {public final byte[] bytes;public final boolean eof;Chunk(byte[] b,boolean e){bytes=b;eof=e;}}
    private final ContentResolver resolver; private Snapshot active=new Snapshot();
    public DocumentStore(ContentResolver resolver){this.resolver=resolver;}
    public synchronized void commit(Snapshot snapshot){active=snapshot;}
    public synchronized void clear(){active=new Snapshot();}
    public synchronized List<Entry> cssEntries(){List<Entry> result=new ArrayList<>();for(Entry e:active.entries.values())if(e.name.toLowerCase(java.util.Locale.ROOT).endsWith(".css"))result.add(e);return result;}
    public synchronized Entry find(String id) throws IOException {Entry e=active.entries.get(id);if(e==null)throw new IOException("Tệp chưa được cấp quyền hoặc bộ tệp đã thay đổi.");return e;}
    public synchronized JSONObject current() throws Exception{return active.json();}
    public synchronized JSONObject page(String generation,int offset,int limit) throws Exception {
        if(!active.generation.equals(generation)||offset<0||limit<1||limit>32)throw new IOException("Bộ tệp đã thay đổi. Hãy mở lại thư mục.");
        JSONArray a=new JSONArray();int index=0;for(Entry e:active.entries.values()){if(index>=offset&&index<offset+limit)a.put(e.json());index++;}
        return new JSONObject().put("entries",a);
    }
    private static final class Dir {final Uri uri;final String path;final int depth;Dir(Uri u,String p,int d){uri=u;path=p;depth=d;}}
    public Snapshot scanTree(Uri tree) throws Exception {
        if(!Policy.treeProvider(tree.toString()) || !DocumentsContract.isTreeUri(tree))throw new IOException("Hãy chọn một thư mục trong Bộ nhớ trong hoặc thẻ nhớ của thiết bị.");
        String rootId=DocumentsContract.getTreeDocumentId(tree);
        Uri root=DocumentsContract.buildDocumentUriUsingTree(tree,rootId);
        Snapshot next=new Snapshot();next.folder=true;next.tree=tree;
        try(Cursor c=resolver.query(root,new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME},null,null,null)) {if(c!=null&&c.moveToFirst()&&Policy.safeName(c.getString(0)))next.label=c.getString(0);}
        ArrayDeque<Dir> queue=new ArrayDeque<>();Set<String> visited=new HashSet<>(),paths=new HashSet<>();queue.add(new Dir(root,"",0));int seen=0;
        String[] cols={DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME,DocumentsContract.Document.COLUMN_MIME_TYPE,DocumentsContract.Document.COLUMN_SIZE};
        while(!queue.isEmpty()) {
            if(Thread.currentThread().isInterrupted())throw new IOException("Đã hủy đọc thư mục.");
            Dir dir=queue.removeFirst();String docId=DocumentsContract.getDocumentId(dir.uri);if(!visited.add(docId))continue;
            Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(tree,docId);
            try(Cursor c=resolver.query(children,cols,null,null,null)) {
                if(c==null)throw new IOException("Không đọc được thư mục. Hãy chọn lại quyền.");
                while(c.moveToNext()) {
                    if(++seen>Policy.MAX_FILES){next.limited=true;return next;}
                    String id=c.getString(0),name=c.getString(1),mime=c.getString(2);if(!Policy.safeName(name))continue;
                    String path=dir.path.isEmpty()?name:dir.path+"/"+name;if(path.length()>2048){next.limited=true;continue;}
                    Uri uri=DocumentsContract.buildDocumentUriUsingTree(tree,id);
                    if(DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)){if(dir.depth<32)queue.add(new Dir(uri,path,dir.depth+1));else next.limited=true;}
                    else if(Policy.maxBytes(name)>0 && paths.add(path)){long size=c.isNull(3)?-1:c.getLong(3);Entry e=new Entry(name,path,uri,size);next.entries.put(e.id,e);}
                }
            }
        }
        return next;
    }
    public Snapshot scanFiles(List<Uri> uris) throws Exception {
        if(uris.size()>Policy.MAX_FILES)throw new IOException("Chọn tối đa 5.000 tệp.");Snapshot next=new Snapshot();Set<String> names=new HashSet<>();
        for(Uri uri:uris){
            if(!Policy.localDocument(uri.toString()))throw new IOException("Chỉ nhận tệp từ bộ nhớ cục bộ của thiết bị. Hãy chọn Bộ nhớ trong hoặc thẻ nhớ.");
            try(Cursor c=resolver.query(uri,new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE},null,null,null)) {
                if(c==null||!c.moveToFirst())continue;String name=c.getString(0);if(Policy.maxBytes(name)<0)continue;
                if(!names.add(name))throw new IOException("Có tệp trùng tên. Dùng Mở thư mục để giữ đường dẫn đầy đủ.");
                Entry e=new Entry(name,name,uri,c.isNull(1)?-1:c.getLong(1));next.entries.put(e.id,e);
            }
        }
        return next;
    }
    public Chunk read(String id,long offset,int length) throws Exception {
        Entry e=find(id);long max=e.maxBytes;Policy.checkRead(offset,length,max);
        if(e.size>max)throw new IOException("Tệp vượt giới hạn dung lượng cho phép.");
        try(InputStream in=resolver.openInputStream(e.uri)) {
            if(in==null)throw new IOException("Không mở được tệp. Hãy chọn lại quyền.");
            long remaining=offset;
            while(remaining>0){long s=in.skip(remaining);if(s>0)remaining-=s;else if(in.read()<0)return new Chunk(new byte[0],true);else remaining--;}
            int allowed=(int)Math.min(length,max-offset);
            if(allowed==0){if(in.read()!=-1)throw new IOException("Tệp vượt giới hạn dung lượng.");return new Chunk(new byte[0],true);}
            ByteArrayOutputStream out=new ByteArrayOutputStream(allowed);byte[] b=new byte[Math.min(8192,allowed)];boolean eof=false;
            while(out.size()<allowed){int n=in.read(b,0,Math.min(b.length,allowed-out.size()));if(n<0){eof=true;break;}if(n>0)out.write(b,0,n);}
            return new Chunk(out.toByteArray(),eof);
        }
    }
    public synchronized JSONObject rename(String id,String requested) throws Exception {
        Entry entry=find(id);String name=Policy.renameName(requested);
        if(!entry.document)throw new IOException("Chỉ đổi tên tài liệu văn bản đã chọn.");
        if(entry.name.equals(name))return entry.json();
        String parent=entry.path.substring(0,entry.path.length()-entry.name.length());
        String nextPath=parent+name;
        for(Entry other:active.entries.values())if(!other.id.equals(id)&&other.path.equalsIgnoreCase(nextPath))throw new IOException("Đã có tệp cùng tên trong thư mục.");
        // Check every sibling, including folders and unsupported file types.
        if(active.tree!=null){
            String rootId=DocumentsContract.getTreeDocumentId(active.tree);
            String parentId=rootId+(parent.isEmpty()?"":"/"+parent.substring(0,parent.length()-1));
            Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(active.tree,parentId);
            try(Cursor c=resolver.query(children,new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME,DocumentsContract.Document.COLUMN_DOCUMENT_ID},null,null,null)){
                if(c==null)throw new IOException("Không kiểm tra được tên tệp trong thư mục.");
                String oldId=DocumentsContract.getDocumentId(entry.uri);
                while(c.moveToNext())if(name.equalsIgnoreCase(c.getString(0))&&!oldId.equals(c.getString(1)))throw new IOException("Đã có tệp hoặc thư mục cùng tên.");
            }
        }
        try(Cursor c=resolver.query(entry.uri,new String[]{DocumentsContract.Document.COLUMN_FLAGS},null,null,null)){
            if(c==null||!c.moveToFirst()||(c.getInt(0)&DocumentsContract.Document.FLAG_SUPPORTS_RENAME)==0)throw new IOException("Vị trí này không hỗ trợ đổi tên. Hãy mở thư mục chứa tệp bằng nút Mở.");
        }
        Uri renamed;
        try{renamed=DocumentsContract.renameDocument(resolver,entry.uri,name);}
        catch(SecurityException e){throw new IOException("Đổi tên cần quyền ghi. Chọn lại thư mục hoặc tệp bằng nút Mở rồi thử lại.");}
        if(renamed==null)throw new IOException("Không đổi được tên tệp. Hãy chọn lại thư mục bằng nút Mở rồi thử lại.");
        // A rename may replace the provider's document ID. Preserve the opaque app ID.
        String actualName=name;long size=entry.size;
        try(Cursor c=resolver.query(renamed,new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE},null,null,null)){
            if(c!=null&&c.moveToFirst()){String returned=c.getString(0);if(Policy.safeName(returned))actualName=returned;if(!c.isNull(1))size=c.getLong(1);}
        }catch(Exception ignored){/* The rename already succeeded; retain the returned URI. */}
        Entry replacement=new Entry(id,actualName,parent+actualName,renamed,size,entry.maxBytes,true);active.entries.put(id,replacement);
        return replacement.json();
    }
    public JSONObject importCss(Uri uri) throws Exception {
        if(uri==null||!Policy.localDocument(uri.toString()))throw new IOException("Hãy chọn tệp CSS trong bộ nhớ cục bộ của thiết bị.");
        String name;
        try(Cursor c=resolver.query(uri,new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE},null,null,null)){
            if(c==null||!c.moveToFirst())throw new IOException("Không đọc được thông tin tệp CSS.");
            name=c.getString(0);
            if(!Policy.safeName(name)||!name.toLowerCase(java.util.Locale.ROOT).endsWith(".css"))throw new IOException("Hãy chọn tệp có phần mở rộng .css.");
            if(!c.isNull(1)&&c.getLong(1)>100000)throw new IOException("CSS vượt 100.000 byte.");
        }
        ByteArrayOutputStream out=new ByteArrayOutputStream();
        try(InputStream in=resolver.openInputStream(uri)){
            if(in==null)throw new IOException("Không mở được tệp CSS.");
            byte[] buffer=new byte[8192];int n;
            while((n=in.read(buffer))!=-1){if(out.size()+n>100000)throw new IOException("CSS vượt 100.000 byte.");out.write(buffer,0,n);}
        }
        byte[] bytes=out.toByteArray();java.nio.charset.Charset charset=StandardCharsets.UTF_8;int skip=0;
        if(bytes.length>=2&&(bytes[0]&255)==255&&(bytes[1]&255)==254){charset=StandardCharsets.UTF_16LE;skip=2;}
        else if(bytes.length>=2&&(bytes[0]&255)==254&&(bytes[1]&255)==255){charset=StandardCharsets.UTF_16BE;skip=2;}
        else if(bytes.length>=3&&(bytes[0]&255)==239&&(bytes[1]&255)==187&&(bytes[2]&255)==191)skip=3;
        String css;
        try{css=charset.newDecoder().onMalformedInput(java.nio.charset.CodingErrorAction.REPORT).decode(java.nio.ByteBuffer.wrap(bytes,skip,bytes.length-skip)).toString();}
        catch(java.nio.charset.CharacterCodingException e){throw new IOException("Tệp CSS cần mã hóa UTF-8 hoặc UTF-16 có BOM.");}
        return new JSONObject().put("css",css).put("name",name);
    }
}
