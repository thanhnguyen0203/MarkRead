// Only the reviewed, build-validated local registry may be passed here, never Markdown or user SVG.
export function iconMarkup(registry,name){
  if(!/^[a-z][a-z0-9-]*$/.test(name)||!Object.prototype.hasOwnProperty.call(registry,name))throw new Error('Unknown MarkRead icon: '+name);
  return registry[name].trim().replace(/\s+/g,' ').replace('<svg ',`<svg class="mr-icon" data-icon="${name}" aria-hidden="true" focusable="false" `);
}
