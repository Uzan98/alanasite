// ============================================================
// blog-listing.js — Página de listagem /blog
// Carrega blogs.json e renderiza cards com busca + filtros
// ============================================================

const BASE_URL = 'https://draalanalibrelon.com.br';

// ---------- Utilitários ----------

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function slugParaUrl(slug) {
  return '/blog/' + slug + '/';
}

function destacarTexto(texto, query) {
  if (!query) return texto;
  const regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  return texto.replace(regex, '<mark>$1</mark>');
}

// ---------- Renderização ----------

function criarCard(artigo, delay, query) {
  const url = slugParaUrl(artigo.slug);
  const dataFormatada = formatarData(artigo.date);
  const titulo = query ? destacarTexto(artigo.title, query) : artigo.title;
  const desc = query ? destacarTexto(artigo.description, query) : artigo.description;

  const cats = (artigo.categories || []).map(function(c) {
    return '<span class="blog-cat-tag">' + c + '</span>';
  }).join('');

  return (
    '<a class="blog-card" href="' + url + '" style="animation-delay:' + delay + 'ms">' +
      '<div class="blog-card-img-wrapper">' +
        '<img class="blog-card-img" src="' + artigo.coverImage + '" alt="' + (artigo.coverImageAlt || artigo.title) + '" loading="lazy" width="600" height="338">' +
      '</div>' +
      '<div class="blog-card-body">' +
        '<div class="blog-card-cats">' + cats + '</div>' +
        '<h2>' + titulo + '</h2>' +
        '<p class="blog-card-desc">' + desc + '</p>' +
        '<div class="blog-card-meta">' +
          '<span>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' +
            dataFormatada +
          '</span>' +
          '<span>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>' +
            artigo.readingTimeMinutes + ' min de leitura' +
          '</span>' +
          '<span class="blog-card-ler">' +
            'Ler artigo' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="13" height="13"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</span>' +
        '</div>' +
      '</div>' +
    '</a>'
  );
}

function renderizarCards(artigos, query) {
  var grade = document.getElementById('blogGrade');
  var vazio = document.getElementById('blogVazio');
  if (!grade) return;

  if (!artigos || artigos.length === 0) {
    grade.innerHTML = '';
    if (vazio) vazio.classList.add('visivel');
    return;
  }

  if (vazio) vazio.classList.remove('visivel');
  grade.innerHTML = artigos.map(function(a, i) {
    return criarCard(a, i * 80, query);
  }).join('');
}

// ---------- Filtros e Busca ----------

var todosArtigos = [];
var categoriaAtiva = 'Todos';
var termoBusca = '';

function filtrar() {
  var resultado = todosArtigos;

  if (categoriaAtiva !== 'Todos') {
    resultado = resultado.filter(function(a) {
      return (a.categories || []).includes(categoriaAtiva);
    });
  }

  if (termoBusca) {
    var q = termoBusca.toLowerCase();
    resultado = resultado.filter(function(a) {
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.categories || []).some(function(c) { return c.toLowerCase().includes(q); })
      );
    });
  }

  renderizarCards(resultado, termoBusca);
}

function construirFiltros(artigos) {
  var todasCats = [];
  artigos.forEach(function(a) {
    (a.categories || []).forEach(function(c) {
      if (!todasCats.includes(c)) todasCats.push(c);
    });
  });

  var container = document.getElementById('blogFiltros');
  if (!container) return;

  var html = '<span class="blog-filtros-label">Filtrar por:</span>' +
    '<button class="btn-categoria ativo" data-cat="Todos" id="filtroTodos">Todos (' + artigos.length + ')</button>' +
    todasCats.map(function(cat) {
      var count = artigos.filter(function(a) { return (a.categories || []).includes(cat); }).length;
      return '<button class="btn-categoria" data-cat="' + cat + '">' + cat + ' (' + count + ')</button>';
    }).join('');

  container.innerHTML = html;

  container.querySelectorAll('.btn-categoria').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('.btn-categoria').forEach(function(b) { b.classList.remove('ativo'); });
      btn.classList.add('ativo');
      categoriaAtiva = btn.getAttribute('data-cat');
      filtrar();
    });
  });
}

// ---------- JSON-LD Blog + ItemList ----------

function injetarSchemaLd(artigos) {
  var itemList = artigos.map(function(a, i) {
    return {
      '@type': 'ListItem',
      'position': i + 1,
      'url': BASE_URL + '/blog/' + a.slug + '/'
    };
  });

  var schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': BASE_URL + '/blog/',
        'name': 'Blog de Odontopediatria — Dra. Alana Chineider Librelon',
        'description': 'Artigos sobre saúde bucal infantil, cuidados com os dentinhos e dicas para pais.',
        'url': BASE_URL + '/blog/',
        'inLanguage': 'pt-BR',
        'publisher': {
          '@type': 'Person',
          'name': 'Dra. Alana Chineider Librelon',
          'url': BASE_URL
        }
      },
      {
        '@type': 'ItemList',
        'name': 'Artigos do Blog',
        'itemListElement': itemList
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE_URL + '/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': BASE_URL + '/blog/' }
        ]
      }
    ]
  };

  var el = document.createElement('script');
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(schema);
  document.head.appendChild(el);
}

// ---------- Inicialização ----------

async function init() {
  var resposta, dados;
  try {
    resposta = await fetch('/blog/blogs.json');
    dados = await resposta.json();
  } catch (err) {
    console.error('Erro ao carregar blogs.json:', err);
    return;
  }

  todosArtigos = (dados.articles || []).sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  renderizarCards(todosArtigos, '');
  construirFiltros(todosArtigos);
  injetarSchemaLd(todosArtigos);

  // Busca em tempo real
  var inputBusca = document.getElementById('blogBusca');
  if (inputBusca) {
    inputBusca.addEventListener('input', function() {
      termoBusca = this.value.trim();
      filtrar();
    });
  }
}

init();
