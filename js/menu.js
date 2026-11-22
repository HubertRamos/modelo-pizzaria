(() => {
  const root = document.querySelector("#cardapio");
  if (!root) return;

  const categoriesRoot = root.querySelector("#menu-categories");
  const productsRoot = root.querySelector("#menu-products");
  const money = value => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  let catalog;
  let activeCategory = "all";

  const addToCart = product => {
    try {
      const cart = JSON.parse(localStorage.getItem("ruota-cart") || "[]");
      const existing = cart.find(item => item.id === product.id);
      if (existing) existing.quantity = (Number(existing.quantity) || 0) + 1;
      else cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
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

      const media = document.createElement("div");
      media.className = "menu-product__image";
      if (product.image) {
        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.name;
        image.loading = "lazy";
        media.append(image);
      } else {
        media.textContent = "RUOTA";
        media.setAttribute("aria-hidden", "true");
      }

      const body = document.createElement("div");
      body.className = "menu-product__body";
      const name = document.createElement("h3");
      name.className = "menu-product__name";
      name.textContent = product.name;
      const description = document.createElement("p");
      description.className = "menu-product__description";
      description.textContent = product.description || "";
      const footer = document.createElement("div");
      footer.className = "menu-product__footer";
      const price = document.createElement("strong");
      price.className = "menu-product__price";
      price.textContent = Number.isFinite(Number(product.price)) ? money(Number(product.price)) : "Preço a definir";
      const add = document.createElement("button");
      add.type = "button";
      add.className = "menu-product__add";
      add.textContent = "Adicionar";
      add.disabled = !Number.isFinite(Number(product.price)) || Number(product.price) < 0;
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

  fetch("./data/catalog.json")
    .then(response => {
      if (!response.ok) throw new Error("Não foi possível carregar data/catalog.json");
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.categories) || !Array.isArray(data.products)) {
        throw new Error("O catálogo precisa conter categories e products.");
      }
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