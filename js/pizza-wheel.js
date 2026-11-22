(() => {
  const wheel = document.querySelector(".pizza-wheel");
  if (!wheel) return;

  const items = Array.from(wheel.querySelectorAll("[data-wheel-item]"));
  const status = document.querySelector("#pizza-wheel-status");
  const intro = document.querySelector(".pizza-intro");
  const detail = document.querySelector("#pizza-detail");
  const detailTitle = document.querySelector("#pizza-detail-title");
  const featured = document.querySelector("#pizza-featured");
  const closeDetail = detail?.querySelector(".pizza-detail__close");
  const addToCartButton = detail?.querySelector("#add-to-cart");
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
    const selected = items[activeIndex];
    if (!selected) return;

    const name = detailTitle?.textContent?.trim() || selected.dataset.pizzaName || `Pizza ${activeIndex + 1}`;
    const priceText = detail?.querySelector("#pizza-detail-price")?.textContent?.trim() || "00,00";
    const cart = readCart();
    const productId = selected.dataset.pizzaId || `pizza-${activeIndex + 1}`;
    const existing = cart.find((item) => item.id === productId);

    if (existing) {
      existing.quantity = (Number(existing.quantity) || 0) + 1;
    } else {
      cart.push({ id: productId, name, price: priceText, quantity: 1 });
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      updateCartCount();
      showCartFeedback(`${name} adicionada ao carrinho.`);
      addToCartButton?.classList.add("is-added");
      window.setTimeout(() => addToCartButton?.classList.remove("is-added"), 500);
    } catch {
      showCartFeedback("Não foi possível salvar o carrinho neste navegador.");
    }
  };

  updateCartCount();

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

    items.forEach((item, itemIndex) => {
      const active = itemIndex === activeIndex;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    if (status) {
      status.textContent = `${items[activeIndex]?.dataset.pizzaName || `Pizza ${activeIndex + 1}`} em destaque, à esquerda.`;
    }
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

    const name = item.dataset.pizzaName || `Pizza ${index + 1}`;
    if (detailTitle) detailTitle.textContent = name;

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
    const { index } = findClosestToSelectionPoint();
    setActiveItem(index);
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && intro?.classList.contains("has-details")) {
      closeDetails();
    }
  });

  wheel.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform") return;
    wheel.classList.remove("is-snapping");
    updateActiveItem();
  });

  wheel.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-wheel-item]")) return;
    if (event.button !== 0 || activePointerId !== null) return;
    wheel.classList.remove("is-snapping");
    activePointerId = event.pointerId;
    dragStartAngle = pointerAngle(event);
    dragStartRotation = rotation;
    wheel.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  wheel.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointerId) return;
    const delta = normalizeAngle(pointerAngle(event) - dragStartAngle);
    setRotation(dragStartRotation + delta);
  });

  const finishDrag = (event) => {
    if (event.pointerId !== activePointerId) return;
    if (wheel.hasPointerCapture(event.pointerId)) {
      wheel.releasePointerCapture(event.pointerId);
    }
    activePointerId = null;
    snapToSelectionPoint();
  };

  wheel.addEventListener("pointerup", finishDrag);
  wheel.addEventListener("pointercancel", finishDrag);
  wheel.addEventListener("lostpointercapture", () => {
    activePointerId = null;
  });

  wheel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      wheel.classList.remove("is-snapping");
      setRotation(rotation + (event.key === "ArrowRight" ? 15 : -15));
      snapToSelectionPoint();
    }
  });

  window.addEventListener("resize", updateActiveItem);
  setRotation(0);
  snapToSelectionPoint();
})();
