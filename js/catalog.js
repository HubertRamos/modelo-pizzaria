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
        if (product.customization !== undefined) {
          const options = product.customization;
          if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new Error("As opções de personalização de " + product.name + " precisam ser um objeto.");
          }
          if (options.enabled !== undefined && typeof options.enabled !== "boolean") {
            throw new Error("A configuração de personalização de " + product.name + " precisa ter enabled booleano.");
          }
          if (options.sizes !== undefined && (!Array.isArray(options.sizes) || options.sizes.some(size =>
            !size || typeof size.id !== "string" || typeof size.name !== "string" ||
            !Number.isFinite(Number(size.price)) || Number(size.price) < 0
          ))) {
            throw new Error("Os tamanhos de " + product.name + " precisam ter id, nome e preço válido.");
          }
          if (options.halfAndHalf !== undefined) {
            const rule = options.halfAndHalf;
            if (!rule || typeof rule.enabled !== "boolean" ||
                (rule.enabled && (!Number.isInteger(rule.maxFlavors) || rule.maxFlavors < 2)) ||
                (rule.pricing !== undefined && !["highest", "average", "sum"].includes(rule.pricing))) {
              throw new Error("A regra de meio a meio de " + product.name + " não é válida.");
            }
          }
          if (options.toppings !== undefined) {
            const rule = options.toppings;
            if (!rule || typeof rule.enabled !== "boolean" ||
                (rule.items !== undefined && (!Array.isArray(rule.items) || rule.items.some(item =>
                  !item || typeof item.id !== "string" || typeof item.name !== "string" ||
                  !Number.isFinite(Number(item.price)) || Number(item.price) < 0
                )))) {
              throw new Error("Os adicionais de " + product.name + " não são válidos.");
            }
          }
          if (options.removableIngredients !== undefined && typeof options.removableIngredients.enabled !== "boolean") {
            throw new Error("A regra de remoção de ingredientes de " + product.name + " não é válida.");
          }
        }
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
