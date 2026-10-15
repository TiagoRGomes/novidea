# NOVIDEA Studio — site e CMS

Site da NOVIDEA construído com React 19, TypeScript, Vite e Tailwind CSS. O CMS e o catálogo podem utilizar Supabase.

## Novo layout premium

O projeto utiliza uma direção visual editorial, com verde profundo, creme e dourado; tipografia de contraste; fotografia de produto; cartões de categorias; secções de serviços, produtos destacados, presentes, processo, portefólio, diferenciais e perguntas frequentes. As páginas **Produtos, Serviços, Galeria e Contacto** seguem a mesma identidade e partilham navegação adaptável e rodapé. O painel administrativo foi mantido separado para continuar a servir como CMS.

As imagens externas são referências visuais temporárias, não fotografias garantidas de produtos da NOVIDEA. Substitua-as por fotografias próprias antes de publicar. Os preços só aparecem quando existem no catálogo; não são criados preços fictícios. Testemunhos só são mostrados quando há avaliações configuradas.

## Requisitos

- Node.js 22.12+ recomendado (Node 20.19+ também é adequado para esta configuração do Vite)
- npm 10+

## Executar localmente

1. Extraia o ZIP para uma pasta nova.
2. Abra o Git Bash ou terminal dentro da pasta `novidea-main`.
3. Instale as dependências:

   ```bash
   npm install
   ```

4. Inicie o servidor:

   ```bash
   npm run dev
   ```

5. Abra o endereço mostrado no terminal; nesta configuração, normalmente é `http://localhost:8080`.

A página pública utiliza conteúdo padrão e pode abrir sem Supabase. O catálogo público ficará vazio até existirem produtos publicados ou o CMS estar configurado.

## Composição da galeria e temas globais

- A secção de projetos usa uma grelha de 12 colunas com alturas de linha definidas. O cartão principal ocupa duas linhas e os dois cartões secundários ocupam uma linha cada, com a mesma altura e sem sobreposição em ecrãs grandes. Em tablet/telemóvel, os cartões passam a uma grelha fluida.
- No painel administrativo existe a opção **Temas**. É possível escolher uma paleta predefinida ou alterar as cores de fundo escuro, fundo claro, cartões, botões/destaques, acentos, texto e texto secundário. O campo **Botões principais e envio de imagens** também controla os botões de upload do painel; a cor do texto é selecionada automaticamente para manter contraste. A pré-visualização aplica-se imediatamente; **Guardar e publicar** grava o tema no conteúdo do CMS para visitantes, quando o Supabase está configurado.
- O sistema calcula cores de texto e tons complementares para melhorar o contraste ao escolher novas cores. Mesmo assim, confirme o resultado em ecrãs reais, sobretudo com cores muito claras ou muito escuras.
- A última paleta usada é guardada localmente para evitar um flash de cores antes de o tema publicado carregar. A cor global publicada é obtida do conteúdo do site no Supabase.

## Dependências e React 19

O `package.json` contém `next-themes` **0.4.6** e `vaul` **1.1.2**, em vez das versões antigas que declaravam compatibilidade apenas até React 18. O lockfile do pnpm também está sincronizado com essas versões.

Se estiver a reutilizar uma pasta antiga, extraia o ZIP para uma pasta nova e não copie `node_modules` nem um `package-lock.json` de outra versão. Não utilize `--force` ou `--legacy-peer-deps` como primeira solução: se surgir outro `ERESOLVE`, guarde a mensagem completa para identificar a dependência exata.

## Configurar o Supabase

1. Copie `.env.example` para um ficheiro chamado `.env.local` na raiz do projeto.
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os valores públicos do projeto Supabase. Também é aceite `VITE_SUPABASE_ANON_KEY`.
3. Preencha `VITE_WHATSAPP_NUMBER` com o número comercial internacional, apenas com dígitos.
4. Preencha `VITE_INSTAGRAM_URL` e `VITE_LINKEDIN_URL` apenas com os perfis reais.
5. Reinicie `npm run dev` depois de alterar `.env.local`.

As variáveis `VITE_*` são incluídas no bundle do navegador. **Nunca coloque uma chave `service_role`, palavra-passe ou segredo do servidor nessas variáveis.**


## Formulario de contacto y WhatsApp

El formulario envía el mensaje a `hola@novidea.es` mediante la API de Resend. La clave de Resend se mantiene exclusivamente en el servidor; no debe llamarse `VITE_RESEND_API_KEY` ni exponerse en el navegador.

### Probar el envío de email en local

1. Crea una cuenta en Resend y verifica el dominio `novidea.es` siguiendo las instrucciones DNS que proporciona el servicio. No elimines ni sustituyas los registros MX que utilice tu buzón actual.
2. Genera una API key de Resend.
3. En `.env.local` (no lo subas a Git), añade `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` y `CONTACT_TO_EMAIL`. Como remitente predeterminado se utiliza `NOVIDEA <hola@novidea.es>`; debe pertenecer a un dominio verificado en Resend.
4. Ejecuta `npm run dev`. El middleware de desarrollo expone `/api/contact` y usa la clave solo en el servidor local.

### Configurar el despliegue en Cloudflare Pages

En **Workers & Pages → tu proyecto → Settings → Variables and Secrets**, añade `RESEND_API_KEY` como **secret**. Añade `CONTACT_FROM_EMAIL` como variable con un remitente del dominio verificado (por ejemplo, `NOVIDEA <hola@novidea.es>`) y `CONTACT_TO_EMAIL` con `hola@novidea.es`. Guarda y vuelve a desplegar el sitio. El endpoint de Pages Functions está en `functions/api/contact.ts`.

Si el remitente todavía no está verificado, Resend rechazará el envío. Hasta configurar la API key y la verificación del dominio, el formulario mostrará un mensaje de configuración/error en lugar de afirmar falsamente que el email ha sido enviado.

### Botón flotante de WhatsApp

El botón flotante usa el número internacional configurado en **Admin → Páginas → Contenido de la Home → Marca, menú y contacto → WhatsApp**, o en `VITE_WHATSAPP_NUMBER`. Introduce solo dígitos, incluido el indicativo de país (por ejemplo, `34...` para España), sin `+`, espacios ni guiones. El botón aparece cuando hay un número válido y abre una conversación con un mensaje inicial preparado.

## Acesso ao CMS e segurança

O formulário público de registo foi removido do login. Para também impedir registos diretos por API, desative os novos registos nas definições de autenticação do Supabase e crie os utilizadores administrativos pelo painel do Supabase. Consulte `SUPABASE_SECURITY.md` e valide as políticas RLS diretamente no projeto real. A verificação de permissões no React não substitui a segurança da base de dados.

## Comandos

```bash
npm run dev       # servidor local
npm run build     # compilação de produção
npm run preview   # pré-visualização da pasta dist
npm run lint      # análise ESLint
```

## Antes de publicar

- Troque as referências visuais por fotografias reais e confirme os direitos de utilização.
- Confirme o email, o número comercial, as condições de envio, os prazos e todas as afirmações comerciais.
- Valide as políticas RLS do Supabase e teste as contas com diferentes permissões.
- Confira o sitemap, o domínio canónico e as páginas no Google Search Console.


## Guia do painel administrativo

Consulte [`GUIA-ADMIN-CMS.md`](./GUIA-ADMIN-CMS.md) para saber onde editar a Home, páginas internas, imagens, produtos, categorias, carrosséis, blocos, cores, fontes e configurações.

## Correção de legibilidade dos painéis sobre imagens

A versão atual substitui os painéis translúcidos dos destaques por superfícies sólidas com cores do tema e utiliza gradientes CSS explícitos nas fotografias. Isso evita que textos brancos sejam apresentados sobre zonas claras das imagens. Também ajusta o selo flutuante para não colidir com o título em ecrãs estreitos e torna os ícones circulares das categorias opacos.

Os estilos estão em `src/globals.css`; os principais usos estão em `src/pages/Index.tsx`, `src/pages/PublicCatalog.tsx`, `src/components/site/HomeCmsCarousels.tsx` e `src/components/site/SiteHeader.tsx`.
