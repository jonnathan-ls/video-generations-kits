export const $=id=>document.getElementById(id);
export function el(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
export function notify(message){$('notice').textContent=message;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('notice').textContent='',5000);}
export async function json(url,options){const response=await fetch(url,options);const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível carregar os dados.');return data;}
