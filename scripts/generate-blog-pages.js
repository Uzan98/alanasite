#!/usr/bin/env node
// ============================================================
// generate-blog-pages.js
// Gera páginas estáticas para cada artigo do blog a partir de
// docs/blog/blogs.json e atualiza o sitemap.xml.
//
// USO:
//   node scripts/generate-blog-pages.js
//
// Para adicionar um novo artigo:
//   1. Adicione o objeto ao array "articles" em docs/blog/blogs.json
//   2. Rode este script
//   3. Faça commit das mudanças e publique
// ============================================================

const fs   = require('fs');
const path = require('path');

// ---------- Configuração ----------

const SITE_URL    = 'https://draalanalibrelon.com.br';
const DOCS_DIR    = path.join(__dirname, '..', 'docs');
const BLOG_DIR    = path.join(DOCS_DIR, 'blog');
const BLOGS_JSON  = path.join(BLOG_DIR, 'blogs.json');
const SITEMAP     = path.join(DOCS_DIR, 'sitemap.xml');

// ---------- Leitura dos dados ----------

const dados = JSON.parse(fs.readFileSync(BLOGS_JSON, 'utf-8'));
const artigos = dados.articles || [];

console.log(`\n📚 ${artigos.length} artigo(s) encontrado(s) em blogs.json\n`);

// ---------- Template do artigo ----------

function gerarHtmlArtigo(artigo) {
  const dataFormatada = new Date(artigo.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const catsHtml = (artigo.categories || []).map(c =>
    `<span class="blog-cat-tag">${c}</span>`
  ).join('');

  const catsJson = JSON.stringify(artigo.categories || []);

  // JSON-LD Article
  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${SITE_URL}/blog/${artigo.slug}/`,
        'headline': artigo.title,
        'description': artigo.description,
        'image': {
          '@type': 'ImageObject',
          'url': artigo.coverImage.startsWith('http') ? artigo.coverImage : `${SITE_URL}${artigo.coverImage}`
        },
        'datePublished': artigo.date,
        'dateModified': artigo.dateModified || artigo.date,
        'author': {
          '@type': 'Person',
          'name': artigo.author,
          'url': SITE_URL
        },
        'publisher': {
          '@type': 'Person',
          'name': artigo.author,
          'url': SITE_URL
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/blog/${artigo.slug}/`
        },
        'inLanguage': 'pt-BR',
        'keywords': (artigo.categories || []).join(', ')
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${SITE_URL}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${SITE_URL}/blog/` },
          { '@type': 'ListItem', 'position': 3, 'name': artigo.title, 'item': `${SITE_URL}/blog/${artigo.slug}/` }
        ]
      }
    ]
  }, null, 2);

  const ogImage = artigo.coverImage.startsWith('http')
    ? artigo.coverImage
    : `${SITE_URL}${artigo.coverImage}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${artigo.title} | Blog Dra. Alana Chineider Librelon</title>
  <meta name="description" content="${artigo.description}">
  <meta name="author" content="${artigo.author}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_URL}/blog/${artigo.slug}/">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE_URL}/blog/${artigo.slug}/">
  <meta property="og:title" content="${artigo.title}">
  <meta property="og:description" content="${artigo.description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Dra. Alana Chineider Librelon - Odontopediatria">
  <meta property="article:published_time" content="${artigo.date}T12:00:00-03:00">
  <meta property="article:author" content="${artigo.author}">
  ${(artigo.categories || []).map(c => `<meta property="article:tag" content="${c}">`).join('\n  ')}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${artigo.title}">
  <meta name="twitter:description" content="${artigo.description}">
  <meta name="twitter:image" content="${ogImage}">

  <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
    rel="stylesheet">

  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/blog.css">

  <!-- JSON-LD Article -->
  <script type="application/ld+json">
${schemaJson}
  </script>

  <script>
    // Variáveis globais para o blog-article.js
    window.ARTIGO_CATS    = ${catsJson};
    window.CONTATO_WHATSAPP = '5512982203216';
  </script>
</head>

<body>

  <!-- Barra de progresso de leitura -->
  <div class="progresso-leitura" id="progressoLeitura" role="progressbar" aria-label="Progresso de leitura"></div>

  <!-- ===== HEADER ===== -->
  <header class="cabecalho">
    <div class="container">
      <a href="/" class="marca">
        <svg class="mascote-mini" viewBox="0 0 40 40" fill="none">
          <path
            d="M20 6c-6 0-10 3.5-10 10 0 6.5 2.5 10 3.5 15 .5 2.8 3.6 2.6 4.1 0 .5-2.6 1-5 2.4-5s1.9 2.4 2.4 5c.5 2.6 3.6 2.8 4.1 0C27.5 26 30 22.5 30 16c0-6.5-4-10-10-10Z"
            fill="#EE93AF" />
          <circle cx="16.5" cy="15" r="1.6" fill="#4A3B3F" />
          <circle cx="23.5" cy="15" r="1.6" fill="#4A3B3F" />
          <path d="M17 18.5c1.2 1 4.8 1 6 0" stroke="#4A3B3F" stroke-width="1.3" stroke-linecap="round" fill="none" />
        </svg>
        <span>Dra. Alana Librelon</span>
      </a>

      <nav>
        <ul class="nav-desktop">
          <li><a href="/#sobre">Sobre</a></li>
          <li><a href="/#servicos">Serviços</a></li>
          <li><a href="/#depoimentos">Depoimentos</a></li>
          <li><a href="/#faq">Dúvidas</a></li>
          <li><a href="/blog/" style="color: var(--rosa-profundo);">Blog</a></li>
          <li><a href="/#contato">Contato</a></li>
        </ul>
      </nav>

      <a class="botao botao-primario cta-nav" href="/#contato">Agendar consulta</a>

      <button class="botao-menu" aria-label="Abrir menu" aria-expanded="false" id="botaoMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <nav class="nav-mobile" id="navMobile">
      <a href="/#sobre">Sobre</a>
      <a href="/#servicos">Serviços</a>
      <a href="/#depoimentos">Depoimentos</a>
      <a href="/#faq">Dúvidas</a>
      <a href="/blog/" style="color: var(--rosa-profundo);">Blog</a>
      <a href="/#contato">Contato</a>
    </nav>
  </header>

  <main>

    <!-- ===== HERO DO ARTIGO ===== -->
    <section class="artigo-hero">
      <div class="container">

        <!-- Breadcrumb -->
        <nav class="breadcrumb" aria-label="Trilha de navegação">
          <a href="/">Home</a>
          <span class="breadcrumb-sep" aria-hidden="true">›</span>
          <a href="/blog/">Blog</a>
          <span class="breadcrumb-sep" aria-hidden="true">›</span>
          <span class="breadcrumb-atual" aria-current="page">${artigo.title}</span>
        </nav>

        <!-- Categorias -->
        <div class="artigo-cats">
          ${catsHtml}
        </div>

        <h1 class="artigo-titulo">${artigo.title}</h1>
        <p class="artigo-desc">${artigo.description}</p>

        <!-- Metadados -->
        <div class="artigo-meta">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span class="artigo-autor-nome">${artigo.author}</span>
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <time datetime="${artigo.date}">${dataFormatada}</time>
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
            </svg>
            ${artigo.readingTimeMinutes} min de leitura
          </span>
        </div>
      </div>

      <!-- Imagem de capa -->
      <div class="container" style="max-width:860px;">
        <div class="artigo-hero-img-wrapper">
          <img
            class="artigo-hero-img"
            src="${artigo.coverImage}"
            alt="${artigo.coverImageAlt || artigo.title}"
            width="1200"
            height="514"
            loading="eager"
            fetchpriority="high">
        </div>
      </div>
    </section>

    <!-- ===== CORPO DO ARTIGO ===== -->
    <section class="artigo-layout">
      <div class="container">

        <!-- Conteúdo principal -->
        <article class="artigo-conteudo">
          ${artigo.content}

          <!-- CTA no final do artigo -->
          <div class="artigo-cta-final">
            <h3>Gostou deste conteúdo? 🦷</h3>
            <p>Agende uma consulta para cuidar do sorriso do seu filho com toda a atenção que ele merece.</p>
            <a id="btnCtaFinal" class="botao botao-primario" href="https://wa.me/5512982203216?text=${encodeURIComponent('Olá! Li um artigo no blog e gostaria de agendar uma consulta.')}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.1-.4.2-.6.1-1.8-.8-3-2-3.8-3.5-.1-.2-.1-.4.1-.6.2-.2.6-.7.7-.9.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.4-.3Z"/>
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Z" fill="none" stroke="currentColor" stroke-width="1.4"/>
              </svg>
              Agendar pelo WhatsApp
            </a>
          </div>
        </article>

        <!-- Sidebar -->
        <aside class="artigo-sidebar">

          <!-- Compartilhar -->
          <div class="sidebar-card">
            <h4>Compartilhar</h4>
            <div class="sidebar-compartilhar">
              <button class="btn-compartilhar wa" id="btnCompartilharWa" aria-label="Compartilhar no WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.1-.4.2-.6.1-1.8-.8-3-2-3.8-3.5-.1-.2-.1-.4.1-.6.2-.2.6-.7.7-.9.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.4-.3Z"/>
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Z" fill="none" stroke="currentColor" stroke-width="1.4"/>
                </svg>
                WhatsApp
              </button>
              <button class="btn-compartilhar copiar" id="btnCopiarLink" aria-label="Copiar link do artigo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="15" height="15">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar link
              </button>
            </div>
          </div>

          <!-- CTA sidebar -->
          <div class="sidebar-cta">
            <h4>Agende uma consulta</h4>
            <p>Cuide do sorriso do seu filho com quem entende de odontopediatria.</p>
            <a id="btnWaSidebar" class="botao" href="https://wa.me/5512982203216" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.1-.4.2-.6.1-1.8-.8-3-2-3.8-3.5-.1-.2-.1-.4.1-.6.2-.2.6-.7.7-.9.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.4-.3Z"/>
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Z" fill="none" stroke="currentColor" stroke-width="1.4"/>
              </svg>
              Falar no WhatsApp
            </a>
          </div>

        </aside>
      </div>
    </section>

  </main>

  <!-- ===== ARTIGOS RELACIONADOS ===== -->
  <section class="artigos-relacionados" id="secaoRelacionados">
    <div class="container">
      <div class="secao-titulo">
        <span class="eyebrow">Leia também</span>
        <h2>Outros artigos para você</h2>
      </div>
      <div class="relacionados-grade" id="relacionadosGrade">
        <!-- Gerado pelo blog-article.js -->
      </div>
    </div>
  </section>

  <!-- ===== FOOTER ===== -->
  <footer>
    <div class="container">
      <div>
        <div class="footer-marca">
          <svg viewBox="0 0 40 40" fill="none">
            <path
              d="M20 6c-6 0-10 3.5-10 10 0 6.5 2.5 10 3.5 15 .5 2.8 3.6 2.6 4.1 0 .5-2.6 1-5 2.4-5s1.9 2.4 2.4 5c.5 2.6 3.6 2.8 4.1 0C27.5 26 30 22.5 30 16c0-6.5-4-10-10-10Z"
              fill="#EE93AF" />
          </svg>
          <span>Dra. Alana Chineider Librelon</span>
        </div>
        <p style="color:#C9AEB5; max-width:280px;">Atendimento odontológico para bebês, crianças e adolescentes.</p>
      </div>
      <div>
        <h4>Navegação</h4>
        <ul>
          <li><a href="/#sobre">Sobre</a></li>
          <li><a href="/#servicos">Serviços</a></li>
          <li><a href="/#depoimentos">Depoimentos</a></li>
          <li><a href="/#faq">Dúvidas</a></li>
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/#contato">Contato</a></li>
        </ul>
      </div>
      <div>
        <h4>Contato</h4>
        <ul>
          <li>(12) 98220-3216</li>
          <li>lana.chlib@gmail.com</li>
          <li><a href="https://instagram.com/dra.alanalibrelon" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="/privacidade.html">Política de Privacidade</a></li>
        </ul>
      </div>
    </div>
    <div class="linha-copyright">
      &copy; <span id="anoAtual"></span> Dra. Alana Chineider Librelon. Todos os direitos reservados.
    </div>
  </footer>

  <!-- Botão flutuante WhatsApp -->
  <a class="flutuante-whatsapp" id="btnWhatsapp" href="https://wa.me/5512982203216" target="_blank" rel="noopener"
    aria-label="Falar no WhatsApp" style="display:flex;">
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.1-.4.2-.6.1-1.8-.8-3-2-3.8-3.5-.1-.2-.1-.4.1-.6.2-.2.6-.7.7-.9.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.4-.3Z" />
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Z" fill="none" stroke="currentColor"
        stroke-width="1.4" />
    </svg>
  </a>

  <script>
    document.getElementById('anoAtual').textContent = new Date().getFullYear();
  </script>
  <script src="/js/blog-article.js"></script>
</body>

</html>`;
}

// ---------- Gerador de páginas ----------

let criadas = 0;
let atualizadas = 0;

artigos.forEach(artigo => {
  const dir = path.join(BLOG_DIR, artigo.slug);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const arquivo = path.join(dir, 'index.html');
  const html = gerarHtmlArtigo(artigo);
  const jaExistia = fs.existsSync(arquivo);

  fs.writeFileSync(arquivo, html, 'utf-8');

  if (jaExistia) {
    console.log(`  ♻️  Atualizado: /blog/${artigo.slug}/`);
    atualizadas++;
  } else {
    console.log(`  ✅ Criado:     /blog/${artigo.slug}/`);
    criadas++;
  }
});

// ---------- Atualização do sitemap.xml ----------

const hoje = new Date().toISOString().split('T')[0];

// Entradas fixas
const entradasFixas = `  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacidade.html</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`;

// Entradas dos artigos
const entradasArtigos = artigos.map(artigo => `  <url>
    <loc>${SITE_URL}/blog/${artigo.slug}/</loc>
    <lastmod>${artigo.dateModified || artigo.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradasFixas}
${entradasArtigos}
</urlset>
`;

fs.writeFileSync(SITEMAP, sitemapContent, 'utf-8');

// ---------- Resumo ----------

console.log(`
────────────────────────────────
✨ Geração concluída!
   ${criadas} página(s) criada(s)
   ${atualizadas} página(s) atualizada(s)
   sitemap.xml atualizado com ${artigos.length + 3} URLs
────────────────────────────────

Para publicar:
  git add .
  git commit -m "blog: adicionar/atualizar artigos"
  git push
`);
