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
    if (index === activeIndex) return;
    activeIndex = index;

    items.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === activeIndex);
    });

    if (status) {
      status.textContent = `Pizza ${activeIndex + 1} em destaque, à direita.`;
    }
  };

  const updateActiveItem = () => {
    let closestIndex = 0;
    let smallestDistance = Infinity;

    items.forEach((item, index) => {
      const angle = getItemAngle(item);
      const distance = Math.abs(normalizeAngle(angle));
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveItem(closestIndex);
  };

  const setRotation = (nextRotation) => {
    rotation = nextRotation;
    wheel.style.setProperty("--wheel-rotation", `${rotation}deg`);
    updateActiveItem();
  };

  const snapToRight = () => {
    let closestIndex = 0;
    let closestAngle = 0;
    let smallestDistance = Infinity;

    items.forEach((item, index) => {
      const angle = normalizeAngle(getItemAngle(item));
      const distance = Math.abs(angle);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = index;
        closestAngle = angle;
      }
    });

    wheel.classList.add("is-snapping");
    setActiveItem(closestIndex);
    setRotation(rotation - closestAngle);
  };

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
    snapToRight();
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
      snapToRight();
    }
  });

  window.addEventListener("resize", updateActiveItem);
  setRotation(0);
  snapToRight();
})();