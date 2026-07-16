// ============================================================
// server.js — Dra. Alana Chineider Librelon | Odontopediatria
// Servidor Express: site público estático + painel admin
// ============================================================

'use strict';

require('dotenv').config();

const express    = require('express');
const session    = require('express-session');
const bcrypt     = require('bcrypt');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---------- Caminhos ----------

const DOCS_DIR    = path.join(__dirname, 'docs');
const BLOG_DIR    = path.join(DOCS_DIR, 'blog');
const BLOGS_JSON  = path.join(BLOG_DIR, 'blogs.json');
const CONTENT_JSON = path.join(DOCS_DIR, 'content.json');
const SITEMAP     = path.join(DOCS_DIR, 'sitemap.xml');
const UPLOADS_DIR = path.join(DOCS_DIR, 'images', 'uploads');
const BLOG_IMG_DIR = path.join(BLOG_DIR, 'images');
const DATA_DIR    = path.join(__dirname, 'data');
const SITE_URL    = process.env.SITE_URL || 'https://draalanalibrelon.com.br';

// Garante que pastas necessárias existam
[DATA_DIR, UPLOADS_DIR, BLOG_IMG_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ---------- Segurança ----------

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'cdn.quilljs.com', 'cdn.jsdelivr.net'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'cdn.quilljs.com', 'fonts.googleapis.com'],
      fontSrc:    ["'self'", 'fonts.gstatic.com'],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      frameSrc:   ["'self'", 'www.google.com'],
      connectSrc: ["'self'"],
    },
  },
}));

// Rate limit apenas para login
app.use('/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas. Tente novamente em 15 minutos.',
}));

// ---------- Middleware ----------

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-troque-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000, // 8h
  },
}));

// Template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve arquivos estáticos da pasta docs/
app.use(express.static(DOCS_DIR));

// ---------- Upload de arquivos ----------

function criarStorageLocal(destino) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destino),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      const nome = file.fieldname + '-' + Date.now() + ext;
      cb(null, nome);
    },
  });
}

function filtroImagem(req, file, cb) {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Apenas imagens são permitidas.'));
}

const uploadFoto      = multer({ storage: criarStorageLocal(UPLOADS_DIR), fileFilter: filtroImagem, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadBlogImg   = multer({ storage: criarStorageLocal(BLOG_IMG_DIR), fileFilter: filtroImagem, limits: { fileSize: 5 * 1024 * 1024 } });

// ---------- CSRF simples (token na sessão) ----------

function gerarCsrfToken(req) {
  if (!req.session.csrf) {
    req.session.csrf = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return req.session.csrf;
}

function verificarCsrf(req, res, next) {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  if (!token || token !== req.session.csrf) {
    return res.status(403).send('Token inválido. Recarregue a página.');
  }
  next();
}

// ---------- Auth Middleware ----------

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

// ---------- Helpers de leitura/escrita ----------

function lerJson(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, 'utf-8')); }
  catch { return null; }
}

function salvarJson(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

// ---------- Gerador de páginas do blog ----------

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function gerarHtmlArtigo(artigo) {
  const dataFormatada = formatarData(artigo.date);
  const catsHtml = (artigo.categories || []).map(c => `<span class="blog-cat-tag">${c}</span>`).join('');
  const catsJson = JSON.stringify(artigo.categories || []);

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${SITE_URL}/blog/${artigo.slug}/`,
        headline: artigo.title,
        description: artigo.description,
        image: { '@type': 'ImageObject', url: artigo.coverImage.startsWith('http') ? artigo.coverImage : `${SITE_URL}${artigo.coverImage}` },
        datePublished: artigo.date,
        dateModified: artigo.dateModified || artigo.date,
        author: { '@type': 'Person', name: artigo.author, url: SITE_URL },
        publisher: { '@type': 'Person', name: artigo.author, url: SITE_URL },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${artigo.slug}/` },
        inLanguage: 'pt-BR',
        keywords: (artigo.categories || []).join(', '),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
          { '@type': 'ListItem', position: 3, name: artigo.title, item: `${SITE_URL}/blog/${artigo.slug}/` },
        ],
      },
    ],
  }, null, 2);

  const ogImage = artigo.coverImage.startsWith('http') ? artigo.coverImage : `${SITE_URL}${artigo.coverImage}`;

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
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${artigo.title}">
  <meta name="twitter:description" content="${artigo.description}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="/css/blog.css">
  <script type="application/ld+json">\n${schemaJson}\n  </script>
  <script>
    window.ARTIGO_CATS = ${catsJson};
    window.CONTATO_WHATSAPP = '5512982203216';
  </script>
</head>
<body>
  <div class="progresso-leitura" id="progressoLeitura" role="progressbar" aria-label="Progresso de leitura"></div>
  <header class="cabecalho">
    <div class="container">
      <a href="/" class="marca">
        <svg class="mascote-mini" viewBox="0 0 40 40" fill="none">
          <path d="M20 6c-6 0-10 3.5-10 10 0 6.5 2.5 10 3.5 15 .5 2.8 3.6 2.6 4.1 0 .5-2.6 1-5 2.4-5s1.9 2.4 2.4 5c.5 2.6 3.6 2.8 4.1 0C27.5 26 30 22.5 30 16c0-6.5-4-10-10-10Z" fill="#EE93AF"/>
          <circle cx="16.5" cy="15" r="1.6" fill="#4A3B3F"/>
          <circle cx="23.5" cy="15" r="1.6" fill="#4A3B3F"/>
          <path d="M17 18.5c1.2 1 4.8 1 6 0" stroke="#4A3B3F" stroke-width="1.3" stroke-linecap="round" fill="none"/>
        </svg>
        <span>Dra. Alana Librelon</span>
      </a>
      <nav><ul class="nav-desktop">
        <li><a href="/#sobre">Sobre</a></li>
        <li><a href="/#servicos">Serviços</a></li>
        <li><a href="/#depoimentos">Depoimentos</a></li>
        <li><a href="/#faq">Dúvidas</a></li>
        <li><a href="/blog/" style="color:var(--rosa-profundo)">Blog</a></li>
        <li><a href="/#contato">Contato</a></li>
      </ul></nav>
      <a class="botao botao-primario cta-nav" href="/#contato">Agendar consulta</a>
      <button class="botao-menu" aria-label="Abrir menu" aria-expanded="false" id="botaoMenu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <nav class="nav-mobile" id="navMobile">
      <a href="/#sobre">Sobre</a><a href="/#servicos">Serviços</a><a href="/#depoimentos">Depoimentos</a>
      <a href="/#faq">Dúvidas</a><a href="/blog/" style="color:var(--rosa-profundo)">Blog</a><a href="/#contato">Contato</a>
    </nav>
  </header>
  <main>
    <section class="artigo-hero">
      <div class="container">
        <nav class="breadcrumb" aria-label="Trilha de navegação">
          <a href="/">Home</a><span class="breadcrumb-sep" aria-hidden="true">›</span>
          <a href="/blog/">Blog</a><span class="breadcrumb-sep" aria-hidden="true">›</span>
          <span class="breadcrumb-atual" aria-current="page">${artigo.title}</span>
        </nav>
        <div class="artigo-cats">${catsHtml}</div>
        <h1 class="artigo-titulo">${artigo.title}</h1>
        <p class="artigo-desc">${artigo.description}</p>
        <div class="artigo-meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span class="artigo-autor-nome">${artigo.author}</span></span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><time datetime="${artigo.date}">${dataFormatada}</time></span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>${artigo.readingTimeMinutes} min de leitura</span>
        </div>
      </div>
      <div class="container" style="max-width:860px">
        <div class="artigo-hero-img-wrapper">
          <img class="artigo-hero-img" src="${artigo.coverImage}" alt="${artigo.coverImageAlt || artigo.title}" width="1200" height="514" loading="eager" fetchpriority="high">
        </div>
      </div>
    </section>
    <section class="artigo-layout">
      <div class="container">
        <article class="artigo-conteudo">
          ${artigo.content}
          <div class="artigo-cta-final">
            <h3>Gostou deste conteúdo? 🦷</h3>
            <p>Agende uma consulta para cuidar do sorriso do seu filho com toda a atenção que ele merece.</p>
            <a class="botao botao-primario" href="https://wa.me/5512982203216?text=${encodeURIComponent('Olá! Li um artigo no blog e gostaria de agendar uma consulta.')}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.1-.4.2-.6.1-1.8-.8-3-2-3.8-3.5-.1-.2-.1-.4.1-.6.2-.2.6-.7.7-.9.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.4-.3Z"/><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
              Agendar pelo WhatsApp
            </a>
          </div>
        </article>
        <aside class="artigo-sidebar">
          <div class="sidebar-card">
            <h4>Compartilhar</h4>
            <div class="sidebar-compartilhar">
              <button class="btn-compartilhar wa" id="btnCompartilharWa" aria-label="Compartilhar no WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.1-.4.2-.6.1-1.8-.8-3-2-3.8-3.5-.1-.2-.1-.4.1-.6.2-.2.6-.7.7-.9.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.4-.3Z"/><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
                WhatsApp
              </button>
              <button class="btn-compartilhar copiar" id="btnCopiarLink" aria-label="Copiar link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="15" height="15"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copiar link
              </button>
            </div>
          </div>
          <div class="sidebar-cta">
            <h4>Agende uma consulta</h4>
            <p>Cuide do sorriso do seu filho com quem entende de odontopediatria.</p>
            <a class="botao" href="https://wa.me/5512982203216" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.1-.4.2-.6.1-1.8-.8-3-2-3.8-3.5-.1-.2-.1-.4.1-.6.2-.2.6-.7.7-.9.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.4-.3Z"/><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
              Falar no WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </section>
  </main>
  <section class="artigos-relacionados" id="secaoRelacionados">
    <div class="container">
      <div class="secao-titulo"><span class="eyebrow">Leia também</span><h2>Outros artigos para você</h2></div>
      <div class="relacionados-grade" id="relacionadosGrade"></div>
    </div>
  </section>
  <footer>
    <div class="container">
      <div>
        <div class="footer-marca">
          <svg viewBox="0 0 40 40" fill="none"><path d="M20 6c-6 0-10 3.5-10 10 0 6.5 2.5 10 3.5 15 .5 2.8 3.6 2.6 4.1 0 .5-2.6 1-5 2.4-5s1.9 2.4 2.4 5c.5 2.6 3.6 2.8 4.1 0C27.5 26 30 22.5 30 16c0-6.5-4-10-10-10Z" fill="#EE93AF"/></svg>
          <span>Dra. Alana Chineider Librelon</span>
        </div>
        <p style="color:#C9AEB5;max-width:280px">Atendimento odontológico para bebês, crianças e adolescentes.</p>
      </div>
      <div><h4>Navegação</h4><ul>
        <li><a href="/#sobre">Sobre</a></li><li><a href="/#servicos">Serviços</a></li>
        <li><a href="/#depoimentos">Depoimentos</a></li><li><a href="/#faq">Dúvidas</a></li>
        <li><a href="/blog/">Blog</a></li><li><a href="/#contato">Contato</a></li>
      </ul></div>
      <div><h4>Contato</h4><ul>
        <li>(12) 98220-3216</li><li>lana.chlib@gmail.com</li>
        <li><a href="https://instagram.com/dra.alanalibrelon" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="/privacidade.html">Política de Privacidade</a></li>
      </ul></div>
    </div>
    <div class="linha-copyright">&copy; <span id="anoAtual"></span> Dra. Alana Chineider Librelon. Todos os direitos reservados.</div>
  </footer>
  <a class="flutuante-whatsapp" href="https://wa.me/5512982203216" target="_blank" rel="noopener" aria-label="Falar no WhatsApp" style="display:flex">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.1-.2.1-.4.2-.6.1-1.8-.8-3-2-3.8-3.5-.1-.2-.1-.4.1-.6.2-.2.6-.7.7-.9.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.4-.3Z"/><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.3A10 10 0 1 0 12 2Z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
  </a>
  <script>document.getElementById('anoAtual').textContent = new Date().getFullYear();</script>
  <script src="/js/blog-article.js"></script>
</body>
</html>`;
}

function atualizarSitemap(artigos) {
  const hoje = new Date().toISOString().split('T')[0];
  const entradasArtigos = artigos.map(a => `  <url>
    <loc>${SITE_URL}/blog/${a.slug}/</loc>
    <lastmod>${a.dateModified || a.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
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
  </url>
${entradasArtigos}
</urlset>
`;
  fs.writeFileSync(SITEMAP, xml, 'utf-8');
}

function regenerarPaginasDoArtigo(slugs) {
  const dados = lerJson(BLOGS_JSON);
  if (!dados) return;
  const artigos = dados.articles || [];

  slugs.forEach(slug => {
    const artigo = artigos.find(a => a.slug === slug);
    if (!artigo) return;
    const dir = path.join(BLOG_DIR, artigo.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), gerarHtmlArtigo(artigo), 'utf-8');
  });

  atualizarSitemap(artigos);
}

// ---------- ROTAS DE LOGIN ----------

app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('admin/login', { erro: null, csrf: gerarCsrfToken(req) });
});

app.post('/admin/login', async (req, res) => {
  const { username, password, _csrf } = req.body;

  if (_csrf !== req.session.csrf) {
    return res.render('admin/login', { erro: 'Token inválido. Recarregue.', csrf: gerarCsrfToken(req) });
  }

  const hashSalvo = process.env.ADMIN_PASSWORD_HASH;
  const userSalvo = process.env.ADMIN_USERNAME || 'admin';

  if (!hashSalvo) {
    return res.render('admin/login', { erro: 'Senha admin não configurada. Rode: npm run set-password', csrf: gerarCsrfToken(req) });
  }

  const ok = username === userSalvo && await bcrypt.compare(password, hashSalvo);
  if (!ok) {
    return res.render('admin/login', { erro: 'Usuário ou senha incorretos.', csrf: gerarCsrfToken(req) });
  }

  req.session.regenerate(err => {
    if (err) return res.status(500).send('Erro na sessão.');
    req.session.admin = true;
    res.redirect('/admin');
  });
});

app.get('/admin/logout', requireAuth, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ---------- DASHBOARD (conteúdo do site) ----------

app.get('/admin', requireAuth, (req, res) => {
  const content = lerJson(CONTENT_JSON) || {};
  res.render('admin/dashboard', {
    content,
    csrf: gerarCsrfToken(req),
    sucesso: req.session.sucesso ? (delete req.session.sucesso, true) : false,
  });
});

app.post('/admin/save-content', requireAuth, verificarCsrf, (req, res) => {
  const content = lerJson(CONTENT_JSON) || {};
  const b = req.body;

  // Actualiza cada secção — mesmos campos do admin.js original
  content.meta = {
    ...content.meta,
    siteTitle:       b.siteTitle || content.meta?.siteTitle,
    metaDescription: b.metaDescription || content.meta?.metaDescription,
    keywords:        b.keywords || content.meta?.keywords,
    cidade:          b.cidade || content.meta?.cidade,
    estado:          b.estado || content.meta?.estado,
  };

  content.identidade = {
    ...content.identidade,
    nome:      b.nome || content.identidade?.nome,
    titulo:    b.titulo || content.identidade?.titulo,
    croNumero: b.croNumero || content.identidade?.croNumero,
  };

  content.hero = {
    ...content.hero,
    eyebrow:              b.heroEyebrow || content.hero?.eyebrow,
    titulo:               b.heroTitulo || content.hero?.titulo,
    subtitulo:            b.heroSubtitulo || content.hero?.subtitulo,
    textoBotaoPrimario:   b.heroBotaoPrimario || content.hero?.textoBotaoPrimario,
    textoBotaoSecundario: b.heroBotaoSecundario || content.hero?.textoBotaoSecundario,
  };

  content.sobre = {
    ...content.sobre,
    titulo: b.sobreTitulo || content.sobre?.titulo,
    texto:  b.sobreTexto || content.sobre?.texto,
    credenciais: b.credenciais ? JSON.parse(b.credenciais) : content.sobre?.credenciais,
  };

  content.servicos   = b.servicos   ? JSON.parse(b.servicos)   : content.servicos;
  content.diferenciais = b.diferenciais ? JSON.parse(b.diferenciais) : content.diferenciais;
  content.depoimentos = b.depoimentos ? JSON.parse(b.depoimentos) : content.depoimentos;
  content.faq        = b.faq        ? JSON.parse(b.faq)        : content.faq;

  content.contato = {
    ...content.contato,
    telefone:    b.telefone    || content.contato?.telefone,
    whatsapp:    b.whatsapp    || content.contato?.whatsapp,
    email:       b.email       || content.contato?.email,
    endereco:    b.endereco    || content.contato?.endereco,
    horario:     b.horario     || content.contato?.horario,
    instagram:   b.instagram   || content.contato?.instagram,
    mapaEmbedUrl: b.mapaEmbedUrl || content.contato?.mapaEmbedUrl,
  };

  content.footer = { textoExtra: b.footerTexto || content.footer?.textoExtra };

  salvarJson(CONTENT_JSON, content);
  req.session.sucesso = true;
  res.redirect('/admin');
});

// Upload de fotos (perfil/sobre)
app.post('/admin/upload', requireAuth, (req, res) => {
  uploadFoto.single('foto')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ erro: 'A imagem é muito grande. O limite é 5MB.' });
      return res.status(400).json({ erro: err.message });
    } else if (err) {
      return res.status(400).json({ erro: err.message });
    }
    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
    const url = '/images/uploads/' + req.file.filename;
    const content = lerJson(CONTENT_JSON) || {};
    const campo = req.body.campo; // 'fotoPerfil' ou 'fotoSobre'
    if (campo === 'fotoPerfil') content.identidade.fotoPerfil = url;
    if (campo === 'fotoSobre')  content.identidade.fotoSobre  = url;
    salvarJson(CONTENT_JSON, content);
    res.json({ url });
  });
});

// ---------- ROTAS DO BLOG ----------

app.get('/admin/blog', requireAuth, (req, res) => {
  const dados = lerJson(BLOGS_JSON) || { articles: [] };
  const artigos = (dados.articles || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.render('admin/blog', {
    artigos,
    csrf: gerarCsrfToken(req),
    sucesso: req.session.blogSucesso ? (delete req.session.blogSucesso, req.session.blogMsg || 'Salvo!') : null,
    erro:    req.session.blogErro    ? (delete req.session.blogErro,    req.session.blogMsg || 'Erro.')  : null,
  });
});

app.get('/admin/blog/novo', requireAuth, (req, res) => {
  res.render('admin/blog-edit', {
    artigo: null,
    csrf: gerarCsrfToken(req),
    erro: null,
  });
});

app.get('/admin/blog/editar/:slug', requireAuth, (req, res) => {
  const dados = lerJson(BLOGS_JSON) || { articles: [] };
  const artigo = (dados.articles || []).find(a => a.slug === req.params.slug);
  if (!artigo) return res.redirect('/admin/blog');
  res.render('admin/blog-edit', {
    artigo,
    csrf: gerarCsrfToken(req),
    erro: null,
  });
});

app.post('/admin/blog/salvar', requireAuth, verificarCsrf, (req, res) => {
  const { slug, slugOriginal, title, description, date, readingTimeMinutes, categories, content, coverImageAlt } = req.body;

  if (!slug || !title || !content) {
    req.session.blogErro = true;
    req.session.blogMsg = 'Campos obrigatórios: slug, título e conteúdo.';
    return res.redirect('/admin/blog');
  }

  const dados = lerJson(BLOGS_JSON) || { articles: [] };
  const artigos = dados.articles || [];

  const cats = (categories || '').split(',').map(c => c.trim()).filter(Boolean);

  // Verifica se o slug já existe (e não é o mesmo artigo sendo editado)
  const slugExiste = artigos.find(a => a.slug === slug && a.slug !== slugOriginal);
  if (slugExiste) {
    req.session.blogErro = true;
    req.session.blogMsg = `O slug "${slug}" já está em uso por outro artigo.`;
    return res.redirect('/admin/blog');
  }

  // Busca imagem de capa (mantém a atual se não foi enviada nova)
  let coverImage = req.body.coverImageAtual || '/blog/images/default.jpg';

  const agora = new Date().toISOString().split('T')[0];
  const novoArtigo = {
    slug,
    title,
    description: description || '',
    date: date || agora,
    dateModified: agora,
    author: 'Dra. Alana Chineider Librelon',
    coverImage,
    coverImageAlt: coverImageAlt || title,
    categories: cats,
    readingTimeMinutes: parseInt(readingTimeMinutes) || 5,
    content,
  };

  // Remover artigo antigo com slug original (caso de renomeação de slug)
  const idx = slugOriginal ? artigos.findIndex(a => a.slug === slugOriginal) : artigos.findIndex(a => a.slug === slug);

  if (idx >= 0) {
    // Remove pasta antiga se o slug mudou
    if (slugOriginal && slugOriginal !== slug) {
      const dirAntigo = path.join(BLOG_DIR, slugOriginal);
      if (fs.existsSync(dirAntigo)) fs.rmSync(dirAntigo, { recursive: true });
    }
    artigos[idx] = novoArtigo;
  } else {
    artigos.unshift(novoArtigo);
  }

  dados.articles = artigos;
  salvarJson(BLOGS_JSON, dados);

  // Regenera a página estática e sitemap
  try {
    regenerarPaginasDoArtigo([slug]);
  } catch (e) {
    console.error('Erro ao gerar página:', e);
  }

  req.session.blogSucesso = true;
  req.session.blogMsg = `Artigo "${title}" salvo com sucesso!`;
  res.redirect('/admin/blog');
});

// Upload de imagem de capa do blog
app.post('/admin/blog/upload-imagem', requireAuth, (req, res) => {
  uploadBlogImg.single('imagem')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ erro: 'A imagem é muito grande. O limite é 5MB.' });
      return res.status(400).json({ erro: err.message });
    } else if (err) {
      return res.status(400).json({ erro: err.message });
    }
    if (!req.file) return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
    res.json({ url: '/blog/images/' + req.file.filename });
  });
});

app.post('/admin/blog/deletar', requireAuth, verificarCsrf, (req, res) => {
  const { slug } = req.body;
  if (!slug) return res.redirect('/admin/blog');

  const dados = lerJson(BLOGS_JSON) || { articles: [] };
  dados.articles = (dados.articles || []).filter(a => a.slug !== slug);
  salvarJson(BLOGS_JSON, dados);

  // Remove a pasta gerada
  const dir = path.join(BLOG_DIR, slug);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });

  atualizarSitemap(dados.articles);

  req.session.blogSucesso = true;
  req.session.blogMsg = 'Artigo deletado.';
  res.redirect('/admin/blog');
});

// ---------- Fallback ----------

// SPA-like fallback para rotas do blog sem .html (Vercel já trata, aqui por redundância)
app.use((req, res, next) => {
  // Rota não encontrada no Express — envia 404 ou tenta index.html da pasta
  const tentativa = path.join(DOCS_DIR, req.path, 'index.html');
  if (fs.existsSync(tentativa)) return res.sendFile(tentativa);
  next();
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(DOCS_DIR, 'index.html'));
});

// ---------- Inicia ----------

app.listen(PORT, () => {
  console.log(`\n🦷 Servidor rodando em http://localhost:${PORT}`);
  console.log(`   Painel admin: http://localhost:${PORT}/admin`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});
