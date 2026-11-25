# Ofertas ML SPGVALE — vitrine de afiliados do Mercado Livre

Site estático (HTML + CSS + JS puro, sem bibliotecas). Os produtos ficam em `products.json`.

```
index.html          página principal
sobre.html          página "Sobre"
privacidade.html    política de privacidade
products.json       lista de produtos e categorias  ← você edita aqui
assets/css/         estilo
assets/js/          busca, filtros, favoritos, compartilhar
assets/img/         logo, favicon, imagem de compartilhamento (og-image.png)
assets/banner.jpg          (você coloca) banner do computador
assets/banner-mobile.jpg   (você coloca) banner do celular
```

## 1. Como subir na HostGator

1. Entre no cPanel da HostGator e abra o **Gerenciador de Arquivos**.
2. Abra a pasta **public_html** (apague o `index.html` padrão da HostGator, se existir).
3. Clique em **Carregar** e envie o arquivo `.zip` do site.
4. Clique com o botão direito no `.zip` → **Extract** (Extrair) dentro de `public_html`.
   O `index.html` precisa ficar direto em `public_html/` (não dentro de uma subpasta).
5. Apague o `.zip` depois de extrair e abra seu domínio no navegador.
6. Em `index.html`, troque `https://www.seudominio.com.br/` pelo seu domínio (canonical e Open Graph).
7. Google Analytics: em `index.html`, tire o comentário do bloco “GOOGLE ANALYTICS” e troque `G-XXXXXXXXXX` pelo seu ID.
8. Redes sociais: no rodapé de `index.html`, coloque o endereço de cada rede no `href=""`. As que ficarem vazias não aparecem.

> Abrir o `index.html` com dois cliques no computador não carrega os produtos (o navegador bloqueia a leitura do `products.json` em arquivo local). No site publicado funciona normalmente.

## 2. Como trocar a imagem do banner

Envie as imagens para a pasta `assets/` com estes nomes exatos:

| Arquivo | Onde aparece | Tamanho ideal |
|---|---|---|
| `assets/banner.jpg` | computador | **1920 × 520 px** (JPG, até ~250 KB) |
| `assets/banner-mobile.jpg` | celular | **800 × 450 px** (JPG, até ~120 KB) |

- No **computador**, o texto “As Melhores Ofertas do Mercado Livre!” e o botão ficam por cima da imagem, nos **45% da esquerda**. Deixe esse lado limpo (só fundo) e coloque os produtos/arte do lado direito.
- No **celular**, o texto fica em cima e a imagem aparece inteira logo abaixo, então pode usar a arte toda.
- Enquanto a imagem não existir, aparece um espaço tracejado marcando o lugar.
- Depois de trocar, se o navegador mostrar a imagem antiga, aperte Ctrl+F5.

## 3. Como adicionar, remover ou editar um produto

Abra `products.json` (no Gerenciador de Arquivos: botão direito → Edit). Estrutura:

```json
{
  "atualizado_em": "2026-11-25",
  "fonte": "https://www.mercadolivre.com.br/mais-vendidos",
  "categorias": [
    { "id": "celulares", "nome": "Celulares e Telefones" }
  ],
  "produtos": [
    {
      "id": "MLB1234567890",
      "nome": "Nome do produto",
      "imagem": "https://http2.mlstatic.com/D_NQ_NP_....webp",
      "preco": 1349.00,
      "categoria": "celulares",
      "ranking": 1,
      "link_afiliado": "https://meli.la/XXXXXXX",
      "consultado_em": "2026-11-25"
    }
  ]
}
```

- **Adicionar:** copie um bloco `{ ... }` de produto, cole depois do último, coloque uma vírgula entre os blocos e troque os dados. O `id` precisa ser único (use o código MLB do anúncio).
- **Remover:** apague o bloco `{ ... }` do produto e a vírgula que sobrar.
- **Editar:** mude o valor desejado. Preço usa **ponto** como separador decimal e sem “R$” (ex.: `1349.90`).
- `categoria` tem que ser igual a um `id` da lista `categorias`. A ordem das categorias no arquivo é a ordem em que aparecem no site.
- `ranking` é a posição do produto na lista de mais vendidos daquela categoria.
- `link_afiliado` é o link gerado na barra de afiliados do Mercado Livre (precisa começar com `https://`).
- Datas no formato `AAAA-MM-DD`. Atualize `atualizado_em` sempre que revisar a lista.
- Ícone da categoria é escolhido automaticamente pelo nome. Para forçar um, adicione `"icone"` com um destes: `phone, laptop, headphones, tv, home, kitchen, tools, beauty, car, game, shirt, baby, sport, book, pet, health, tag`.
- Erro de vírgula ou aspas quebra o arquivo. Antes de salvar, cole o conteúdo em https://jsonlint.com para conferir.
