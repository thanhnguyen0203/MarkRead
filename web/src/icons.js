/*! Lucide0.468.0 ISC; Feather MIT. Copyright/permission notices: web/icons/LICENSE-* and packaged THIRD_PARTY_NOTICES.txt. */
import icon0 from '../icons/lucide/menu.svg';
import icon1 from '../icons/lucide/folder-open.svg';
import icon2 from '../icons/lucide/file-text.svg';
import icon3 from '../icons/lucide/chevron-left.svg';
import icon4 from '../icons/lucide/chevron-right.svg';
import icon5 from '../icons/lucide/search.svg';
import icon6 from '../icons/lucide/download.svg';
import icon7 from '../icons/lucide/settings.svg';
import icon8 from '../icons/lucide/ellipsis-vertical.svg';
import icon9 from '../icons/lucide/arrow-up-down.svg';
import icon10 from '../icons/lucide/x.svg';
import icon11 from '../icons/lucide/check.svg';
import icon12 from '../icons/lucide/chevron-down.svg';
import icon13 from '../icons/lucide/arrow-up.svg';
import icon14 from '../icons/lucide/arrow-down.svg';
import icon15 from '../icons/lucide/book-open.svg';
import icon16 from '../icons/lucide/code-xml.svg';
import icon17 from '../icons/lucide/columns-2.svg';
import icon18 from '../icons/lucide/pencil.svg';
import icon19 from '../icons/lucide/copy.svg';
import icon20 from '../icons/lucide/info.svg';
import icon21 from '../icons/lucide/triangle-alert.svg';
import icon22 from '../icons/lucide/loader-circle.svg';
import {iconMarkup} from './icon-markup.js';

const registry=Object.freeze({'menu':icon0,'folder-open':icon1,'file-text':icon2,'chevron-left':icon3,'chevron-right':icon4,'search':icon5,'download':icon6,'settings':icon7,'ellipsis-vertical':icon8,'arrow-up-down':icon9,'x':icon10,'check':icon11,'chevron-down':icon12,'arrow-up':icon13,'arrow-down':icon14,'book-open':icon15,'code-xml':icon16,'columns-2':icon17,'pencil':icon18,'copy':icon19,'info':icon20,'triangle-alert':icon21,'loader-circle':icon22});
export const icon=name=>iconMarkup(registry,name);
export function createIcon(name,doc=document){const template=doc.createElement('template');template.innerHTML=icon(name);return template.content.firstElementChild;}
// Keep the control and its event bindings/focus; only replace a changed decorative glyph/label.
export function setIconLabel(button,name,text){
 const glyph=button.querySelector('.mr-icon'),label=button.querySelector('.icon-label');
 if(!glyph||!label){const span=button.ownerDocument.createElement('span');span.className='icon-label';span.textContent=text;button.replaceChildren(createIcon(name,button.ownerDocument),span);return;}
 if(glyph.dataset.icon!==name)glyph.replaceWith(createIcon(name,button.ownerDocument));
 if(label.textContent!==text)label.textContent=text;
}
