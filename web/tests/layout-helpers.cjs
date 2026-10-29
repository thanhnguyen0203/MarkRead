// Exercise the visible responsive Settings UI, never force-click its hidden desktop navigation.
async function chooseSettingsSection(page,section){
 const category=page.locator('#settingsCategory');
 if(await category.count()&&await category.isVisible())await category.selectOption(section);
 else {
  const item=page.locator('[data-section="'+section+'"]');
  if(!await item.isVisible()&&await page.locator('#settingsBack').isVisible())await page.locator('#settingsBack').click();
  await item.click();
 }
}
const source='# Một không gian đọc\n\nĐọc tiếng Việt có dấu, kiểm tra **đậm**, *nghiêng*, cùng một liên kết [rất dài](https://example.invalid/'+ 'long'.repeat(35)+').\n\n## Văn bản và khoảng thở\n\n'+('Một đoạn văn vừa đủ dài để đánh giá độ rộng dòng trên điện thoại và tablet. '.repeat(8))+'\n\n> Trích dẫn giữ cấp bậc rõ ràng, có một từ '+ 'tríchdẫn'.repeat(25)+'.\n\n- Mục thứ nhất\n- Mục thứ hai\n  - Nhánh con\n\n```javascript\nconst value = "'+ 'dài'.repeat(100)+'";\n```\n\n| '+Array.from({length:12},(_,i)=>'Cột '+i).join(' | ')+' |\n| '+Array(12).fill('---').join(' | ')+' |\n| '+Array.from({length:12},(_,i)=>'Nội_dung_'+i+'_'.repeat(8)).join(' | ')+' |\n\n$$\n'+Array(25).fill('a_i^2 + b_i^2').join(' + ')+'\n$$\n\n## Cuối bài\n\nKhông đổi source Markdown khi thay bố cục.\n';
module.exports={chooseSettingsSection,source};
