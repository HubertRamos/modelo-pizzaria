(() => {
  const root=document.querySelector("#cardapio"); if(!root)return;
  const categoriesRoot=root.querySelector("#menu-categories"),productsRoot=root.querySelector("#menu-products");
  const money=value=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(value)||0);
  let catalog=null,activeCategory="all",lastFocusedElement=null,currentProduct=null;
  const cartKey="ruota-cart";
  const readCart=()=>{try{const value=JSON.parse(localStorage.getItem(cartKey)||"[]");return Array.isArray(value)?value:[]}catch{return[]}};
  const signature=value=>JSON.stringify(value||{});
  const feedback=message=>{const node=document.querySelector("#cart-feedback");if(!node)return;node.textContent=message;node.classList.add("is-visible");window.setTimeout(()=>node.classList.remove("is-visible"),2600)};
  const addToCart=(product,customization,unitPrice)=>{
    try{
      const cart=readCart(),key=signature(customization);
      const existing=cart.find(item=>item.id===product.id&&signature(item.customization)===key);
      if(existing)existing.quantity=(Number(existing.quantity)||0)+1;
      else cart.push({id:product.id,quantity:1,customization:customization||null,unitPrice:Number(unitPrice)});
      localStorage.setItem(cartKey,JSON.stringify(cart));window.dispatchEvent(new CustomEvent("ruota:cart-updated"));
      feedback(product.name+" adicionada ao carrinho.");
    }catch{window.alert("Não foi possível salvar o carrinho neste navegador.")}
  };
  const backdrop=document.createElement("div");backdrop.className="menu-detail-backdrop";backdrop.hidden=true;
  const dialog=document.createElement("section");dialog.className="menu-detail-dialog";dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","true");dialog.setAttribute("aria-labelledby","menu-detail-title");dialog.setAttribute("aria-hidden","true");dialog.setAttribute("inert","");
  const close=document.createElement("button");close.type="button";close.className="menu-detail-dialog__close";close.setAttribute("aria-label","Fechar detalhes");close.textContent="×";
  const image=document.createElement("div");image.className="menu-detail-dialog__image";
  const content=document.createElement("div");content.className="menu-detail-dialog__content";
  const intro=document.createElement("div");intro.className="menu-detail-dialog__intro";
  const eyebrow=document.createElement("p");eyebrow.className="menu-detail-dialog__eyebrow";eyebrow.textContent="DETALHES DO PRODUTO";
  const title=document.createElement("h2");title.id="menu-detail-title";title.className="menu-detail-dialog__title";
  const description=document.createElement("p");description.className="menu-detail-dialog__description";description.id="menu-detail-description";
  const descriptionToggle=document.createElement("button");descriptionToggle.type="button";descriptionToggle.className="menu-detail-dialog__description-toggle";
  intro.append(eyebrow,title,description,descriptionToggle);
  const ingredientsTitle=document.createElement("h3");ingredientsTitle.className="menu-detail-dialog__ingredients-title";ingredientsTitle.textContent="Ingredientes";
  const ingredients=document.createElement("ul");ingredients.className="menu-detail-dialog__ingredients";
  const options=document.createElement("div");options.className="pizza-customization";
  const footer=document.createElement("div");footer.className="menu-detail-dialog__footer";
  const price=document.createElement("strong");price.className="menu-detail-dialog__price";
  const add=document.createElement("button");add.type="button";add.className="menu-product__add menu-detail-dialog__add";add.textContent="Adicionar ao carrinho";
  footer.append(price,add);content.append(intro,ingredientsTitle,ingredients,options,footer);dialog.append(close,image,content);document.body.append(backdrop,dialog);
  let selection={sizeId:null,secondFlavorId:"",toppingIds:[],removedIngredients:[]};
  const fieldset=(heading)=>{const field=document.createElement("fieldset");field.className="pizza-customization__group";const legend=document.createElement("legend");legend.textContent=heading;field.append(legend);return field};
  const optionLabel=(text,control,detail)=>{const label=document.createElement("label");label.className="pizza-customization__option";const span=document.createElement("span");span.textContent=text;label.append(control,span);if(detail){const small=document.createElement("small");small.textContent=detail;label.append(small)}return label};
  const makeSelect=(items,value,onChange)=>{const select=document.createElement("select");select.className="pizza-customization__select";items.forEach(item=>{const option=document.createElement("option");option.value=item.value;option.textContent=item.label;select.append(option)});select.value=value;select.addEventListener("change",onChange);return select};
  const makePills=(items,value,onChange)=>{const group=document.createElement("div");group.className="pizza-customization__pills";group.setAttribute("role","group");items.forEach(item=>{const button=document.createElement("button");button.type="button";button.className="pizza-customization__pill";button.textContent=item.label;button.setAttribute("aria-pressed",String(item.value===value));button.addEventListener("click",()=>{group.querySelectorAll("button").forEach(node=>node.setAttribute("aria-pressed","false"));button.setAttribute("aria-pressed","true");onChange(item.value)});group.append(button)});return group};
  const calcPrice=()=>{
    const config=currentProduct?.customization||{},size=(config.sizes||[]).find(item=>item.id===selection.sizeId);
    let base=Number(size?.price??currentProduct?.price??0);
    const second=catalog?.products?.find(item=>item.id===selection.secondFlavorId);
    if(second&&config.halfAndHalf?.pricing==="highest"){const other=Number((second.customization?.sizes||[]).find(item=>item.id===selection.sizeId)?.price??second.price??0);base=Math.max(base,other)}
    else if(second&&config.halfAndHalf?.pricing==="average"){const other=Number((second.customization?.sizes||[]).find(item=>item.id===selection.sizeId)?.price??second.price??0);base=(base+other)/2}
    else if(second&&config.halfAndHalf?.pricing==="sum"){const other=Number((second.customization?.sizes||[]).find(item=>item.id===selection.sizeId)?.price??second.price??0);base+=other}
    const extras=(config.toppings?.items||[]).filter(item=>selection.toppingIds.includes(item.id)).reduce((sum,item)=>sum+Number(item.price),0);
    return Number((base+extras).toFixed(2));
  };
  const renderOptions=()=>{
    options.replaceChildren();const config=currentProduct?.customization;
    if(!config?.enabled){options.hidden=true;return}options.hidden=false;
    if(config.sizes?.length){
      const group=fieldset("Tamanho");const pills=makePills(config.sizes.map(item=>({value:item.id,label:item.name})),selection.sizeId,value=>{selection.sizeId=value;refreshPrice()});group.append(pills);const chosen=config.sizes.find(item=>item.id===selection.sizeId);if(chosen){const note=document.createElement("small");note.className="pizza-customization__size-note";note.textContent=(chosen.slices?chosen.slices+" fatias · ":"")+money(chosen.price);group.append(note)}options.append(group);
    }
    if(config.halfAndHalf?.enabled){
      const group=fieldset("Segundo sabor · opcional");const flavors=catalog.products.filter(item=>item.categoryId==="pizzas"&&item.available!==false&&item.id!==currentProduct.id);
      const select=makeSelect([{value:"",label:"Sem segundo sabor"},...flavors.map(item=>({value:item.id,label:item.name}))],selection.secondFlavorId,value=>{selection.secondFlavorId=value;refreshPrice()});group.append(select);const hint=document.createElement("small");hint.textContent="Meio a meio: o preço segue a regra configurada pela pizzaria.";group.append(hint);options.append(group);
    }
    if(config.toppings?.enabled&&config.toppings.items?.length){
      const group=fieldset("Adicionais");config.toppings.items.forEach(item=>{const input=document.createElement("input");input.type="checkbox";input.checked=selection.toppingIds.includes(item.id);input.addEventListener("change",()=>{if(input.checked){if(selection.toppingIds.length>=Number(config.toppings.maxSelections||99)){input.checked=false;feedback("Limite de adicionais: "+config.toppings.maxSelections+".");return}selection.toppingIds.push(item.id)}else selection.toppingIds=selection.toppingIds.filter(id=>id!==item.id);refreshPrice()});group.append(optionLabel(item.name,input,"+"+money(item.price)))});options.append(group);
    }
    if(config.removableIngredients?.enabled&&(currentProduct.ingredients||[]).length){
      const group=fieldset("Retirar ingredientes");currentProduct.ingredients.forEach(name=>{const input=document.createElement("input");input.type="checkbox";input.checked=selection.removedIngredients.includes(name);input.addEventListener("change",()=>{if(input.checked)selection.removedIngredients.push(name);else selection.removedIngredients=selection.removedIngredients.filter(item=>item!==name)});group.append(optionLabel(name,input,"Retirar"))});options.append(group);
    }
  };
  const refreshPrice=()=>{const total=calcPrice();price.textContent=money(total);add.dataset.unitPrice=String(total)};
  const openCustomization=(product,initialSelection={})=>{
    currentProduct=product;selection={sizeId:initialSelection.sizeId||product.customization?.sizes?.[0]?.id||null,secondFlavorId:initialSelection.secondFlavorId||"",toppingIds:[],removedIngredients:[]};
    title.textContent=product.name;description.textContent=product.description||"Uma opção especial do nosso cardápio.";description.classList.remove("is-expanded");
    const long=description.textContent.length>220;descriptionToggle.hidden=!long;descriptionToggle.textContent="Ler descrição completa";descriptionToggle.setAttribute("aria-expanded","false");
    const list=Array.isArray(product.ingredients)?product.ingredients:[];ingredientsTitle.hidden=!list.length;ingredients.hidden=!list.length;ingredients.replaceChildren();list.forEach(name=>{const li=document.createElement("li");li.textContent=name;ingredients.append(li)});
    image.replaceChildren();if(product.image){const img=document.createElement("img");img.src=product.image;img.alt=product.name;image.append(img)}else image.textContent="RUOTA";
    renderOptions();refreshPrice();add.disabled=!Number.isFinite(calcPrice());
    lastFocusedElement=document.activeElement;backdrop.hidden=false;dialog.removeAttribute("inert");dialog.setAttribute("aria-hidden","false");document.body.classList.add("menu-detail-open");
    requestAnimationFrame(()=>{backdrop.classList.add("is-visible");dialog.classList.add("is-open");close.focus()});
  };
  const closeDialog=()=>{dialog.classList.remove("is-open");backdrop.classList.remove("is-visible");dialog.setAttribute("aria-hidden","true");dialog.setAttribute("inert","");document.body.classList.remove("menu-detail-open");window.setTimeout(()=>{backdrop.hidden=true;lastFocusedElement?.focus()},240)};
  descriptionToggle.addEventListener("click",()=>{const expanded=description.classList.toggle("is-expanded");descriptionToggle.textContent=expanded?"Mostrar menos":"Ler descrição completa";descriptionToggle.setAttribute("aria-expanded",String(expanded))});
  close.addEventListener("click",closeDialog);backdrop.addEventListener("click",closeDialog);
  add.addEventListener("click",()=>{if(!currentProduct)return;const config=currentProduct.customization||{};const customization=config.enabled?{sizeId:selection.sizeId,secondFlavorId:selection.secondFlavorId||null,toppingIds:[...selection.toppingIds].sort(),removedIngredients:[...selection.removedIngredients].sort()}:null;addToCart(currentProduct,customization,calcPrice());closeDialog()});
  window.addEventListener("keydown",event=>{if(event.key==="Escape"&&dialog.classList.contains("is-open"))closeDialog()});
  window.RUOTA=window.RUOTA||{};window.RUOTA.openCustomization=openCustomization;
  const addSimple=(product,trigger)=>openCustomization(product);
  const renderCategories=()=>{categoriesRoot.replaceChildren();const all=document.createElement("button");all.type="button";all.className="menu-category";all.textContent="Todos";all.dataset.category="all";all.setAttribute("aria-pressed",String(activeCategory==="all"));categoriesRoot.append(all);catalog.categories.filter(category=>catalog.products.some(product=>product.categoryId===category.id)).sort((a,b)=>(a.order??0)-(b.order??0)).forEach(category=>{const button=document.createElement("button");button.type="button";button.className="menu-category";button.textContent=category.name;button.dataset.category=category.id;button.setAttribute("aria-pressed",String(activeCategory===category.id));categoriesRoot.append(button)})};
  const renderProducts=()=>{productsRoot.replaceChildren();const products=catalog.products.filter(product=>product.available!==false&&(activeCategory==="all"||product.categoryId===activeCategory));if(!products.length){const empty=document.createElement("p");empty.className="menu-empty";empty.textContent="Nenhum produto disponível nesta categoria.";productsRoot.append(empty);return}products.forEach(product=>{const card=document.createElement("article");card.className="menu-product";const media=document.createElement("button");media.type="button";media.className="menu-product__image menu-product__details-trigger";media.setAttribute("aria-label","Personalizar "+product.name);if(product.image){const img=document.createElement("img");img.src=product.image;img.alt="";img.loading="lazy";media.append(img)}else media.textContent="RUOTA";media.addEventListener("click",()=>openCustomization(product));const body=document.createElement("div");body.className="menu-product__body";const name=document.createElement("button");name.type="button";name.className="menu-product__name menu-product__details-trigger";name.textContent=product.name;name.addEventListener("click",()=>openCustomization(product));const desc=document.createElement("p");desc.className="menu-product__description";desc.textContent=product.shortDescription||product.description||"";const foot=document.createElement("div");foot.className="menu-product__footer";const productPrice=document.createElement("strong");productPrice.className="menu-product__price";productPrice.textContent=money(product.customization?.sizes?.[0]?.price??product.price);const button=document.createElement("button");button.type="button";button.className="menu-product__add";button.textContent=product.customization?.enabled?"Personalizar":"Adicionar";button.disabled=!Number.isFinite(Number(product.price));button.addEventListener("click",()=>addSimple(product,button));foot.append(productPrice,button);body.append(name,desc,foot);card.append(media,body);productsRoot.append(card)})};
  categoriesRoot.addEventListener("click",event=>{const button=event.target.closest("button[data-category]");if(!button)return;activeCategory=button.dataset.category;renderCategories();renderProducts()});
  window.RUOTA.catalogReady.then(data=>{catalog=data;renderCategories();renderProducts()}).catch(error=>{const node=document.createElement("p");node.className="menu-empty";node.textContent="Não foi possível carregar o cardápio. Verifique data/catalog.json.";productsRoot.replaceChildren(node);console.error(error)});
})();