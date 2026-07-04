// ---------- Credenciais (lista simples de textos) ----------
const listaCredenciais = document.getElementById("listaCredenciais");

function criarItemCredencial(valor = "") {
  const div = document.createElement("div");
  div.className = "item-repetivel";
  div.innerHTML = `
    <input type="text" class="campo-credencial" value="${escaparAtributo(valor)}">
    <button type="button" class="botao-remover" title="Remover">✕</button>
  `;
  div.querySelector(".botao-remover").addEventListener("click", () => div.remove());
  return div;
}

document.querySelectorAll("#listaCredenciais .botao-remover").forEach((btn) => {
  btn.addEventListener("click", () => btn.closest(".item-repetivel").remove());
});

document.querySelector('[data-add="credencial"]').addEventListener("click", () => {
  listaCredenciais.appendChild(criarItemCredencial());
});

// ---------- Serviços ----------
const ICONES_DISPONIVEIS = ["mamadeira", "escova", "dente", "escudo", "aparelho", "estrela"];

function criarCartaoServico(dados = {}) {
  const div = document.createElement("div");
  div.className = "cartao-repetivel";
  div.dataset.tipo = "servico";
  const opcoesIcones = ICONES_DISPONIVEIS.map(
    (ic) => `<option value="${ic}" ${ic === dados.icone ? "selected" : ""}>${ic}</option>`
  ).join("");
  div.innerHTML = `
    <div class="linha-campos">
      <div class="campo-admin">
        <label>Título</label>
        <input type="text" class="s-titulo" value="${escaparAtributo(dados.titulo || "")}">
      </div>
      <div class="campo-admin">
        <label>Ícone</label>
        <select class="s-icone">${opcoesIcones}</select>
      </div>
    </div>
    <div class="campo-admin">
      <label>Descrição</label>
      <textarea class="s-descricao" rows="2">${escaparTexto(dados.descricao || "")}</textarea>
    </div>
    <button type="button" class="botao-remover-cartao">Remover serviço</button>
  `;
  div.querySelector(".botao-remover-cartao").addEventListener("click", () => div.remove());
  return div;
}

document.querySelectorAll('#listaServicos .botao-remover-cartao').forEach((btn) => {
  btn.addEventListener("click", () => btn.closest(".cartao-repetivel").remove());
});
document.querySelector('[data-add="servico"]').addEventListener("click", () => {
  document.getElementById("listaServicos").appendChild(criarCartaoServico());
});

// ---------- Diferenciais ----------
function criarCartaoDiferencial(dados = {}) {
  const div = document.createElement("div");
  div.className = "cartao-repetivel";
  div.dataset.tipo = "diferencial";
  div.innerHTML = `
    <div class="campo-admin">
      <label>Título</label>
      <input type="text" class="d-titulo" value="${escaparAtributo(dados.titulo || "")}">
    </div>
    <div class="campo-admin">
      <label>Descrição</label>
      <textarea class="d-descricao" rows="2">${escaparTexto(dados.descricao || "")}</textarea>
    </div>
    <button type="button" class="botao-remover-cartao">Remover</button>
  `;
  div.querySelector(".botao-remover-cartao").addEventListener("click", () => div.remove());
  return div;
}
document.querySelectorAll('#listaDiferenciais .botao-remover-cartao').forEach((btn) => {
  btn.addEventListener("click", () => btn.closest(".cartao-repetivel").remove());
});
document.querySelector('[data-add="diferencial"]').addEventListener("click", () => {
  document.getElementById("listaDiferenciais").appendChild(criarCartaoDiferencial());
});

// ---------- Depoimentos ----------
function criarCartaoDepoimento(dados = {}) {
  const div = document.createElement("div");
  div.className = "cartao-repetivel";
  div.dataset.tipo = "depoimento";
  div.innerHTML = `
    <div class="campo-admin">
      <label>Assinatura</label>
      <input type="text" class="dep-nome" value="${escaparAtributo(dados.nome || "")}">
    </div>
    <div class="campo-admin">
      <label>Depoimento</label>
      <textarea class="dep-texto" rows="2">${escaparTexto(dados.texto || "")}</textarea>
    </div>
    <button type="button" class="botao-remover-cartao">Remover</button>
  `;
  div.querySelector(".botao-remover-cartao").addEventListener("click", () => div.remove());
  return div;
}
document.querySelectorAll('#listaDepoimentos .botao-remover-cartao').forEach((btn) => {
  btn.addEventListener("click", () => btn.closest(".cartao-repetivel").remove());
});
document.querySelector('[data-add="depoimento"]').addEventListener("click", () => {
  document.getElementById("listaDepoimentos").appendChild(criarCartaoDepoimento());
});

// ---------- FAQ ----------
function criarCartaoFaq(dados = {}) {
  const div = document.createElement("div");
  div.className = "cartao-repetivel";
  div.dataset.tipo = "faq";
  div.innerHTML = `
    <div class="campo-admin">
      <label>Pergunta</label>
      <input type="text" class="faq-pergunta" value="${escaparAtributo(dados.pergunta || "")}">
    </div>
    <div class="campo-admin">
      <label>Resposta</label>
      <textarea class="faq-resposta" rows="2">${escaparTexto(dados.resposta || "")}</textarea>
    </div>
    <button type="button" class="botao-remover-cartao">Remover</button>
  `;
  div.querySelector(".botao-remover-cartao").addEventListener("click", () => div.remove());
  return div;
}
document.querySelectorAll('#listaFaq .botao-remover-cartao').forEach((btn) => {
  btn.addEventListener("click", () => btn.closest(".cartao-repetivel").remove());
});
document.querySelector('[data-add="faq"]').addEventListener("click", () => {
  document.getElementById("listaFaq").appendChild(criarCartaoFaq());
});

// ---------- Utilidades ----------
function escaparAtributo(texto) {
  return String(texto).replace(/"/g, "&quot;");
}
function escaparTexto(texto) {
  const div = document.createElement("div");
  div.textContent = String(texto);
  return div.innerHTML;
}

// ---------- Serialização antes do envio ----------
const formPrincipal = document.getElementById("formPrincipal");

formPrincipal.addEventListener("submit", () => {
  // Credenciais
  const credenciais = Array.from(document.querySelectorAll(".campo-credencial"))
    .map((i) => i.value.trim())
    .filter(Boolean);
  document.getElementById("hiddenCredenciais").value = JSON.stringify(credenciais);

  // Serviços
  const servicos = Array.from(document.querySelectorAll('#listaServicos .cartao-repetivel')).map((el) => ({
    titulo: el.querySelector(".s-titulo").value.trim(),
    descricao: el.querySelector(".s-descricao").value.trim(),
    icone: el.querySelector(".s-icone").value,
  }));
  document.getElementById("hiddenServicos").value = JSON.stringify(servicos);

  // Diferenciais
  const diferenciais = Array.from(document.querySelectorAll('#listaDiferenciais .cartao-repetivel')).map((el) => ({
    titulo: el.querySelector(".d-titulo").value.trim(),
    descricao: el.querySelector(".d-descricao").value.trim(),
  }));
  document.getElementById("hiddenDiferenciais").value = JSON.stringify(diferenciais);

  // Depoimentos
  const depoimentos = Array.from(document.querySelectorAll('#listaDepoimentos .cartao-repetivel')).map((el) => ({
    nome: el.querySelector(".dep-nome").value.trim(),
    texto: el.querySelector(".dep-texto").value.trim(),
  }));
  document.getElementById("hiddenDepoimentos").value = JSON.stringify(depoimentos);

  // FAQ
  const faq = Array.from(document.querySelectorAll('#listaFaq .cartao-repetivel')).map((el) => ({
    pergunta: el.querySelector(".faq-pergunta").value.trim(),
    resposta: el.querySelector(".faq-resposta").value.trim(),
  }));
  document.getElementById("hiddenFaq").value = JSON.stringify(faq);
});
