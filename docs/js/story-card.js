// ============================================================
// story-card.js — Gerador de Card para Instagram Stories
// Cria um card 9:16 com identidade visual do site e permite:
//   • Celular: Web Share API (abre Instagram Stories nativo)
//   • Desktop: Download do PNG gerado com html2canvas
// ============================================================

(function () {
  'use strict';

  var SITE_URL = 'https://draalanalibrelon.com.br';
  var HANDLE   = '@dra.alanalibrelon';

  // ---------- Injetar html2canvas via CDN ----------

  function carregarHtml2Canvas(callback) {
    if (window.html2canvas) { callback(); return; }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = callback;
    script.onerror = function () {
      console.error('[story-card] Falha ao carregar html2canvas.');
    };
    document.head.appendChild(script);
  }

  // ---------- Dados do artigo atual ----------

  function getDadosArtigo() {
    return {
      titulo:      document.querySelector('.artigo-titulo')   ? document.querySelector('.artigo-titulo').textContent.trim()   : document.title,
      descricao:   document.querySelector('.artigo-desc')     ? document.querySelector('.artigo-desc').textContent.trim()     : '',
      autor:       document.querySelector('.artigo-autor-nome') ? document.querySelector('.artigo-autor-nome').textContent.trim() : 'Dra. Alana Librelon',
      categoria:   document.querySelector('.artigo-cats .blog-cat-tag') ? document.querySelector('.artigo-cats .blog-cat-tag').textContent.trim() : '',
      coverImg:    document.querySelector('.artigo-hero-img') ? document.querySelector('.artigo-hero-img').src : '',
      url:         window.location.href,
    };
  }

  // ---------- Construir o card DOM (formato 9:16) ----------

  function criarCardDOM(dados) {
    var wrapper = document.createElement('div');
    wrapper.id = 'storyCardRender';
    wrapper.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:-9999px',
      'width:540px',
      'height:960px',
      'border-radius:0',
      'overflow:hidden',
      'font-family:Nunito,sans-serif',
      'background:#FAF0F4',
    ].join(';');

    // Calcular descrição resumida (max 120 chars)
    var desc = dados.descricao.length > 120
      ? dados.descricao.substring(0, 117) + '...'
      : dados.descricao;

    // Título resumido (max 90 chars)
    var titulo = dados.titulo.length > 90
      ? dados.titulo.substring(0, 87) + '...'
      : dados.titulo;

    wrapper.innerHTML = [
      // Fundo gradiente
      '<div style="position:absolute;inset:0;background:linear-gradient(160deg,#fce8f0 0%,#fdf6f8 45%,#f0faf5 100%);"></div>',

      // Bolinhas decorativas
      '<div style="position:absolute;top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:rgba(238,147,175,0.18);"></div>',
      '<div style="position:absolute;bottom:120px;left:-60px;width:200px;height:200px;border-radius:50%;background:rgba(167,212,188,0.18);"></div>',
      '<div style="position:absolute;top:280px;right:-40px;width:130px;height:130px;border-radius:50%;background:rgba(238,147,175,0.12);"></div>',

      // Conteúdo principal (posicionado sobre o fundo)
      '<div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:44px 36px 36px;">',

        // Header: mascote + nome
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">',
          '<svg width="42" height="42" viewBox="0 0 40 40" fill="none">',
            '<path d="M20 6c-6 0-10 3.5-10 10 0 6.5 2.5 10 3.5 15 .5 2.8 3.6 2.6 4.1 0 .5-2.6 1-5 2.4-5s1.9 2.4 2.4 5c.5 2.6 3.6 2.8 4.1 0C27.5 26 30 22.5 30 16c0-6.5-4-10-10-10Z" fill="#EE93AF"/>',
            '<circle cx="16.5" cy="15" r="1.6" fill="#4A3B3F"/>',
            '<circle cx="23.5" cy="15" r="1.6" fill="#4A3B3F"/>',
            '<path d="M17 18.5c1.2 1 4.8 1 6 0" stroke="#4A3B3F" stroke-width="1.3" stroke-linecap="round" fill="none"/>',
          '</svg>',
          '<div>',
            '<div style="font-family:Fredoka,Nunito,sans-serif;font-size:15px;font-weight:600;color:#C1577A;line-height:1.1;">Dra. Alana Librelon</div>',
            '<div style="font-size:12px;color:#a07d8e;font-weight:600;">' + HANDLE + '</div>',
          '</div>',
        '</div>',

        // Tag da categoria
        dados.categoria
          ? '<div style="display:inline-block;background:#fde8f0;color:#C1577A;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;padding:5px 14px;border-radius:999px;margin-bottom:20px;border:1px solid rgba(238,147,175,0.4);width:fit-content;">' + dados.categoria + '</div>'
          : '',

        // Título
        '<h2 style="font-family:Fredoka,Nunito,sans-serif;font-size:28px;font-weight:700;color:#3D2B33;line-height:1.2;margin:0 0 16px;">' + titulo + '</h2>',

        // Descrição
        '<p style="font-size:14px;color:#7a5a67;line-height:1.65;margin:0 0 28px;">' + desc + '</p>',

        // Imagem de capa
        dados.coverImg
          ? '<div style="border-radius:20px;overflow:hidden;flex:1;min-height:0;margin-bottom:28px;box-shadow:0 12px 32px -8px rgba(193,87,122,0.22);">' +
              '<img src="' + dados.coverImg + '" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous">' +
            '</div>'
          : '<div style="flex:1;min-height:0;margin-bottom:28px;border-radius:20px;background:linear-gradient(135deg,#fde8f0,#d5f5e9);"></div>',

        // Rodapé: CTA
        '<div style="background:linear-gradient(135deg,#EE93AF,#C1577A);border-radius:16px;padding:20px 24px;text-align:center;">',
          '<div style="color:rgba(255,255,255,0.85);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">🔗 Leia o artigo completo</div>',
          '<div style="color:#fff;font-size:13px;font-weight:800;">no link da bio</div>',
        '</div>',

      '</div>',
    ].join('');

    return wrapper;
  }

  // ---------- Gerar imagem PNG com html2canvas ----------

  function gerarImagem(callback) {
    var dados = getDadosArtigo();
    var card = criarCardDOM(dados);
    document.body.appendChild(card);

    // Aguardar imagem de capa carregar antes de capturar
    var imgEl = card.querySelector('img');
    function capturar() {
      window.html2canvas(card, {
        width: 540,
        height: 960,
        scale: 2,               // 2× para nitidez (1080×1920 final)
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#FAF0F4',
        logging: false,
      }).then(function (canvas) {
        document.body.removeChild(card);
        canvas.toBlob(function (blob) {
          callback(null, blob, canvas);
        }, 'image/png');
      }).catch(function (err) {
        document.body.removeChild(card);
        callback(err);
      });
    }

    if (imgEl) {
      if (imgEl.complete) {
        capturar();
      } else {
        imgEl.onload  = capturar;
        imgEl.onerror = capturar; // captura mesmo sem imagem
      }
    } else {
      capturar();
    }
  }

  // ---------- Estado do botão ----------

  function setBtnState(btn, estado) {
    var estados = {
      idle:      { text: btn.dataset.labelIdle    || 'Compartilhar no Instagram', disabled: false },
      loading:   { text: '⏳ Gerando card...',                                    disabled: true  },
      success:   { text: '✓ Card salvo! Poste nos Stories',                       disabled: false },
      error:     { text: '✗ Erro — tente novamente',                             disabled: false },
    };
    var e = estados[estado] || estados.idle;
    btn.querySelector('.story-btn-label').textContent = e.text;
    btn.disabled = e.disabled;
    btn.setAttribute('aria-busy', e.disabled ? 'true' : 'false');
  }

  // ---------- Fluxo principal ----------

  function compartilharStory(btn) {
    if (btn.disabled) return;
    setBtnState(btn, 'loading');

    carregarHtml2Canvas(function () {
      gerarImagem(function (err, blob, canvas) {
        if (err || !blob) {
          console.error('[story-card]', err);
          setBtnState(btn, 'error');
          setTimeout(function () { setBtnState(btn, 'idle'); }, 3000);
          return;
        }

        var dados = getDadosArtigo();
        var arquivo = new File([blob], 'dra-alana-story.png', { type: 'image/png' });

        // --- Celular com Web Share API ---
        var podeShareFile = navigator.share && navigator.canShare && navigator.canShare({ files: [arquivo] });
        var podeShare     = navigator.share;

        if (podeShareFile) {
          // Compartilha o arquivo diretamente (o usuário escolhe o app)
          navigator.share({
            files: [arquivo],
            title: dados.titulo,
            text:  'Leia o artigo completo no link da bio: ' + dados.url,
          }).then(function () {
            setBtnState(btn, 'success');
            setTimeout(function () { setBtnState(btn, 'idle'); }, 4000);
          }).catch(function (e) {
            // Usuário cancelou — volta ao idle silenciosamente
            if (e.name !== 'AbortError') console.warn('[story-card] share error', e);
            setBtnState(btn, 'idle');
          });
        } else if (podeShare) {
          // Web Share sem arquivo (iOS Safari antigo)
          navigator.share({
            title: dados.titulo,
            text:  'Leia no blog da Dra. Alana: ' + dados.url,
            url:   dados.url,
          }).then(function () {
            setBtnState(btn, 'success');
            setTimeout(function () { setBtnState(btn, 'idle'); }, 4000);
          }).catch(function () {
            setBtnState(btn, 'idle');
          });
        } else {
          // --- Desktop: download do PNG ---
          var link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = 'story-dra-alana.png';
          link.click();

          setBtnState(btn, 'success');
          setTimeout(function () { setBtnState(btn, 'idle'); }, 5000);
        }
      });
    });
  }

  // ---------- Inicializar botão ----------

  function iniciarStoryCard() {
    var btn = document.getElementById('btnCompartilharStory');
    if (!btn) return;

    btn.addEventListener('click', function () {
      compartilharStory(btn);
    });
  }

  document.addEventListener('DOMContentLoaded', iniciarStoryCard);

})();
