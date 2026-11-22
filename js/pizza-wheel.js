(() => {
  const wheel = document.querySelector(".pizza-wheel");
  if (!wheel) return;

  const items = Array.from(wheel.querySelectorAll("[data-wheel-item]"));
  const status = document.querySelector("#pizza-wheel-status");
  if (!items.length) return;

  let rotation = 0;
  let dragStartAngle = 0;
  let dragStartRotation = 0;
  let activePointerId = null;
  let activeIndex = -1;

  const normalizeAngle = (angle) => ((angle + 180) % 360 + 360) % 360 - 180;

  const pointerAngle = (event) => {
    const bounds = wheel.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    return Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
  };

  const updateActiveItem = () => {
    const wheelBounds = wheel.getBoundingClientRect();
    const centerX = wheelBounds.left + wheelBounds.width / 2;
    const centerY = wheelBounds.top + wheelBounds.height / 2;
    let closestIndex = 0;
    let smallestDistance = Infinity;

    items.forEach((item, index) => {
      const bounds = item.getBoundingClientRect();
      const itemX = bounds.left + bounds.width / 2;
      const itemY = bounds.top + bounds.height / 2;
      const angle = Math.atan2(itemY - centerY, itemX - centerX) * 180 / Math.PI;
      const distance = Math.abs(normalizeAngle(angle + 90));

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex === activeIndex) return;
    activeIndex = closestIndex;

    items.forEach((item, index) => {
      item.classList.toggle("is-active", index === activeIndex);
    });

    if (status) {
      status.textContent = `Pizza ${activeIndex + 1} em destaque.`;
    }
  };

  const setRotation = (nextRotation) => {
    rotation = nextRotation;
    wheel.style.setProperty("--wheel-rotation", `${rotation}deg`);
    updateActiveItem();
  };

  wheel.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || activePointerId !== null) return;
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
  };

  wheel.addEventListener("pointerup", finishDrag);
  wheel.addEventListener("pointercancel", finishDrag);
  wheel.addEventListener("lostpointercapture", () => {
    activePointerId = null;
  });

  wheel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setRotation(rotation + (event.key === "ArrowRight" ? 15 : -15));
    }
  });

  window.addEventListener("resize", updateActiveItem);
  setRotation(0);
})();