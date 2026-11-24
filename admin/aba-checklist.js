/* =====================================================================
   ABA CHECKLIST PORTFÓLIO
   Todo o conteúdo vem de js/biblioteca.js (window.Biblioteca), sem mudar
   uma vírgula. O que você marca fica salvo na tabela "marcados".
   ===================================================================== */
(() => {
  const SUBS = [
    ["checklist", "Checklist do portfólio"],
    ["referencias", "Referências de vídeo"],
    ["roteiros", "Roteiros"],
    ["nichos", "Ideias por nicho"],
    ["revisar", "Revisar meu roteiro"]
  ];
  let sub = "checklist", marcados = new Set(), abertas = new Set(), semTabela = false, el = null;
  const B = () => window.Biblioteca || {};
  const lista = (k) => (Array.isArray(B()[k]) ? B()[k] : []);
  const pct = (a, b) => Math.round(P.divide(a, b) * 100);

  /* ---------- Salvar marcação ---------- */
  async function marcar(chave, sim) {
    if (sim) marcados.add(chave); else marcados.delete(chave);
    if (semTabela) return;
    try {
      const { error } = await banco.from("marcados").upsert({ chave, marcado: sim, atualizado_em: new Date().toISOString() });
      if (error) throw error;
    } catch (e) {
      P.toast(P.erroAmigavel(e, "marcados"), true);
    }
  }

  const sanfona = (id, topo, corpo) => `<div class="sanfona${abertas.has(id) ? " aberta" : ""}" data-sanfona="${P.esc(id)}">
      <button type="button" class="sanfona-topo" aria-expanded="${abertas.has(id)}">${topo}<span class="gira">${P.ic("baixo")}</span></button>
      <div class="sanfona-corpo"${abertas.has(id) ? "" : " hidden"}>${corpo}</div></div>`;

  const itemCheck = (chave, t, d) => `<label class="item${marcados.has(chave) ? " feito" : ""}">
      <input type="checkbox" data-chave="${P.esc(chave)}"${marcados.has(chave) ? " checked" : ""}>
      <div><b>${P.esc(t)}</b>${d ? `<span>${P.esc(d)}</span>` : ""}</div></label>`;

  /* ---------- 1. Checklist do portfólio ---------- */
  function vChecklist() {
    const secoes = lista("CHECKLIST");
    if (!secoes.length) return semConteudo();
    const chavesDe = (s) => (s.itens || []).map((_, i) => `checklist:${s.id}:${i}`);
    const total = secoes.reduce((n, s) => n + (s.itens || []).length, 0);
    const feitos = secoes.reduce((n, s) => n + chavesDe(s).filter((k) => marcados.has(k)).length, 0);
    return `<div class="caixa geral"><strong>${pct(feitos, total)}% pronto</strong>
        <div class="progresso"><i style="width:${pct(feitos, total)}%"></i></div>
        <span class="ajuda">${feitos} de ${total} itens</span></div>
      <div>${secoes.map((s) => {
        const ch = chavesDe(s), f = ch.filter((k) => marcados.has(k)).length;
        return sanfona("c:" + s.id,
          `<span class="emoji">${P.esc(s.emoji)}</span><div><h3>${P.esc(s.nome)}</h3><p>${P.esc(s.resumo)}</p></div>
           <span class="mini"><span class="progresso"><i style="width:${pct(f, ch.length)}%"></i></span></span><span class="conta">${f}/${ch.length}</span>`,
          `<p class="porque"><b>Por que:</b> ${P.esc(s.porque)}</p>
           <div class="itens">${(s.itens || []).map((it, i) => itemCheck(ch[i], it.t, it.d)).join("")}</div>`);
      }).join("")}</div>`;
  }

  /* ---------- 2. Referências de vídeo ---------- */
  function vReferencias() {
    const refs = lista("REFERENCIAS");
    if (!refs.length) return semConteudo();
    return `<div class="refs">${refs.map((r, i) => `
      <button type="button" class="ref" data-ref="${i}">
        <span class="ref-capa c-${P.esc(r.cor)}"><span class="emoji">${P.esc(r.emoji)}</span>${r.duracao ? `<span class="tempo">${P.esc(r.duracao)}</span>` : ""}</span>
        <span class="ref-corpo"><b>${P.esc(r.titulo)}</b><span>${P.esc(r.estilo)}${r.marca ? " · " + P.esc(r.marca) : ""}</span></span>
      </button>`).join("")}</div>`;
  }
  function fichaReferencia(r) {
    const sec = (titulo, texto, cls = "") => (texto ? `<div><h4>${titulo}</h4><p class="${cls}">${P.esc(texto)}</p></div>` : "");
    const f = P.janela({
      titulo: `${P.esc(r.emoji)} ${P.esc(r.titulo)}`,
      larga: true,
      corpo: `<div class="ficha">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${[r.estilo, r.audiencia, r.duracao, r.marca].filter(Boolean).map((x) => `<span class="pilula">${P.esc(x)}</span>`).join("")}
          </div>
          ${sec("O gancho", r.gancho, "gancho")}
          ${sec("Por que funciona", r.porque)}
          ${sec("O diferencial", r.diferencial)}
          ${sec("O erro comum", r.erro)}
          ${(r.roteiro || []).length ? `<div><h4>O roteiro</h4><div class="blocos">${r.roteiro.map((b) => `<div class="bloco"><span class="tempo">${P.esc(b.t)}</span><p>${P.textoRico(b.o)}</p></div>`).join("")}</div></div>` : ""}
        </div>`,
      pe: r.youtube ? `<div class="direita"><a class="bt bt-rosa" href="${P.esc(r.youtube)}" target="_blank" rel="noopener">${P.ic("play", "ic-p")}Assistir</a></div>` : ""
    });
    return f;
  }

  /* ---------- 3. Roteiros ---------- */
  function vRoteiros() {
    const tipos = lista("TIPOS");
    if (!tipos.length) return semConteudo();
    return tipos.map((t) => sanfona("t:" + t.id,
      `<span class="emoji">${P.esc(t.emoji)}</span><div><h3>${P.esc(t.nome)}</h3><p>${P.esc(t.duracao)}</p></div><span></span>`,
      `<p class="porque"><b>Quando usar:</b> ${P.esc(t.porque)}</p>
       <div class="blocos">${(t.beats || []).map((b) => `<div class="bloco"><span class="tempo">${P.esc(b.t)}</span><p>${P.textoRico(b.o)}</p></div>`).join("")}</div>
       ${(t.erros || []).length ? `<div><h4 style="font-size:12px;color:var(--gray);margin:4px 0">Erros comuns</h4><ul class="lista-simples">${t.erros.map((e) => `<li>${P.esc(e)}</li>`).join("")}</ul></div>` : ""}`
    )).join("");
  }

  /* ---------- 4. Ideias por nicho ---------- */
  function vNichos() {
    const nichos = lista("NICHOS");
    if (!nichos.length) return semConteudo();
    const como = lista("COMO_USAR");
    return `${como.length ? `<div class="caixa"><div class="caixa-titulo"><h2>Como usar os ganchos</h2></div><ul class="lista-simples">${como.map((c) => `<li>${P.esc(c)}</li>`).join("")}</ul></div>` : ""}
      <div class="nichos">${nichos.map((n) => `<div class="caixa">
        <div class="caixa-titulo"><span style="font-size:18px">${P.esc(n.emoji)}</span><h2>${P.esc(n.nome)}</h2></div>
        ${(n.ideias || []).map((i) => `<div class="ideia"><b>${P.esc(i.t)}</b>${i.gancho ? `<span>${P.esc(i.gancho)}</span>` : ""}</div>`).join("")}
      </div>`).join("")}</div>`;
  }

  /* ---------- 5. Revisar meu roteiro ---------- */
  function vRevisar() {
    const blocos = lista("REVISAO");
    const chaves = blocos.flatMap((b, bi) => (b.itens || []).map((_, i) => `revisao:${bi}:${i}`));
    const feitos = chaves.filter((k) => marcados.has(k)).length;
    let rascunho = "";
    try { rascunho = localStorage.getItem("painel-roteiro") || ""; } catch (e) { /* sem rascunho */ }
    return `<div class="caixa"><div class="caixa-titulo"><h2>Cole aqui o seu roteiro</h2><span class="ajuda">Fica guardado neste navegador</span></div>
        <textarea class="roteiro-campo" id="campoRoteiro" placeholder="Cole o roteiro e confira item por item embaixo">${P.esc(rascunho)}</textarea></div>
      ${blocos.length ? `<div class="caixa geral"><strong>${feitos} de ${chaves.length}</strong>
        <div class="progresso"><i style="width:${pct(feitos, chaves.length)}%"></i></div>
        <button type="button" class="bt" id="limparRevisao" style="height:30px">Desmarcar tudo</button></div>
      ${blocos.map((b, bi) => `<div class="caixa"><div class="caixa-titulo"><span style="font-size:18px">${P.esc(b.emoji)}</span><h2>${P.esc(b.bloco)}</h2></div>
        <div class="itens">${(b.itens || []).map((it, i) => itemCheck(`revisao:${bi}:${i}`, it.t, it.d)).join("")}</div></div>`).join("")}` : semConteudo()}`;
  }

  function semConteudo() {
    return `<div class="caixa vazio">O conteúdo da biblioteca não carregou. Confira se o arquivo js/biblioteca.js está no projeto e recarregue a página.</div>`;
  }

  function desenhar() {
    const vistas = { checklist: vChecklist, referencias: vReferencias, roteiros: vRoteiros, nichos: vNichos, revisar: vRevisar };
    P.$("#subAbas", el).innerHTML = SUBS.map(([v, t]) => `<button type="button" role="tab" class="sub-aba" data-sub="${v}" aria-selected="${sub === v}">${t}</button>`).join("");
    P.$("#conteudoSub", el).innerHTML = vistas[sub]();
  }

  P.abas.checklist = {
    titulo: "Checklist Portfólio",
    async montar(alvo) {
      el = alvo;
      if (!abertas.size) { const p = lista("CHECKLIST")[0]; if (p) abertas.add("c:" + p.id); }
      if (!window.Biblioteca) P.avisar("biblioteca", "O arquivo js/biblioteca.js não carregou, então o conteúdo do checklist não aparece.");
      const lidos = await P.ler("marcados", (q) => q.select("chave,marcado"));
      semTabela = lidos === null;
      marcados = new Set((lidos || []).filter((m) => m.marcado !== false).map((m) => m.chave));
      if (semTabela) P.avisar("marcados-local", "Sem a tabela \"marcados\", o que você marcar no checklist não fica salvo depois de fechar o painel.");

      el.innerHTML = `<div class="sub-abas" role="tablist" id="subAbas"></div><div id="conteudoSub" style="display:grid;grid-template-columns:minmax(0,1fr);gap:12px"></div>`;
      desenhar();

      el.addEventListener("click", (e) => {
        const s = e.target.closest("[data-sub]");
        if (s) { sub = s.dataset.sub; return desenhar(); }
        const topo = e.target.closest(".sanfona-topo");
        if (topo) {
          const caixa = topo.closest(".sanfona"), id = caixa.dataset.sanfona;
          const abrir = !abertas.has(id);
          if (abrir) abertas.add(id); else abertas.delete(id);
          caixa.classList.toggle("aberta", abrir);
          topo.setAttribute("aria-expanded", abrir);
          caixa.querySelector(".sanfona-corpo").hidden = !abrir;
          return;
        }
        const r = e.target.closest("[data-ref]");
        if (r) return fichaReferencia(lista("REFERENCIAS")[Number(r.dataset.ref)]);
        if (e.target.closest("#limparRevisao")) {
          const ligados = [...marcados].filter((k) => k.startsWith("revisao:"));
          ligados.forEach((k) => marcar(k, false));
          desenhar();
        }
      });
      el.addEventListener("change", async (e) => {
        const c = e.target.closest("[data-chave]");
        if (!c) return;
        marcar(c.dataset.chave, c.checked); /* salva no banco em segundo plano */
        /* atualiza as barrinhas sem fechar o que está aberto */
        const rolagem = window.scrollY;
        desenhar();
        window.scrollTo(0, rolagem);
      });
      el.addEventListener("input", (e) => {
        if (e.target.id === "campoRoteiro") { try { localStorage.setItem("painel-roteiro", e.target.value); } catch (er) { /* ok */ } }
      });
    }
  };
})();
