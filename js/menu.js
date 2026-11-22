(() => {
  const root = document.querySelector("#cardapio");
  if (!root) return;

  const categoriesRoot = root.querySelector("#menu-categories");
  const productsRoot = root.querySelector("#menu-products");
  const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  let catalog;
  let activeCategory = "all";
  let lastFocusedElement = null;

  const addToCart = product => {
    try {
      const cart = JSON.parse(localStorage.getItem("ruota-cart") || "[]");
      const existing = cart.find(item => item.id === product.id);
      if (existing) {
        existing.name = product.name;
        existing.price = Number(product.price);
        existing.quantity = (Number(existing.quantity) || 0) + 1;
      } else {
        cart.push({ id: product.id, name: product.name, price: Number(product.price), quantity: 1 });
      }
      localStorage.setItem("ruota-cart", JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent("ruota:cart-updated"));
      const feedback = document.querySelector("#cart-feedback");
      if (feedback) {
        feedback.textContent = product.name + " adicionado ao carrinho.";
        feedback.classList.add("is-visible");
        window.setTimeout(() => feedback.classList.remove("is-visible"), 2600);
      }
    } catch {
      window.alert("Não foi possível salvar o carrinho neste navegador.");
    }
  };

  const detailsBackdrop = document.createElement("div");
  detailsBackdrop.className = "menu-detail-backdrop";
  detailsBackdrop.hidden = true;

  const detailsDialog = document.createElement("section");
  detailsDialog.className = "menu-detail-dialog";
  detailsDialog.setAttribute("role", "dialog");
  detailsDialog.setAttribute("aria-modal", "true");
  detailsDialog.setAttribute("aria-labelledby", "menu-detail-title");
  detailsDialog.setAttribute("aria-hidden", "true");
  detailsDialog.setAttribute("inert", "");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "menu-detail-dialog__close";
  closeButton.setAttribute("aria-label", "Fechar detalhes");
  closeButton.textContent = "×";

  const detailImage = document.createElement("div");
  detailImage.className = "menu-detail-dialog__image";
  const detailContent = document.createElement("div");
  detailContent.className = "menu-detail-dialog__content";
  const detailEyebrow = document.createElement("p");
  detailEyebrow.className = "menu-detail-dialog__eyebrow";
  detailEyebrow.textContent = "DETALHES DO PRODUTO";
  const detailTitle = document.createElement("h2");
  detailTitle.id = "menu-detail-title";
  detailTitle.className = "menu-detail-dialog__title";
  const detailDescription = document.createElement("p");
  detailDescription.className = "menu-detail-dialog__description";
  const descriptionToggle = document.createElement("button");
  descriptionToggle.type = "button";
  descriptionToggle.className = "menu-detail-dialog__description-toggle";
  descriptionToggle.hidden = true;
  const ingredientsHeading = document.createElement("h3");
  ingredientsHeading.className = "menu-detail-dialog__ingredients-title";
  ingredientsHeading.textContent = "Ingredientes";
  const ingredientsList = document.createElement("ul");
  ingredientsList.className = "menu-detail-dialog__ingredients";
  const detailFooter = document.createElement("div");
  detailFooter.className = "menu-detail-dialog__footer";
  const detailPrice = document.createElement("strong");
  detailPrice.className = "menu-detail-dialog__price";
  const detailAdd = document.createElement("button");
  detailAdd.type = "button";
  detailAdd.className = "menu-product__add menu-detail-dialog__add";
  detailAdd.textContent = "Adicionar ao carrinho";

  detailFooter.append(detailPrice, detailAdd);
  detailContent.append(detailEyebrow, detailTitle, detailDescription, descriptionToggle, ingredientsHeading, ingredientsList, detailFooter);
  detailsDialog.append(closeButton, detailImage, detailContent);
  document.body.append(detailsBackdrop, detailsDialog);

  const closeDetails = () => {
    detailsDialog.classList.remove("is-open");
    detailsBackdrop.classList.remove("is-visible");
    detailsDialog.setAttribute("aria-hidden", "true");
    detailsDialog.setAttribute("inert", "");
    document.body.classList.remove("menu-detail-open");
    window.setTimeout(() => {
      detailsBackdrop.hidden = true;
      lastFocusedElement?.focus();
    }, 220);
  };

  const openDetails = (product, trigger) => {
    lastFocusedElement = trigger;
    detailImage.replaceChildren();
    if (product.image) {
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.name;
      detailImage.append(image);
    } else {
      detailImage.textContent = "RUOTA";
      detailImage.setAttribute("aria-label", "Imagem não cadastrada");
    }

    detailTitle.textContent = product.name;
    detailDescription.textContent = product.description || "Uma opção especial do nosso cardápio.";
    detailDescription.classList.remove("is-expanded");
    const hasLongDescription = detailDescription.textContent.length > 220;
    descriptionToggle.hidden = !hasLongDescription;
    descriptionToggle.textContent = "Ler descrição completa";
    descriptionToggle.setAttribute("aria-expanded", "false");
    descriptionToggle.setAttribute("aria-controls", "menu-detail-description");
    detailDescription.id = "menu-detail-description";
    ingredientsList.replaceChildren();
    const ingredients = Array.isArray(product.ingredients) ? product.ingredients : [];
    ingredientsHeading.hidden = ingredients.length === 0;
    ingredientsList.hidden = ingredients.length === 0;
    ingredients.forEach(ingredient => {
      const item = document.createElement("li");
      item.textContent = ingredient;
      ingredientsList.append(item);
    });

    const validPrice = Number.isFinite(Number(product.price)) && product.price !== null && product.price !== "";
    detailPrice.textContent = validPrice ? money(Number(product.price)) : "Preço a definir";
    detailAdd.disabled = !validPrice || Number(product.price) < 0;
    detailAdd.onclick = () => addToCart(product);

    detailsBackdrop.hidden = false;
    detailsDialog.removeAttribute("inert");
    detailsDialog.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-detail-open");
    requestAnimationFrame(() => {
      detailsBackdrop.classList.add("is-visible");
      detailsDialog.classList.add("is-open");
      closeButton.focus();
    });
  };

  descriptionToggle.addEventListener("click", () => {
    const expanded = detailDescription.classList.toggle("is-expanded");
    descriptionToggle.textContent = expanded ? "Mostrar menos" : "Ler descrição completa";
    descriptionToggle.setAttribute("aria-expanded", String(expanded));
  });

  closeButton.addEventListener("click", closeDetails);
  detailsBackdrop.addEventListener("click", closeDetails);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && detailsDialog.classList.contains("is-open")) closeDetails();
  });

  const renderCategories = () => {
    categoriesRoot.replaceChildren();
    const all = document.createElement("button");
    all.type = "button";
    all.className = "menu-category";
    all.textContent = "Todos";
    all.dataset.category = "all";
    all.setAttribute("aria-pressed", String(activeCategory === "all"));
    categoriesRoot.append(all);

    catalog.categories
      .filter(category => catalog.products.some(product => product.categoryId === category.id))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach(category => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "menu-category";
        button.textContent = category.name;
        button.dataset.category = category.id;
        button.setAttribute("aria-pressed", String(activeCategory === category.id));
        categoriesRoot.append(button);
      });
  };

  const renderProducts = () => {
    productsRoot.replaceChildren();
    const products = catalog.products.filter(product =>
      product.available !== false && (activeCategory === "all" || product.categoryId === activeCategory)
    );

    if (!products.length) {
      const empty = document.createElement("p");
      empty.className = "menu-empty";
      empty.textContent = "Nenhum produto disponível nesta categoria.";
      productsRoot.append(empty);
      return;
    }

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "menu-product";

      const media = document.createElement("button");
      media.type = "button";
      media.className = "menu-product__image menu-product__details-trigger";
      media.setAttribute("aria-label", "Ver detalhes de " + product.name);
      if (product.image) {
        const image = document.createElement("img");
        image.src = product.image;
        image.alt = "";
        image.loading = "lazy";
        media.append(image);
      } else {
        media.textContent = "RUOTA";
        media.setAttribute("aria-label", "Ver detalhes de " + product.name);
      }
      media.addEventListener("click", () => openDetails(product, media));

      const body = document.createElement("div");
      body.className = "menu-product__body";
      const name = document.createElement("button");
      name.type = "button";
      name.className = "menu-product__name menu-product__details-trigger";
      name.textContent = product.name;
      name.addEventListener("click", () => openDetails(product, name));

      const description = document.createElement("p");
      description.className = "menu-product__description";
      description.textContent = product.description || "";
      const footer = document.createElement("div");
      footer.className = "menu-product__footer";
      const price = document.createElement("strong");
      price.className = "menu-product__price";
      const validPrice = Number.isFinite(Number(product.price)) && product.price !== null && product.price !== "";
      price.textContent = validPrice ? money(Number(product.price)) : "Preço a definir";
      const add = document.createElement("button");
      add.type = "button";
      add.className = "menu-product__add";
      add.textContent = "Adicionar";
      add.disabled = !validPrice || Number(product.price) < 0;
      add.addEventListener("click", () => addToCart(product));
      footer.append(price, add);
      body.append(name, description, footer);
      card.append(media, body);
      productsRoot.append(card);
    });
  };

  categoriesRoot.addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderCategories();
    renderProducts();
  });

  window.RUOTA.catalogReady
    .then(data => {
      catalog = data;
      renderCategories();
      renderProducts();
    })
    .catch(error => {
      const message = document.createElement("p");
      message.className = "menu-empty";
      message.textContent = "Não foi possível carregar o cardápio. Verifique o arquivo data/catalog.json.";
      productsRoot.replaceChildren(message);
      console.error(error);
    });
})();
