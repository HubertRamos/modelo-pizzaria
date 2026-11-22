(() => {
  const namespace = window.RUOTA = window.RUOTA || {};

  namespace.catalogReady = fetch("./data/catalog.json")
    .then(response => {
      if (!response.ok) throw new Error("Não foi possível carregar data/catalog.json");
      return response.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data.categories) || !Array.isArray(data.products)) {
        throw new Error("O catálogo precisa conter categories e products.");
      }

      const ids = new Set();
      data.products.forEach(product => {
        if (!product.id || ids.has(product.id)) {
          throw new Error("Cada produto precisa ter um identificador único no catálogo.");
        }
        ids.add(product.id);
        if (typeof product.name !== "string" || !product.name.trim()) {
          throw new Error("Todo produto precisa ter um nome.");
        }
        if (product.price !== null && product.price !== "" && !Number.isFinite(Number(product.price))) {
          throw new Error("O preço do produto " + product.name + " não é válido.");
        }
        if (product.shortDescription !== undefined && typeof product.shortDescription !== "string") {
          throw new Error("A descrição curta de " + product.name + " precisa ser um texto.");
        }
        if (product.ingredients !== undefined && !Array.isArray(product.ingredients)) {
          throw new Error("Os ingredientes de " + product.name + " precisam ser uma lista.");
        }
      });

      namespace.catalog = data;
      return data;
    });

  namespace.formatMoney = value => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
})();
