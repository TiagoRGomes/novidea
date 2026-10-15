# Guia do painel administrativo NOVIDEA

Este guia identifica qual área do painel controla cada parte do site.

## Páginas → Conteúdo da Home

Edite o conteúdo da landing page e depois clique em **Publicar landing**:

- Título, destaque, chamada, descrição e sequência de imagens do hero.
- Etiquetas e textos sobrepostos à imagem principal.
- Serviços, ordem, títulos, etiquetas, descrições e imagens.
- Projetos/galeria, ordem, categorias, títulos e imagens.
- Textos do conceito, processo de trabalho, presentes, sobre a marca, depoimentos, FAQ e chamadas para ação.
- Textos de navegação no cabeçalho e rodapé.
- Imagens editoriais da secção de conceito, presentes e sobre a marca.
- Blocos adicionais: cartão, destaque, banner e editorial; podem ser ocultados, editados, ordenados e removidos. No layout atual, estes blocos adicionais são apresentados abaixo da galeria da Home, não podem ser inseridos em qualquer posição da página por arrastar e soltar.

## Páginas internas

Crie páginas com URL, estado de rascunho/publicado, modelo visual, etiqueta, título, descrição, corpo, imagem e CTA. Os modelos disponíveis são padrão, editorial com imagem e minimalista. O conteúdo avançado também pode ser editado como JSON. Uma página só aparece publicamente quando o estado está como **Publicada**.

## Produtos e categorias

Use **Produtos** para criar e editar nome, slug, descrição, preço, categoria, imagem, destaque, publicação e ordem na Home (menor número aparece primeiro). Se o catálogo estiver vazio, use **Importar produtos da Home para o CMS** para transformar os cinco cartões de exemplo em registos editáveis no Supabase; a importação ignora slugs já existentes. A homepage prioriza produtos publicados marcados como **Destaque**, ordenados pelo campo **Ordem na Home**. Se nenhum produto estiver marcado como destaque, apresenta até cinco produtos publicados por ordem definida. Use **Categorias** para nome, slug, descrição, imagem e estado ativo. Os cartões usam um rascunho local e um botão explícito de guardar.

## Carrosséis

Crie um carrossel, abra-o pela lista para editar nome, slug, intervalo, estado e os slides. Cada slide tem título, subtítulo, imagem, link e opção de publicação. Os carrosséis ativos, com slides ativos e com imagem, são apresentados automaticamente na Home. A remoção de um carrossel tenta apagar primeiro os respetivos slides.

## Biblioteca de mídia

Use **Mídia** para enviar imagens para o bucket público `cms-media` do Supabase Storage. As áreas de imagem também aceitam um URL direto. Upload requer configuração e políticas corretas no Supabase.

## Temas e fontes

Na opção **Temas**, experimente uma das paletas ou personalize as cores principais. O campo **Botões principais e envio de imagens** controla também a cor de fundo dos botões “Enviar imagem do computador” e “Enviar do computador” nos editores de conteúdo, produtos, páginas e slides. O texto destes botões é calculado automaticamente para manter o contraste — não é preciso escolher manualmente uma cor de texto. Também pode escolher a fonte dos textos e a fonte dos títulos separadamente. A pré-visualização é imediata no navegador atual; clique em **Guardar e publicar tema** para salvar a escolha no conteúdo do CMS e disponibilizá-la para os visitantes.

As famílias de fontes são carregadas do Google Fonts, por isso a pré-visualização pode usar a fonte de fallback se não houver ligação à internet.

## Textos e traduções

Este módulo mantém chaves de texto/tradução armazenadas em `cms_texts`. Ele não substitui os campos visuais acima. Para alterar texto efetivamente apresentado na landing, use **Páginas → Conteúdo da Home**; páginas individuais ficam em **Páginas internas**, e os dados do catálogo ficam em **Produtos/Categorias**.

## Requisitos de funcionamento

- Configurar `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Aplicar e rever as políticas RLS presentes em `supabase/security-policies.sql` na base de dados real.
- Criar/verificar o bucket público `cms-media` e as políticas de upload no Storage.
- Usar uma conta administrativa/editor com as permissões adequadas.

O código local não consegue aplicar automaticamente as alterações às políticas da instância Supabase. Após restaurar/usar outra base de dados, verifique a estrutura das tabelas e os acessos antes de publicar.


## Identidade da marca: logótipos do cabeçalho e do rodapé

Em **Admin → Páginas → Conteúdo da Home → Identidade da marca**, é possível configurar separadamente o logótipo do cabeçalho e do rodapé. Cada zona tem upload para a biblioteca de mídia do Supabase ou campo de URL, nome/texto da marca e descrição abaixo do nome. As duas zonas mostram pré-visualização. Depois de alterar, use **Publicar landing** para guardar no CMS.

Recomendação: utilize preferencialmente PNG/WebP transparente para símbolos. Se a imagem carregada já incluir o nome da marca, deixe o campo de nome vazio para não duplicar o texto. O cabeçalho e o rodapé aceitam imagens independentes.
