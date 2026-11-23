(async () => {
  const catalog = await window.RUOTA.catalogReady.catch(error => { console.error(error); return null; });
  if (!catalog) return;
  const wheel = document.querySelector(".pizza-wheel");
  if (!wheel) return;

  const slots = Array.from(wheel.querySelectorAll("[data-wheel-item]"));
  const allPizzas = catalog.products.filter(product => product.categoryId === "pizzas" && product.available !== false);
  const featuredPizzas = allPizzas.filter(product => product.featured);
  const wheelProducts = [...featuredPizzas, ...allPizzas.filter(product => !product.featured)].slice(0, slots.length);
  const positionClasses = ["pizza-wheel__item--top", "pizza-wheel__item--upper-right", "pizza-wheel__item--lower-right", "pizza-wheel__item--lower-left", "pizza-wheel__item--upper-left"];
  const positionOrder = wheelProducts.length === 2 ? [3, 1] : wheelProducts.length === 3 ? [0, 2, 4] : positionClasses.map((_, index) => index);
  slots.forEach((item, index) => {
    const product = wheelProducts[index];
    if (!product) { item.remove(); return; }
    item.classList.remove(...positionClasses);
    item.classList.add(positionClasses[positionOrder[index]]);
    item.dataset.pizzaId = product.id;
    item.dataset.pizzaName = product.name;
    item.setAttribute("aria-label", "Ver detalhes de " + product.name);
    item.replaceChildren();
    if (product.image) {
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = "";
      item.append(image);
    } else {
      const label = document.createElement("span");
      label.textContent = product.name;
      item.append(label);
    }
  });
  const items = slots.slice(0, wheelProducts.length);
  const heroTitle = document.querySelector("#pizza-name");
  const heroPrice = document.querySelector(".pizza-intro__price span");
  const heroDescription = document.querySelector(".pizza-intro__description");
  const heroIngredients = document.querySelector(".pizza-intro .pizza-ingredients__list");
  const detailPrice = document.querySelector("#pizza-detail-price");
  const detailDescription = document.querySelector("#pizza-detail-description");
  const detailDescriptionToggle = document.createElement("button");
  detailDescriptionToggle.type = "button";
  detailDescriptionToggle.className = "pizza-detail__description-toggle";
  detailDescriptionToggle.textContent = "Ler descrição completa";
  detailDescriptionToggle.hidden = true;
  detailDescriptionToggle.setAttribute("aria-expanded", "false");
  detailDescriptionToggle.setAttribute("aria-controls", "pizza-detail-description");
  detailDescription?.after(detailDescriptionToggle);
  detailDescriptionToggle.addEventListener("click", () => {
    const expanded = detailDescription.classList.toggle("is-expanded");
    detailDescriptionToggle.textContent = expanded ? "Mostrar menos" : "Ler descrição completa";
    detailDescriptionToggle.setAttribute("aria-expanded", String(expanded));
  });
  const detailIngredients = document.querySelector("#pizza-detail-ingredients");
  const detailSizeOptions=document.createElement("div");detailSizeOptions.className="pizza-detail__sizes";detailSizeOptions.setAttribute("aria-label","Escolha o tamanho");
  const detailSizeLabel=document.createElement("p");detailSizeLabel.className="pizza-detail__sizes-label";detailSizeLabel.textContent="ESCOLHA O TAMANHO";
  detailPrice?.parentElement?.after(detailSizeLabel,detailSizeOptions);
  let selectedWheelSizeId=null;
  const formatMoney = value => window.RUOTA.formatMoney(value);
  const fillIngredients = (list, ingredients) => {
    if (!list) return;
    list.replaceChildren();
    (Array.isArray(ingredients) ? ingredients : []).forEach(ingredient => {
      const li = document.createElement("li");
      li.textContent = ingredient;
      list.append(li);
    });
  };
  const renderSelectedProduct = product => {
    if (!product) return;
    if (heroTitle) heroTitle.textContent = product.name;
    if (heroPrice) heroPrice.textContent = Number.isFinite(Number(product.price)) ? formatMoney(product.price).replace("R$", "").trim() : "A definir";
    if (heroDescription) heroDescription.textContent = product.shortDescription || product.description || "";
    fillIngredients(heroIngredients, product.ingredients);
  };
  if (!items.length) {
    wheel.hidden = true;
    return;
  }
  const status = document.querySelector("#pizza-wheel-status");
  const intro = document.querySelector(".pizza-intro");
  const detail = document.querySelector("#pizza-detail");
  const detailTitle = document.querySelector("#pizza-detail-title");
  const featured = document.querySelector("#pizza-featured");
  const closeDetail = detail?.querySelector(".pizza-detail__close");
  const addToCartButton = detail?.querySelector("#add-to-cart");
  const customizeButton=detail?.querySelector("#customize-pizza");
  const cartCount = document.querySelector("#cart-count");
  const cartFeedback = document.querySelector("#cart-feedback");
  const CART_STORAGE_KEY = "ruota-cart";
  let feedbackTimeout = null;
  let featuredItem = null;
  let transferAnimation = null;
  if (!items.length) return;

  const SELECT_ANGLE = 180;
  let rotation = 0;
  let dragStartAngle = 0;
  let dragStartRotation = 0;
  let activePointerId = null;
  let activeIndex = -1;
  const mobileMode = window.matchMedia('(max-width: 760px)');
  let mobilePointerStart = null;
  let mobileNav = null;
  const createMobileNav = () => {
    if (mobileNav || !wheel.parentElement) return;
    mobileNav = document.createElement('div');
    mobileNav.className = 'pizza-mobile-nav';
    mobileNav.setAttribute('role', 'group');
    mobileNav.setAttribute('aria-label', 'Selecionar pizza');

    const indicators = items.map((item, index) => {
      const indicator = document.createElement('button');
      indicator.type = 'button';
      indicator.className = 'pizza-mobile-nav__pill';
      indicator.setAttribute('aria-label', 'Mostrar ' + (item.dataset.pizzaName || ('pizza ' + (index + 1))));
      indicator.setAttribute('aria-pressed', 'false');
      indicator.addEventListener('click', () => moveMobileTo(index));
      mobileNav.append(indicator);
      return indicator;
    });

    wheel.parentElement.append(mobileNav);
    mobileNav._indicators = indicators;
  };

  if (mobileMode.matches) createMobileNav();

  const readCart = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  };

  const updateCartCount = () => {
    const count = readCart().reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    if (cartCount) cartCount.textContent = String(count);
  };

  const showCartFeedback = (message) => {
    if (!cartFeedback) return;
    cartFeedback.textContent = message;
    cartFeedback.classList.add("is-visible");
    window.clearTimeout(feedbackTimeout);
    feedbackTimeout = window.setTimeout(() => {
      cartFeedback.classList.remove("is-visible");
    }, 2600);
  };

  const addSelectedPizzaToCart = () => {
    const product = wheelProducts[activeIndex];
    if (!product) return;
    const size=(product.customization?.sizes||[]).find(item=>item.id===selectedWheelSizeId);
    const unitPrice=Number(size?.price??product.price);
    if (!Number.isFinite(unitPrice)||unitPrice<0) return;
    const customization=product.customization?.enabled?{sizeId:selectedWheelSizeId||null,secondFlavorId:null,toppingIds:[],removedIngredients:[]}:null;
    const cart = readCart();
    const signature=JSON.stringify(customization||{});
    const existing = cart.find(item => item.id === product.id && JSON.stringify(item.customization||{})===signature);
    if (existing) {
      existing.quantity = (Number(existing.quantity) || 0) + 1;
      existing.unitPrice=unitPrice;
    } else {
      cart.push({ id: product.id, quantity: 1, customization, unitPrice });
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      updateCartCount();
      window.dispatchEvent(new CustomEvent("ruota:cart-updated"));
      showCartFeedback(product.name + " adicionada ao carrinho.");
      addToCartButton?.classList.add("is-added");
      window.setTimeout(() => addToCartButton?.classList.remove("is-added"), 500);
    } catch {
      showCartFeedback("Não foi possível salvar o carrinho neste navegador.");
    }
  };

  updateCartCount();
  window.addEventListener("ruota:cart-updated", updateCartCount);
  window.addEventListener("storage", updateCartCount);

  const normalizeAngle = (angle) => ((angle + 180) % 360 + 360) % 360 - 180;

  const wheelCenter = () => {
    const bounds = wheel.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2
    };
  };

  const pointerAngle = (event) => {
    const center = wheelCenter();
    return Math.atan2(event.clientY - center.y, event.clientX - center.x) * 180 / Math.PI;
  };

  const getItemAngle = (item) => {
    const center = wheelCenter();
    const bounds = item.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    return Math.atan2(y - center.y, x - center.x) * 180 / Math.PI;
  };

  const setActiveItem = (index) => {
    activeIndex = index;
    renderSelectedProduct(wheelProducts[index]);

    items.forEach((item, itemIndex) => {
      const active = itemIndex === activeIndex;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    if (status) status.textContent = (items[activeIndex]?.dataset.pizzaName || ('Pizza ' + (activeIndex + 1))) + ' em destaque.';
    if (mobileNav?._indicators) {
      mobileNav._indicators.forEach((indicator, index) => {
        const active = index === activeIndex;
        indicator.classList.toggle('is-active', active);
        indicator.setAttribute('aria-pressed', String(active));
      });
    }
  };

  const moveMobileTo = (nextIndex) => {
    if (!mobileMode.matches || intro?.classList.contains('has-details') || nextIndex === activeIndex) return;
    const direction = nextIndex > activeIndex ? 1 : -1;
    const outgoingItem = items[activeIndex];

    items.forEach(item => item.classList.remove('is-mobile-leaving-next', 'is-mobile-leaving-previous'));
    if (outgoingItem) {
      outgoingItem.classList.add(direction > 0 ? 'is-mobile-leaving-next' : 'is-mobile-leaving-previous');
    }

    wheel.classList.remove('is-mobile-next', 'is-mobile-previous');
    void wheel.offsetWidth;
    wheel.classList.add(direction > 0 ? 'is-mobile-next' : 'is-mobile-previous');
    setActiveItem(nextIndex);
  };

  const moveMobile = (direction) => {
    if (!mobileMode.matches || intro?.classList.contains('has-details')) return;
    moveMobileTo((activeIndex + direction + items.length) % items.length);
  };

  const animateTransfer = (source, destination, onFinish) => {
    const from = source.getBoundingClientRect();
    const to = destination.getBoundingClientRect();
    const clone = source.cloneNode(true);
    clone.classList.remove("is-active", "is-transferred");
    const sourceStyle = getComputedStyle(source);
    clone.style.border = sourceStyle.border;
    clone.style.background = sourceStyle.background;
    clone.style.boxShadow = sourceStyle.boxShadow;
    clone.style.position = "fixed";
    clone.style.left = `${from.left}px`;
    clone.style.top = `${from.top}px`;
    clone.style.width = `${from.width}px`;
    clone.style.height = `${from.height}px`;
    clone.style.margin = "0";
    clone.style.zIndex = "30";
    clone.style.pointerEvents = "none";
    clone.style.transform = "none";
    clone.style.inset = "auto";
    document.body.append(clone);

    const animation = clone.animate(
      [
        { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: "50%" },
        { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px`, borderRadius: "50%" }
      ],
      { duration: 760, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    );

    transferAnimation = animation;
    animation.finished.then(() => {
      clone.remove();
      transferAnimation = null;
      onFinish?.();
    }).catch(() => clone.remove());
    return animation;
  };

  const openDetails = (index) => {
    const item = items[index];
    if (!item || !detail || !intro || !featured) return;

    transferAnimation?.cancel();
    items.forEach((wheelItem) => wheelItem.classList.remove("is-transferred"));
    featured.replaceChildren();
    featuredItem = null;

    const product = wheelProducts[index];
    if (!product) return;
    const name = product.name;
    if (detailTitle) detailTitle.textContent = name;
    const sizes=product.customization?.sizes||[];selectedWheelSizeId=sizes[0]?.id||null;detailSizeOptions.replaceChildren();detailSizeLabel.hidden=!sizes.length;if(sizes.length){sizes.forEach(size=>{const pill=document.createElement("button");pill.type="button";pill.className="pizza-detail__size-pill";pill.textContent=size.name;pill.setAttribute("aria-pressed",String(size.id===selectedWheelSizeId));pill.addEventListener("click",()=>{selectedWheelSizeId=size.id;detailSizeOptions.querySelectorAll("button").forEach(node=>node.setAttribute("aria-pressed",String(node===pill)));if(detailPrice)detailPrice.textContent=formatMoney(size.price).replace("R$","").trim()});detailSizeOptions.append(pill)})}
    if (detailPrice) detailPrice.textContent = Number.isFinite(Number(sizes.find(size=>size.id===selectedWheelSizeId)?.price??product.price)) ? formatMoney(sizes.find(size=>size.id===selectedWheelSizeId)?.price??product.price).replace("R$", "").trim() : "A definir";
    if (detailDescription) {
      detailDescription.textContent = product.description || "";
      detailDescription.classList.remove("is-expanded");
      detailDescriptionToggle.hidden = detailDescription.textContent.length <= 220;
      detailDescriptionToggle.textContent = "Ler descrição completa";
      detailDescriptionToggle.setAttribute("aria-expanded", "false");
    }
    fillIngredients(detailIngredients, product.ingredients);
    if (addToCartButton) addToCartButton.disabled = !Number.isFinite(Number(sizes.find(size=>size.id===selectedWheelSizeId)?.price??product.price));
    if(customizeButton)customizeButton.disabled=!product.customization?.enabled;

    intro.classList.add("has-details");
    detail.removeAttribute("inert");
    detail.setAttribute("aria-hidden", "false");
    item.classList.add("is-transferred");

    requestAnimationFrame(() => {
      animateTransfer(item, featured, () => {
        const displayItem = item.cloneNode(true);
        displayItem.classList.remove("is-active", "is-transferred");
        displayItem.removeAttribute("data-wheel-item");
        displayItem.removeAttribute("aria-pressed");
        displayItem.setAttribute("tabindex", "-1");
        featured.replaceChildren(displayItem);
        featuredItem = displayItem;
      });
    });

    closeDetail?.focus();
  };

  const closeDetails = () => {
    if (!detail || !intro || !featured) return;
    const original = items[activeIndex];

    const finishClose = () => {
      featured.replaceChildren();
      featuredItem = null;
      original?.classList.remove("is-transferred");
      detail.setAttribute("inert", "");
      detail.setAttribute("aria-hidden", "true");
      original?.focus();
    };

    // Se o usuário voltar antes de terminar a animação de abertura,
    // cancela a transferência pendente para ela não recriar o destaque fechado.
    if (!featuredItem && transferAnimation) {
      transferAnimation.cancel();
      transferAnimation = null;
      intro.classList.remove("has-details");
      finishClose();
      return;
    }

    if (featuredItem && original) {
      const itemToReturn = featuredItem;
      featuredItem = null;
      // A pizza retorna à roda enquanto o painel de detalhes desaparece.
      animateTransfer(itemToReturn, original, finishClose);
      intro.classList.remove("has-details");
    } else {
      intro.classList.remove("has-details");
      finishClose();
    }
  };

  const findClosestToSelectionPoint = () => {
    let closestIndex = 0;
    let closestAngle = 0;
    let smallestDistance = Infinity;

    items.forEach((item, index) => {
      const angle = normalizeAngle(getItemAngle(item) - SELECT_ANGLE);
      const distance = Math.abs(angle);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
        closestAngle = getItemAngle(item);
      }
    });

    return { index: closestIndex, angle: closestAngle };
  };

  const updateActiveItem = () => {
    if (mobileMode.matches) return;
    const { index } = findClosestToSelectionPoint(); setActiveItem(index);
  };

  const setRotation = (nextRotation) => {
    rotation = nextRotation;
    wheel.style.setProperty("--wheel-rotation", `${rotation}deg`);
    updateActiveItem();
  };

  const snapToSelectionPoint = () => {
    const { index, angle } = findClosestToSelectionPoint();
    const correction = normalizeAngle(SELECT_ANGLE - angle);

    wheel.classList.add("is-snapping");
    setActiveItem(index);
    setRotation(rotation + correction);
  };

  items.forEach((item, index) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      const angle = getItemAngle(item);
      const correction = normalizeAngle(SELECT_ANGLE - angle);
      wheel.classList.add("is-snapping");
      setRotation(rotation + correction);
      setActiveItem(index);
      openDetails(index);
    });
  });

  closeDetail?.addEventListener("click", closeDetails);
  addToCartButton?.addEventListener("click", addSelectedPizzaToCart);
  customizeButton?.addEventListener("click",()=>{const product=wheelProducts[activeIndex];if(product&&window.RUOTA?.openCustomization)window.RUOTA.openCustomization(product,{sizeId:selectedWheelSizeId})});

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && intro?.classList.contains("has-details")) {
      closeDetails();
    }
  });

  wheel.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform") return;
    wheel.classList.remove("is-snapping"); updateActiveItem();
  });
  wheel.addEventListener("animationend", (event) => {
    if (event.target.matches("[data-wheel-item]") &&
        (event.target.classList.contains("is-mobile-leaving-next") ||
         event.target.classList.contains("is-mobile-leaving-previous"))) {
      event.target.classList.remove("is-mobile-leaving-next", "is-mobile-leaving-previous");
      return;
    }
    wheel.classList.remove("is-mobile-next", "is-mobile-previous");
  });
  wheel.addEventListener("pointerdown", (event) => {
    if (mobileMode.matches) {
      if (event.target.closest(".pizza-mobile-nav button")) return;
      mobilePointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY }; return;
    }
    if (event.target.closest("[data-wheel-item]")) return;
    if (event.button !== 0 || activePointerId !== null) return;
    wheel.classList.remove("is-snapping"); activePointerId = event.pointerId;
    dragStartAngle = pointerAngle(event); dragStartRotation = rotation;
    wheel.setPointerCapture(event.pointerId); event.preventDefault();
  });
  wheel.addEventListener("pointermove", (event) => {
    if (mobileMode.matches || event.pointerId !== activePointerId) return;
    const delta = normalizeAngle(pointerAngle(event) - dragStartAngle); setRotation(dragStartRotation + delta);
  });
  const finishDrag = (event) => {
    if (mobileMode.matches) {
      if (!mobilePointerStart || event.pointerId !== mobilePointerStart.id) return;
      const dx = event.clientX - mobilePointerStart.x; const dy = event.clientY - mobilePointerStart.y;
      mobilePointerStart = null;
      if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.15) moveMobile(dx < 0 ? 1 : -1);
      return;
    }
    if (event.pointerId !== activePointerId) return;
    if (wheel.hasPointerCapture(event.pointerId)) wheel.releasePointerCapture(event.pointerId);
    activePointerId = null; snapToSelectionPoint();
  };
  wheel.addEventListener("pointerup", finishDrag);
  wheel.addEventListener("pointercancel", finishDrag);
  wheel.addEventListener("lostpointercapture", () => {
    activePointerId = null;
  });

  wheel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    if (mobileMode.matches) { moveMobile(event.key === "ArrowRight" ? 1 : -1); return; }
    wheel.classList.remove("is-snapping");
    setRotation(rotation + (event.key === "ArrowRight" ? 15 : -15)); snapToSelectionPoint();
  });
  const syncPresentationMode = () => {
    if (mobileMode.matches) {
      createMobileNav();
      wheel.style.setProperty("--wheel-rotation", "0deg");
      setActiveItem(Math.max(0, activeIndex));
    } else {
      mobileNav?.remove();
      mobileNav = null;
      wheel.classList.remove("is-mobile-next", "is-mobile-previous");
      updateActiveItem();
    }
  };

  mobileMode.addEventListener?.("change", syncPresentationMode);
  window.addEventListener("resize", syncPresentationMode);
  if (mobileMode.matches) { wheel.style.setProperty("--wheel-rotation", "0deg"); setActiveItem(0); }
  else { setRotation(0); snapToSelectionPoint(); }
})();
