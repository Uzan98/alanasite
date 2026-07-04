// ============================================================
// main.js — Site estático Dra. Alana Chineider Librelon
// Carrega content.json e popula o DOM sem servidor.
// ============================================================

// ---------- Ícones SVG para os cartões de serviço ----------

const ICONES = {
  mamadeira: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6M10 2v4l-2 2v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8l-2-2V2"/><path d="M8 14h8"/></svg>',
  escova:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 18 6"/><path d="M14 2l4 4-2 2-4-4z"/><path d="M6 18l-2 2"/></svg>',
  dente:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-3 0-6 2-6 6 0 4 1.5 6 2 9 .3 1.7 2.2 1.6 2.5 0 .3-1.6.6-3 1.5-3s1.2 1.4 1.5 3c.3 1.6 2.2 1.7 2.5 0 .5-3 2-5 2-9 0-4-3-6-6-6Z"/></svg>',
  escudo:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="M9.5 12l1.8 1.8L14.5 10"/></svg>',
  aparelho:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9c2 2 4 3 8 3s6-1 8-3"/><circle cx="6" cy="9" r="1"/><circle cx="10" cy="11" r="1"/><circle cx="14" cy="11" r="1"/><circle cx="18" cy="9" r="1"/></svg>',
  estrela:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.5 6 .7-4.4 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.4 9.2l6-.7L12 3Z"/></svg>',
};

const MARCADOR_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

// ---------- Utilitários ----------

function setTexto(id, valor) {
  const el = document.getElementById(id);
  if (el && valor !== undefined) el.textContent = valor;
}

function setMeta(seletor, atributo, valor) {
  const el = document.querySelector(seletor);
  if (el && valor) el.setAttribute(atributo, valor);
}

// ---------- Funções de população do DOM ----------

function popularMeta(c) {
  if (c.meta.siteTitle) document.title = c.meta.siteTitle;
  setMeta('meta[name="description"]', 'content', c.meta.metaDescription);
  setMeta('meta[name="keywords"]',    'content', c.meta.keywords);
  setMeta('meta[name="author"]',      'content', c.identidade.nome);
  setMeta('meta[property="og:title"]',       'content', c.meta.siteTitle);
  setMeta('meta[property="og:description"]', 'content', c.meta.metaDescription);
  setMeta('meta[property="og:image"]',       'content', c.identidade.fotoPerfil);
  setMeta('meta[name="twitter:title"]',       'content', c.meta.siteTitle);
  setMeta('meta[name="twitter:description"]', 'content', c.meta.metaDescription);

  // Schema.org JSON-LD para SEO local
  const schemaEl = document.getElementById('schemaOrg');
  if (schemaEl) {
    schemaEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Dentist',
      'name': c.identidade.nome,
      'description': c.meta.metaDescription,
      'image': c.identidade.fotoPerfil,
      'medicalSpecialty': 'Pediatric Dentistry',
      'telephone': c.contato.telefone,
      'email': c.contato.email,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': c.contato.endereco,
        'addressLocality': c.meta.cidade,
        'addressRegion': c.meta.estado,
        'addressCountry': 'BR',
      },
      'openingHours': c.contato.horario,
      'url': '/',
    });
  }
}

function popularHeader(c) {
  document.querySelectorAll('.nome-dra').forEach(function(el) {
    el.textContent = c.identidade.nome;
  });
}

function popularHero(c) {
  setTexto('heroEyebrow', c.hero.eyebrow);
  setTexto('heroTitulo',  c.hero.titulo);
  setTexto('heroSubtitulo', c.hero.subtitulo);
  setTexto('heroBotaoPrimario',   c.hero.textoBotaoPrimario);
  setTexto('heroBotaoSecundario', c.hero.textoBotaoSecundario);

  var foto = document.getElementById('fotoPerfil');
  if (foto) {
    foto.src = c.identidade.fotoPerfil;
    foto.alt = 'Foto de ' + c.identidade.nome + ', cirurgiã-dentista especializada em odontopediatria';
  }
}

function popularSobre(c) {
  var fotoSobre = document.getElementById('fotoSobre');
  if (fotoSobre) {
    fotoSobre.src = c.identidade.fotoSobre;
    fotoSobre.alt = c.identidade.nome + ' em seu consultório de odontopediatria';
  }

  setTexto('sobreTitulo', c.sobre.titulo);
  setTexto('sobreTexto',  c.sobre.texto);
  setTexto('doutoraTituloCro', c.identidade.titulo + ' · ' + c.identidade.croNumero);

  var lista = document.getElementById('listaCredenciais');
  if (lista && c.sobre.credenciais) {
    lista.innerHTML = c.sobre.credenciais.map(function(item) {
      return '<li>' + MARCADOR_CHECK + '<span>' + item + '</span></li>';
    }).join('');
  }
}

function popularServicos(c) {
  var grade = document.getElementById('gradeServicos');
  if (!grade) return;
  grade.innerHTML = c.servicos.map(function(s) {
    return (
      '<div class="cartao-servico">' +
        '<div class="icone-servico">' + (ICONES[s.icone] || ICONES.estrela) + '</div>' +
        '<h3>' + s.titulo + '</h3>' +
        '<p>' + s.descricao + '</p>' +
      '</div>'
    );
  }).join('');
}

function popularDiferenciais(c) {
  var grade = document.getElementById('gradeDiferenciais');
  if (!grade) return;
  grade.innerHTML = c.diferenciais.map(function(d) {
    return (
      '<div class="item-diferencial">' +
        '<div class="marcador">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z"/>' +
          '</svg>' +
        '</div>' +
        '<h3>' + d.titulo + '</h3>' +
        '<p>' + d.descricao + '</p>' +
      '</div>'
    );
  }).join('');
}

function popularDepoimentos(c) {
  var grade = document.getElementById('gradeDepoimentos');
  if (!grade) return;
  grade.innerHTML = c.depoimentos.map(function(dep) {
    return (
      '<div class="cartao-depoimento">' +
        '<span class="aspas">\u201c</span>' +
        '<p style="color:var(--grafite-suave);">' + dep.texto + '</p>' +
        '<p class="autor">\u2014 ' + dep.nome + '</p>' +
      '</div>'
    );
  }).join('');
}

function popularFaq(c) {
  var lista = document.getElementById('listaFaq');
  if (!lista) return;
  lista.innerHTML = c.faq.map(function(item, i) {
    return (
      '<details class="item-faq"' + (i === 0 ? ' open' : '') + '>' +
        '<summary class="pergunta-faq">' +
          '<span>' + item.pergunta + '</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>' +
        '</summary>' +
        '<div class="resposta-faq">' + item.resposta + '</div>' +
      '</details>'
    );
  }).join('');

  // Comportamento de acordeão no FAQ
  lista.querySelectorAll('.item-faq').forEach(function(item) {
    item.addEventListener('toggle', function() {
      if (item.open) {
        lista.querySelectorAll('.item-faq').forEach(function(outro) {
          if (outro !== item) outro.removeAttribute('open');
        });
      }
    });
  });
}

function popularContato(c) {
  setTexto('ctoTelefone', c.contato.telefone);
  setTexto('ctoEmail',    c.contato.email);
  setTexto('ctoEndereco', c.contato.endereco);
  setTexto('ctoHorario',  c.contato.horario);

  // Mapa incorporado
  if (c.contato.mapaEmbedUrl) {
    var mapaContainer = document.getElementById('mapaContainer');
    if (mapaContainer) {
      mapaContainer.innerHTML =
        '<iframe class="mapa-embed" src="' + c.contato.mapaEmbedUrl +
        '" loading="lazy" title="Localização do consultório"></iframe>';
    }
  }

  // Botão WhatsApp da seção de contato
  var waNum = (c.contato.whatsapp || '').replace(/\D/g, '');
  var ctaBtn = document.getElementById('ctaWhatsapp');
  if (ctaBtn && waNum) {
    ctaBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var textarea = document.getElementById('waMensagem');
      var msg = textarea ? textarea.value.trim() : '';
      var texto = msg || 'Olá! Gostaria de agendar uma consulta.';
      window.open('https://wa.me/' + waNum + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    });
  }
}

function popularFooter(c) {
  setTexto('footerTextoExtra', c.footer.textoExtra);
  setTexto('footerTelefone',   c.contato.telefone);
  setTexto('footerEmail',      c.contato.email);
  setTexto('anoAtual',  String(new Date().getFullYear()));
  setTexto('footerNome', c.identidade.nome);

  var instEl = document.getElementById('footerInstagram');
  if (instEl) {
    if (c.contato.instagram) {
      instEl.innerHTML = '<a href="' + c.contato.instagram + '" target="_blank" rel="noopener">Instagram</a>';
      instEl.style.display = '';
    } else {
      instEl.style.display = 'none';
    }
  }
}

// ---------- Interatividade ----------

function popularInstagram(c) {
  if (!c.instagram || !c.instagram.posts) return;

  var carrossel = document.getElementById('instaCarrossel');
  if (!carrossel) return;

  carrossel.innerHTML = c.instagram.posts.map(function(post) {
    return (
      '<a class="insta-card" href="' + post.url + '" target="_blank" rel="noopener">' +
        '<img class="insta-card-img" src="' + post.imagem + '" alt="Post do Instagram" loading="lazy">' +
        '<div class="insta-card-body">' +
          '<p class="insta-card-legenda">' + post.legenda + '</p>' +
          '<span class="insta-card-ver">' +
            'Ver no Instagram ' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</span>' +
        '</div>' +
      '</a>'
    );
  }).join('');

  // Atualiza link e arroba do perfil
  if (c.instagram.usuario) {
    var url = 'https://instagram.com/' + c.instagram.usuario;
    document.querySelectorAll('.insta-avatar-link, .insta-btn-seguir').forEach(function(el) {
      el.href = url;
    });
    var arroba = document.querySelector('.insta-arroba');
    if (arroba) arroba.textContent = '@' + c.instagram.usuario;
  }

  // Foto de perfil no avatar do Instagram
  var avatarImg = document.querySelector('.insta-avatar');
  if (avatarImg && c.identidade && c.identidade.fotoPerfil) {
    avatarImg.src = c.identidade.fotoPerfil;
  }

  // Botões de navegação do carrossel
  var btnPrev = document.querySelector('.insta-nav-prev');
  var btnNext = document.querySelector('.insta-nav-next');
  var scrollAmount = 260;

  if (btnPrev) btnPrev.addEventListener('click', function() {
    carrossel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  if (btnNext) btnNext.addEventListener('click', function() {
    carrossel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}

function inicializarInteratividade(c) {
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

  // Botão flutuante do WhatsApp
  var waNum = (c.contato.whatsapp || '').replace(/\D/g, '');
  var btnWa = document.getElementById('btnWhatsapp');
  if (btnWa && waNum) {
    btnWa.href = 'https://wa.me/' + waNum;
    btnWa.style.display = 'flex';
  }
}

// ---------- Inicialização principal ----------

async function init() {
  var c;
  try {
    var resposta = await fetch('content.json');
    c = await resposta.json();
  } catch (err) {
    console.error('Não foi possível carregar content.json:', err);
    return;
  }

  popularMeta(c);
  popularHeader(c);
  popularHero(c);
  popularSobre(c);
  popularServicos(c);
  popularDiferenciais(c);
  popularDepoimentos(c);
  popularFaq(c);
  popularContato(c);
  popularFooter(c);
  popularInstagram(c);
  inicializarInteratividade(c);
}

init();
