(() => {
  const wheel = document.querySelector(".pizza-wheel");
  if (!wheel) return;

  const items = Array.from(wheel.querySelectorAll("[data-wheel-item]"));
  const status = document.querySelector("#pizza-wheel-status");
  const intro = document.querySelector(".pizza-intro");
  const detail = document.querySelector("#pizza-detail");
  const detailTitle = document.querySelector("#pizza-detail-title");
  const closeDetail = detail?.querySelector(".pizza-detail__close");
  if (!items.length) return;

  const SELECT_ANGLE = 180;
  let rotation = 0;
  let dragStartAngle = 0;
  let dragStartRotation = 0;
  let activePointerId = null;
  let activeIndex = -1;

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

  const openDetails = (index) => {
    const item = items[index];
    if (!item || !detail || !intro) return;

    const name = item.dataset.pizzaName || `Pizza ${index + 1}`;
    if (detailTitle) detailTitle.textContent = name;

    intro.classList.add("has-details");
    detail.removeAttribute("inert");
    detail.setAttribute("aria-hidden", "false");
    closeDetail?.focus();
  };

  const closeDetails = () => {
    if (!detail || !intro) return;
    intro.classList.remove("has-details");
    detail.setAttribute("inert", "");
    detail.setAttribute("aria-hidden", "true");
    items[activeIndex]?.focus();
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