// ============================================================
// blog-article.js — Página de artigo individual
// Renderiza artigos relacionados e funcionalidades interativas
// ============================================================

const BASE_URL_ARTIGO = 'https://draalanalibrelon.com.br';

// ---------- Progresso de Leitura ----------

function iniciarProgressoLeitura() {
  var barra = document.getElementById('progressoLeitura');
  if (!barra) return;

  var conteudo = document.querySelector('.artigo-conteudo');
  if (!conteudo) return;

  function atualizar() {
    var rect = conteudo.getBoundingClientRect();
    var alturaConteudo = conteudo.offsetHeight;
    var inicio = rect.top + window.scrollY;
    var scroll = window.scrollY;
    var progresso = Math.min(Math.max((scroll - inicio + window.innerHeight * 0.3) / alturaConteudo, 0), 1);
    barra.style.width = (progresso * 100) + '%';
  }

  window.addEventListener('scroll', atualizar, { passive: true });
  atualizar();
}

// ---------- Compartilhamento ----------

function iniciarCompartilhar() {
  var btnWa = document.getElementById('btnCompartilharWa');
  var btnCopiar = document.getElementById('btnCopiarLink');
  var url = window.location.href;
  var titulo = document.title;

  if (btnWa) {
    btnWa.addEventListener('click', function() {
      var texto = titulo + '\n' + url;
      window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    });
  }

  if (btnCopiar) {
    btnCopiar.addEventListener('click', function() {
      navigator.clipboard.writeText(url).then(function() {
        var original = btnCopiar.innerHTML;
        btnCopiar.innerHTML = btnCopiar.innerHTML.replace(/Copiar link/g, 'Copiado! ✓');
        setTimeout(function() { btnCopiar.innerHTML = original; }, 2000);
      }).catch(function() {
        var input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      });
    });
  }
}

// ---------- Artigos Relacionados ----------

function formatarDataRelacionado(dataStr) {
  var partes = dataStr.split('-').map(Number);
  var data = new Date(partes[0], partes[1] - 1, partes[2]);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function carregarRelacionados() {
  var container = document.getElementById('relacionadosGrade');
  var secao = document.getElementById('secaoRelacionados');
  if (!container) return;

  // Pega o slug atual da URL
  var slugAtual = window.location.pathname.replace(/\/$/, '').split('/').pop();
  // Pega categorias do artigo atual (injetadas pelo gerador de páginas)
  var catsAtual = (window.ARTIGO_CATS || []);

  var resposta, dados;
  try {
    resposta = await fetch('/blog/blogs.json');
    dados = await resposta.json();
  } catch (e) {
    if (secao) secao.style.display = 'none';
    return;
  }

  var todos = dados.articles || [];

  // Filtrar artigos relacionados: mesma categoria, exceto o atual
  var relacionados = todos.filter(function(a) {
    if (a.slug === slugAtual) return false;
    if (!catsAtual.length) return true;
    return (a.categories || []).some(function(c) { return catsAtual.includes(c); });
  }).slice(0, 3);

  // Fallback: se não há relacionados por categoria, pegar os mais recentes
  if (!relacionados.length) {
    relacionados = todos.filter(function(a) { return a.slug !== slugAtual; }).slice(0, 3);
  }

  if (!relacionados.length) {
    if (secao) secao.style.display = 'none';
    return;
  }

  container.innerHTML = relacionados.map(function(a, i) {
    var cats = (a.categories || []).map(function(c) {
      return '<span class="blog-cat-tag">' + c + '</span>';
    }).join('');

    return (
      '<a class="blog-card" href="/blog/' + a.slug + '/" style="animation-delay:' + (i * 80) + 'ms">' +
        '<div class="blog-card-img-wrapper">' +
          '<img class="blog-card-img" src="' + a.coverImage + '" alt="' + (a.coverImageAlt || a.title) + '" loading="lazy" width="600" height="338">' +
        '</div>' +
        '<div class="blog-card-body">' +
          '<div class="blog-card-cats">' + cats + '</div>' +
          '<h2>' + a.title + '</h2>' +
          '<p class="blog-card-desc">' + a.description + '</p>' +
          '<div class="blog-card-meta">' +
            '<span>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" width="13" height="13"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>' +
              a.readingTimeMinutes + ' min' +
            '</span>' +
            '<span class="blog-card-ler">' +
              'Ler' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
            '</span>' +
          '</div>' +
        '</div>' +
      '</a>'
    );
  }).join('');
}

// ---------- WhatsApp flutuante ----------

function iniciarWhatsapp() {
  // Tenta ler o número do meta tag injetado pelo gerador
  var waNum = (window.CONTATO_WHATSAPP || '').replace(/\D/g, '');
  if (!waNum) return;

  var btn = document.getElementById('btnWhatsapp');
  if (btn) {
    btn.href = 'https://wa.me/' + waNum;
    btn.style.display = 'flex';
  }

  var btnSidebar = document.getElementById('btnWaSidebar');
  if (btnSidebar) {
    btnSidebar.href = 'https://wa.me/' + waNum + '?text=' + encodeURIComponent('Olá! Li um artigo no blog e gostaria de agendar uma consulta.');
  }

  var btnCta = document.getElementById('btnCtaFinal');
  if (btnCtaFinal) {
    btnCtaFinal.href = 'https://wa.me/' + waNum + '?text=' + encodeURIComponent('Olá! Li um artigo no blog e gostaria de agendar uma consulta.');
  }
}

// ---------- Inicialização ----------

document.addEventListener('DOMContentLoaded', function() {
  iniciarProgressoLeitura();
  iniciarCompartilhar();
  carregarRelacionados();
  iniciarWhatsapp();

  // Menu mobile
  var botaoMenu = document.getElementById('botaoMenu');
  var navMobile = document.getElementById('navMobile');
  if (botaoMenu && navMobile) {
    botaoMenu.addEventListener('click', function() {
      var aberto = navMobile.classList.toggle('aberto');
      botaoMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
    navMobile.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navMobile.classList.remove('aberto');
        botaoMenu.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
