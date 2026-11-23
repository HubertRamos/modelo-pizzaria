(() => {
  const $=(selector,root=document)=>root.querySelector(selector);
  const setText=(node,value)=>{if(node&&typeof value==="string"&&value.trim())node.textContent=value};
  const safeLink=(node,url)=>{if(!node||typeof url!=="string"||!url.trim())return;try{const parsed=new URL(url,location.href);if(!["http:","https:","mailto:","tel:"].includes(parsed.protocol))return;node.href=parsed.href}catch{}};
  const get=(object,path)=>path.split(".").reduce((value,key)=>value?.[key],object);
  const story=$("#sobre");
  if(story&&"IntersectionObserver" in window&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    story.classList.add("story-motion-ready");
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        story.classList.add("is-in-view");
        observer.unobserve(story);
      });
    },{threshold:.18,rootMargin:"0px 0px -8% 0px"});
    observer.observe(story);
  }
  const render=(store)=>{
    document.querySelectorAll("[data-store]").forEach(node=>setText(node,get(store,node.dataset.store)));
    document.querySelectorAll("[data-store-link]").forEach(node=>{const value=get(store,node.dataset.storeLink);if(node.dataset.storeLink==="contact.email"&&value){node.href="mailto:"+value;node.textContent=value}else safeLink(node,value)});
    const about=store.about||{};
    if(about.enabled===false){$("#sobre")?.remove();document.querySelectorAll('a[href="#sobre"]').forEach(node=>node.remove())}
    const highlights=$("#story-highlights");
    if(highlights&&Array.isArray(about.highlights)){highlights.replaceChildren();about.highlights.forEach(value=>{if(typeof value!=="string"||!value.trim())return;const span=document.createElement("span");span.textContent=value;highlights.append(span)})}
    const socials=$("#footer-socials");
    if(socials){socials.querySelectorAll("[data-social]").forEach(link=>{const value=store.contact?.[link.dataset.social];if(value)safeLink(link,value);else link.remove()});if(!socials.children.length)socials.remove()}
    const hours=$("#footer-hours");
    if(hours&&Array.isArray(store.openingHours)){hours.replaceChildren();store.openingHours.forEach(item=>{if(!item?.days||!item?.hours)return;const p=document.createElement("p"),days=document.createElement("span"),time=document.createElement("span");days.textContent=item.days;time.textContent=item.hours;p.append(days,time);hours.append(p)})}
    const year=$("#footer-year");if(year)year.textContent=String(new Date().getFullYear());
    const whatsapp=$("#footer-whatsapp");if(whatsapp){const digits=String(store.whatsappNumber||"").replace(/[^0-9]/g,"");if(digits)safeLink(whatsapp,"https://wa.me/"+digits);else whatsapp.hidden=true}
    const mapLink=$('[data-store-link="about.mapUrl"]');if(mapLink&&!store.about?.mapUrl)mapLink.hidden=true;
  };
  fetch("./data/store.json").then(response=>{if(!response.ok)throw new Error("store.json indisponível");return response.json()}).then(render).catch(error=>console.warn("RUOTA: configurações institucionais não carregadas.",error));
  window.RUOTA?.catalogReady?.then(catalog=>{
    const root=$("#starters-products");if(!root)return;
    const products=catalog.products.filter(product=>product.categoryId==="entradas"&&product.available!==false).slice(0,2);
    if(!products.length){$("#entradas")?.remove();return}
    root.replaceChildren();
    products.forEach(product=>{const card=document.createElement("article");card.className="starter-card";const media=document.createElement("div");media.className="starter-card__image";if(product.image)media.style.backgroundImage='url("'+product.image.replace(/["\\]/g,"")+'")';const body=document.createElement("div"),tag=document.createElement("span"),title=document.createElement("h3"),desc=document.createElement("p");tag.textContent="PARA COMEÇAR";title.textContent=product.name;desc.textContent=product.shortDescription||product.description||"";body.append(tag,title,desc);card.append(media,body);root.append(card)});
    const link=$("#starters-menu-link");link?.addEventListener("click",()=>{window.setTimeout(()=>{const category=document.querySelector('#menu-categories [data-category="entradas"]');category?.click()},350)});
  }).catch(()=>{});
})();