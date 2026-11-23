# RUOTA — modelo de site para pizzarias

Modelo de site estático para pizzarias. O catálogo e as regras comerciais ficam em arquivos JSON para que cada instalação possa ser adaptada sem editar a lógica da aplicação.

## Configuração da pizzaria

Edite `data/store.json`:

```json
{
  "whatsappNumber": "5543999999999",
  "fulfillment": {
    "delivery": {
      "enabled": true,
      "feeMode": "fixed",
      "fixedFee": 7.5,
      "minimumOrder": 30,
      "neighborhoods": []
    },
    "pickup": {
      "enabled": true,
      "minimumOrder": null
    }
  },
  "paymentMethods": {
    "pix": true,
    "cash": true,
    "card": true
  }
}
```

### WhatsApp

- Informe o número da pizzaria em formato internacional, somente com números (código do país + DDD + telefone).
- Deixe vazio enquanto o número ainda não estiver definido.
- O site abre o WhatsApp com o resumo preenchido. O cliente ainda precisa confirmar o envio no aplicativo.

### Entrega

- `enabled`: habilita ou desabilita a modalidade.
- `feeMode: "fixed"` + `fixedFee`: aplica uma taxa fixa.
- `feeMode: "neighborhood"`: usa a tabela de bairros.
- `minimumOrder`: valor mínimo para pedidos nessa modalidade; use `null` para não exigir mínimo.
- `neighborhoods`: quando preenchida, funciona como lista de bairros atendidos. Cada item deve ter `name` e `fee`. Exemplo:

```json
"feeMode": "neighborhood",
"neighborhoods": [
  { "name": "Centro", "fee": 5 },
  { "name": "Vila Nova", "fee": 8.5 }
]
```

Se a lista de bairros estiver vazia, não há restrição por bairro. Se a taxa não estiver configurada, o site informa que ela será confirmada pela pizzaria e não inventa um valor.

### Retirada

- `enabled`: habilita ou desabilita retirada.
- `minimumOrder`: mínimo opcional para retirada.

### Formas de pagamento

Use `true` ou `false` para mostrar ou ocultar Pix, dinheiro e cartão. Pelo menos uma opção deve permanecer habilitada.

## Catálogo

Edite `data/catalog.json`. Ele é a fonte única das categorias, produtos, preços, ingredientes e opções de personalização. Consulte as estruturas já presentes no arquivo como referência para cadastrar novos itens.

## Limitações desta versão

- O projeto é estático: não possui backend, banco de dados, painel administrativo ou registro central de pedidos.
- O carrinho é salvo no navegador do cliente; os dados pessoais do checkout não são persistidos.
- Não há cobrança Pix, cartão online, confirmação financeira ou acompanhamento de pedidos.
- A taxa e o total só são definitivos quando as regras comerciais estiverem configuradas.
- O pedido só é enviado quando o cliente confirma a mensagem no WhatsApp.

## Desenvolvimento

Não há etapa de build. Sirva a pasta por um servidor HTTP local ou publique os arquivos em uma hospedagem estática. Abrir o HTML diretamente como arquivo pode impedir o carregamento dos JSON por `fetch`.
