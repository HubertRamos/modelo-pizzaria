(() => {
  const KEY="ruota-cart", drawer=document.querySelector("#cart-drawer"), backdrop=document.querySelector("#cart-backdrop"), openButton=document.querySelector("#open-cart"), closeButton=document.querySelector("#close-cart"), list=document.querySelector("#cart-items"), empty=document.querySelector("#cart-empty"), count=document.querySelector("#cart-count"), note=document.querySelector("#cart-note"), checkout=document.querySelector("#cart-checkout");
  if(!drawer||!list)return;
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(v)?v:[]}catch{return[]}};
  const save=(items)=>{localStorage.setItem(KEY,JSON.stringify(items));render();window.dispatchEvent(new CustomEvent("ruota:cart-updated"))};
  const money=(value)=>{const s=String(value??"").replace(/R\\$/i,"").trim().replace(/\\./g,"").replace(",",".");if(!s||!/^\\d+(\\.\\d{1,2})?$/.test(s))return null;const n=Number(s);return Number.isFinite(n)&&n>0?n:null};
  const format=(n)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const render=()=>{
    const items=read(), totalCount=items.reduce((sum,item)=>sum+Math.max(0,Number(item.quantity)||0),0);
    if(count)count.textContent=String(totalCount);
    list.replaceChildren();empty.hidden=items.length>0;
    let total=0,unknown=false;
    items.forEach((item)=>{
      const quantity=Math.max(1,Number(item.quantity)||1),price=money(item.price);
      if(price===null)unknown=true;else total+=price*quantity;
      const row=document.createElement("li");row.className="cart-item";
      const info=document.createElement("div"),name=document.createElement("p"),priceLine=document.createElement("p");
      name.className="cart-item__name";name.textContent=item.name||"Pizza";
      priceLine.className="cart-item__price";priceLine.textContent=price===null?"Preço a definir":format(price);info.append(name,priceLine);
      const actions=document.createElement("div");actions.className="cart-item__actions";
      const qty=document.createElement("div");qty.className="cart-quantity";
      const minus=document.createElement("button");minus.type="button";minus.textContent="−";minus.setAttribute("aria-label","Diminuir quantidade de "+(item.name||"pizza"));minus.dataset.action="decrease";minus.dataset.id=item.id;
      const output=document.createElement("output");output.textContent=String(quantity);
      const plus=document.createElement("button");plus.type="button";plus.textContent="+";plus.setAttribute("aria-label","Aumentar quantidade de "+(item.name||"pizza"));plus.dataset.action="increase";plus.dataset.id=item.id;
      qty.append(minus,output,plus);
      const remove=document.createElement("button");remove.type="button";remove.className="cart-remove";remove.textContent="×";remove.setAttribute("aria-label","Remover "+(item.name||"pizza"));remove.dataset.action="remove";remove.dataset.id=item.id;
      actions.append(qty,remove);row.append(info,actions);list.append(row);
    });
    const totalElement=document.querySelector("#cart-total"),priceNote=document.querySelector("#cart-price-note");
    if(totalElement)totalElement.textContent=items.length===0||unknown?"A definir":format(total);
    if(priceNote)priceNote.textContent=items.length===0?"Adicione produtos para montar seu pedido.":unknown?"Há produtos sem preço cadastrado. O total será calculado quando os valores forem definidos.":"Subtotal dos produtos, antes de eventual taxa de entrega.";
    checkout.disabled=items.length===0;
  };
  const open=()=>{render();drawer.classList.add("is-open");backdrop.hidden=false;requestAnimationFrame(()=>backdrop.classList.add("is-visible"));drawer.removeAttribute("inert");drawer.setAttribute("aria-hidden","false");document.body.classList.add("cart-open");closeButton.focus()};
  const close=()=>{drawer.classList.remove("is-open");backdrop.classList.remove("is-visible");drawer.setAttribute("inert","");drawer.setAttribute("aria-hidden","true");document.body.classList.remove("cart-open");window.setTimeout(()=>{backdrop.hidden=true},360);openButton.focus()};
  openButton?.addEventListener("click",open);closeButton?.addEventListener("click",close);backdrop?.addEventListener("click",close);
  document.addEventListener("keydown",(event)=>{if(event.key==="Escape"&&drawer.classList.contains("is-open"))close()});
  list.addEventListener("click",(event)=>{
    const button=event.target.closest("button[data-action]");if(!button)return;
    const items=read(),item=items.find(entry=>entry.id===button.dataset.id);if(!item)return;
    if(button.dataset.action==="increase")item.quantity=(Number(item.quantity)||0)+1;
    if(button.dataset.action==="decrease")item.quantity=(Number(item.quantity)||0)-1;
    if(button.dataset.action==="remove")save(items.filter(entry=>entry.id!==button.dataset.id));else save(items.filter(entry=>entry.quantity>0));
  });
  note?.addEventListener("input",()=>{try{localStorage.setItem("ruota-cart-note",note.value)}catch{}});
  try{note.value=localStorage.getItem("ruota-cart-note")||""}catch{}
  window.addEventListener("storage",render);window.addEventListener("ruota:cart-updated",render);render();
})();