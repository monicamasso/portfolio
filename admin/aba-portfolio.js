/* =====================================================================
   ABA PORTFÓLIO: métricas das visitas e a tabela dos vídeos do site
   ===================================================================== */
(() => {
  const CAMPOS = ["titulo", "link", "nicho", "formato", "marca", "destaque", "ordem", "visivel", "exemplo"];
  /* Os nichos que o site já sabe agrupar (iguais aos do index.html) */
  const NICHOS_SITE = ["Moda", "Moda Praia", "Moda Fitness", "Fitness", "Beleza", "Skincare", "Haircare", "Acessórios",
    "Gastronomia", "Bebidas", "Home", "Tecnologia", "Finanças", "Imóveis", "Educação", "Negócios", "Saúde", "Bem-estar",
    "Promoções", "Varejo", "Presentes", "Entretenimento", "Casal", "Hospedagem", "Kids", "Pets"];

  let videos = [];
  let el = null;

  /* Lê as visitas dos últimos 14 dias, de mil em mil (o banco entrega no máximo mil por vez) */
  async function lerVisitas(desde) {
    let todas = [], de = 0;
    for (;;) {
      const lote = await P.ler("visitas", (q) => q.select("data,origem").gte("data", desde).order("data").range(de, de + 999));
      if (lote === null) return null;
      todas = todas.concat(lote);
      if (lote.length < 1000 || todas.length >= 100000) return todas;
      de += 1000;
    }
  }

  function numeros(visitas) {
    const reais = videos.filter((v) => !v.exemplo);
    const noAr = reais.filter((v) => v.visivel !== false);
    const hoje = P.hoje();
    const porNicho = {};
    noAr.forEach((v) => { if (v.nicho) porNicho[v.nicho] = (porNicho[v.nicho] || 0) + 1; });
    const nicho = Object.entries(porNicho).sort((a, b) => b[1] - a[1])[0];
    const porOrigem = {};
    (visitas || []).forEach((v) => { const o = v.origem || "Direto"; porOrigem[o] = (porOrigem[o] || 0) + 1; });
    const origem = Object.entries(porOrigem).sort((a, b) => b[1] - a[1])[0];
    const total = visitas ? visitas.length : 0;
    const deHoje = visitas ? visitas.filter((v) => P.iso(new Date(v.data)) === hoje).length : 0;
    const semVisitas = visitas === null ? "sem acesso" : "0";
    return `<div class="numeros">
      <div class="numero"><span>Visitas em 14 dias</span><strong>${visitas === null ? semVisitas : total}</strong></div>
      <div class="numero"><span>Visitas hoje</span><strong>${visitas === null ? semVisitas : deHoje}</strong></div>
      <div class="numero"><span>Vídeos no ar</span><strong>${noAr.length}</strong>${reais.length > noAr.length ? `<small>${P.plural(reais.length - noAr.length, "escondido", "escondidos")}</small>` : ""}</div>
      <div class="numero"><span>Nicho mais forte</span><strong title="${P.esc(nicho ? nicho[0] : "")}">${nicho ? P.esc(nicho[0]) : "Nenhum ainda"}</strong>${nicho ? `<small>${P.plural(nicho[1], "vídeo", "vídeos")}</small>` : ""}</div>
      <div class="numero"><span>De onde mais vêm</span><strong>${origem ? P.esc(origem[0]) : "Sem visitas"}</strong>${origem ? `<small>${Math.round(P.divide(origem[1], total) * 100)}% das visitas</small>` : ""}</div>
    </div>`;
  }

  function grafico(visitas, dias) {
    const total = visitas ? visitas.length : 0;
    if (!total) {
      return `<div class="vazio">Quando as pessoas começarem a visitar o seu portfólio, aqui aparece uma barrinha por dia mostrando quantas visitas chegaram nos últimos 14 dias.</div>`;
    }
    const conta = Object.fromEntries(dias.map((d) => [d, 0]));
    visitas.forEach((v) => { const d = P.iso(new Date(v.data)); if (d in conta) conta[d]++; });
    const maior = Math.max(1, ...Object.values(conta));
    const hoje = P.hoje();
    return `<div class="grafico" role="img" aria-label="Visitas por dia nos últimos 14 dias">
        ${dias.map((d) => `<div class="barra${d === hoje ? " hoje" : ""}" title="${P.dataBR(d)}: ${P.plural(conta[d], "visita", "visitas")}">
          <i style="height:${Math.max(1.5, (conta[d] / maior) * 88)}%"></i>${conta[d] ? `<b style="bottom:calc(${(conta[d] / maior) * 88}% + 2px);top:auto">${conta[d]}</b>` : ""}</div>`).join("")}
      </div>
      <div class="barra-dia">${dias.map((d) => `<span>${d === hoje ? "hoje" : P.diaMes(d)}</span>`).join("")}</div>`;
  }

  function origens(visitas) {
    const total = visitas ? visitas.length : 0;
    if (!total) return `<div class="vazio">Aqui vai aparecer por onde as pessoas chegam no seu site: Instagram, Google, WhatsApp ou direto pelo endereço.</div>`;
    const conta = {};
    visitas.forEach((v) => { const o = v.origem || "Direto"; conta[o] = (conta[o] || 0) + 1; });
    return `<div class="origens">${Object.entries(conta).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([o, n]) => {
      const pct = Math.round(P.divide(n, total) * 100);
      return `<div class="origem"><span>${P.esc(o)}</span><em>${n} · ${pct}%</em><div class="trilho"><i style="width:${pct}%"></i></div></div>`;
    }).join("")}</div>`;
  }

  function linhaVideo(v) {
    const id = P.youtubeId(v.link);
    const visivel = v.visivel !== false;
    return `<tr data-id="${v.id}" class="${visivel ? "" : "escondido"}">
      <td class="alca"><button type="button" class="bt bt-icone" aria-label="Arrastar para mudar a ordem (ou use as setas do teclado)" data-alca>${P.ic("alca", "ic-p")}</button></td>
      <td style="width:42px">${id ? `<img class="capinha" src="https://i.ytimg.com/vi/${P.esc(id)}/default.jpg" alt="" loading="lazy">` : `<span class="capinha"></span>`}</td>
      <td><div class="corta" style="max-width:260px"><b style="font-weight:500">${P.esc(v.titulo || "(sem título)")}</b>${P.seloExemplo(v)}</div>
        <div class="fraco corta" style="font-size:12px;max-width:260px">${v.link ? `<a href="${P.esc(v.link)}" target="_blank" rel="noopener">${P.esc(v.link.replace(/^https?:\/\/(www\.)?/, ""))}</a>` : "sem link"}</div>
        ${v.link && !id && !v.exemplo ? '<span class="pilula p-amarelo" style="margin-top:3px">não aparece no site: não é YouTube</span>' : ""}</td>
      <td>${P.esc(v.marca)}</td>
      <td>${v.nicho ? `<span class="pilula">${P.esc(v.nicho)}</span>` : ""}</td>
      <td class="fraco">${P.esc(v.formato)}</td>
      <td>${v.destaque ? `<span class="pilula p-rosa">${P.esc(v.destaque)}</span>` : ""}</td>
      <td class="acoes">
        <button type="button" class="bt bt-icone" data-olho aria-label="${visivel ? "Esconder do site" : "Mostrar no site"}" title="${visivel ? "Aparece no site. Clique para esconder" : "Escondido do site. Clique para mostrar"}">${P.ic(visivel ? "olho" : "olhoFechado")}</button>
        <button type="button" class="bt bt-icone" data-editar aria-label="Editar">${P.ic("editar")}</button>
        <button type="button" class="bt bt-icone" data-apagar aria-label="Apagar">${P.ic("lixo")}</button>
      </td>
    </tr>`;
  }

  function tabela() {
    const reais = videos.filter((v) => !v.exemplo);
    const convite = !reais.length ? `<div class="faixa faixa-info" style="margin-bottom:12px">${P.ic("alerta")}<div>
        Enquanto esta tabela não tiver vídeos de verdade, o seu site continua mostrando a lista que já estava nele.
        Para passar a controlar tudo daqui, traga essa lista de uma vez:
        <div style="margin-top:8px"><button type="button" class="bt" data-importar>${P.ic("importar", "ic-p")}Trazer os vídeos que já estão no site</button></div></div></div>` : "";
    return `${convite}<div class="tabela-rolagem"><table class="tabela">
      <thead><tr><th></th><th></th><th>Vídeo</th><th>Marca</th><th>Nicho</th><th>Formato</th><th>Destaque</th><th></th></tr></thead>
      <tbody id="corpoVideos">${videos.map(linhaVideo).join("") || `<tr><td colspan="8" class="vazio">Nenhum vídeo ainda. Clique em "Adicionar vídeo".</td></tr>`}</tbody>
    </table></div>`;
  }

  function desenharTabela() {
    P.$("#caixaVideos", el).innerHTML = `<div class="caixa-titulo"><h2>Meus vídeos</h2><span class="ajuda">Arraste pela alcinha para mudar a ordem no site</span></div>` + tabela();
    ligarArrastar();
  }

  /* ---------- Adicionar e editar ---------- */
  function abrirForm(v = null) {
    const formatos = [...new Set(videos.map((x) => x.formato).filter(Boolean))].sort();
    const nichos = [...new Set([...NICHOS_SITE, ...videos.map((x) => x.nicho).filter(Boolean)])].sort((a, b) => a.localeCompare(b, "pt"));
    P.formulario({
      titulo: v ? "Editar vídeo" : "Adicionar vídeo",
      valores: v || { visivel: true },
      campos: [
        { n: "titulo", r: "Título", obrig: true },
        { n: "link", r: "Link do vídeo", ajuda: "Link do YouTube (Shorts ou normal). O site só mostra vídeos do YouTube." },
        { n: "marca", r: "Marca", meia: true },
        { n: "nicho", r: "Nicho", meia: true, lista: nichos, ajuda: "Escolha um da lista para cair no grupo certo do site." },
        { n: "formato", r: "Formato", meia: true, lista: formatos, ajuda: "Ex: Review, Unboxing, Storytelling" },
        { n: "destaque", r: "Destaque", meia: true, ajuda: "Ex: 2,4M views" },
        { n: "visivel", r: "Mostrar no site", tipo: "caixinha" }
      ],
      salvar: async (dados) => {
        if (dados.link && !P.youtubeId(dados.link)) P.toast("Salvo, mas esse link não é do YouTube, então não aparece no site", true);
        if (!v) dados.ordem = videos.length ? Math.min(...videos.map((x) => P.num(x.ordem))) - 1 : 0;
        const ok = await P.gravar("videos", dados, v ? v.id : null);
        if (ok) { P.toast(v ? "Vídeo atualizado" : "Vídeo adicionado"); await recarregar(); }
        return ok;
      },
      apagar: v ? async () => { const ok = await P.apagar("videos", v.id, "Apagar este vídeo? Ele sai do site também."); if (ok) await recarregar(); return ok; } : null
    });
  }

  /* ---------- Trazer a lista fixa que está no index.html ---------- */
  async function importar() {
    try {
      const html = await (await fetch("../index.html", { cache: "no-store" })).text();
      const bloco = (html.match(/(?:const|let) VIDEOS = \[([\s\S]*?)\n\];/) || [])[1] || "";
      const re = /\{\s*id:\s*"([^"]+)",\s*marca:\s*"([^"]*)",\s*nicho:\s*"([^"]*)",\s*tipo:\s*"([^"]*)"(?:,\s*data:\s*"([^"]*)")?(,\s*ultimo:\s*true)?/g;
      const lista = [];
      let m, i = 0;
      while ((m = re.exec(bloco))) lista.push({ id: m[1], marca: m[2], nicho: m[3], tipo: m[4], data: m[5] || "", ultimo: !!m[6], i: i++ });
      if (!lista.length) { P.toast("Não encontrei a lista de vídeos no site", true); return; }
      if (!confirm(`Encontrei ${lista.length} vídeos no seu site. Trazer todos para esta tabela?`)) return;
      /* Mesma ordem que o site usa hoje: do mais recente para o mais antigo */
      lista.sort((a, b) => (a.ultimo - b.ultimo) || b.data.localeCompare(a.data) || a.i - b.i);
      const linhas = lista.map((v, n) => ({
        titulo: `${v.tipo} · ${v.marca}`, link: `https://youtube.com/shorts/${v.id}`,
        marca: v.marca, nicho: v.nicho, formato: v.tipo, destaque: "", ordem: n, visivel: true
      }));
      const ok = await P.gravar("videos", linhas);
      if (ok) { P.toast(`${lista.length} vídeos trazidos`); await recarregar(); }
    } catch (e) {
      P.toast("Não consegui ler a lista do site agora", true);
    }
  }

  /* ---------- Arrastar pela alcinha (mouse, dedo ou teclado) ---------- */
  async function salvarOrdem() {
    const ids = P.$$("#corpoVideos tr[data-id]", el).map((tr) => Number(tr.dataset.id));
    const mudou = [];
    ids.forEach((id, n) => { const v = videos.find((x) => x.id === id); if (v && P.num(v.ordem) !== n) { v.ordem = n; mudou.push([id, n]); } });
    if (!mudou.length) return;
    videos.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    const res = await Promise.all(mudou.map(([id, n]) => P.gravar("videos", { ordem: n }, id)));
    P.toast(res.every(Boolean) ? "Ordem salva" : "Parte da ordem não foi salva", !res.every(Boolean));
  }
  function ligarArrastar() {
    const corpo = P.$("#corpoVideos", el);
    if (!corpo) return;
    corpo.addEventListener("pointerdown", (e) => {
      const alca = e.target.closest("[data-alca]");
      if (!alca || (e.pointerType === "mouse" && e.button !== 0)) return;
      e.preventDefault();
      const tr = alca.closest("tr");
      tr.classList.add("arrastando");
      alca.setPointerCapture(e.pointerId);
      const mover = (ev) => {
        const alvo = document.elementFromPoint(ev.clientX, ev.clientY);
        const linha = alvo && alvo.closest("#corpoVideos tr[data-id]");
        if (!linha || linha === tr) return;
        const r = linha.getBoundingClientRect();
        corpo.insertBefore(tr, ev.clientY > r.top + r.height / 2 ? linha.nextSibling : linha);
      };
      const soltar = () => {
        alca.removeEventListener("pointermove", mover);
        alca.removeEventListener("pointerup", soltar);
        alca.removeEventListener("pointercancel", soltar);
        tr.classList.remove("arrastando");
        salvarOrdem();
      };
      alca.addEventListener("pointermove", mover);
      alca.addEventListener("pointerup", soltar);
      alca.addEventListener("pointercancel", soltar);
    });
    corpo.addEventListener("keydown", (e) => {
      const alca = e.target.closest("[data-alca]");
      if (!alca || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      e.preventDefault();
      const tr = alca.closest("tr");
      const vizinho = e.key === "ArrowUp" ? tr.previousElementSibling : tr.nextElementSibling;
      if (!vizinho) return;
      corpo.insertBefore(tr, e.key === "ArrowUp" ? vizinho : vizinho.nextSibling);
      alca.focus();
      salvarOrdem();
    });
  }

  async function recarregar() {
    const lidos = await P.ler("videos", (q) => q.select("*").order("ordem", { ascending: true }).order("id", { ascending: true }));
    videos = lidos || [];
    P.conferirCampos("videos", videos, CAMPOS);
    desenharTabela();
    const n = P.$("#numerosPortfolio", el);
    if (n && P._ultimasVisitas !== undefined) n.innerHTML = numeros(P._ultimasVisitas);
  }

  P.abas.portfolio = {
    titulo: "Portfólio",
    async montar(alvo) {
      el = alvo;
      P.acoes(`<button type="button" class="bt bt-rosa" id="btNovoVideo">${P.ic("mais", "ic-p")}Adicionar vídeo</button>`);
      P.$("#btNovoVideo").addEventListener("click", () => abrirForm());

      const dias = Array.from({ length: 14 }, (_, i) => P.somarDias(P.hoje(), i - 13));
      const desde = P.paraData(dias[0]).toISOString();
      const [lidos, visitas] = await Promise.all([
        P.ler("videos", (q) => q.select("*").order("ordem", { ascending: true }).order("id", { ascending: true })),
        lerVisitas(desde)
      ]);
      videos = lidos || [];
      P._ultimasVisitas = visitas;
      P.conferirCampos("videos", videos, CAMPOS);

      el.innerHTML = `
        <div id="numerosPortfolio">${numeros(visitas)}</div>
        <div class="duas-colunas">
          <div class="caixa"><div class="caixa-titulo"><h2>Visitas nos últimos 14 dias</h2></div>${grafico(visitas, dias)}</div>
          <div class="caixa"><div class="caixa-titulo"><h2>Por onde chegaram</h2><span class="ajuda">14 dias</span></div>${origens(visitas)}</div>
        </div>
        <div class="caixa" id="caixaVideos"></div>`;
      desenharTabela();

      el.addEventListener("click", async (e) => {
        if (e.target.closest("[data-importar]")) return importar();
        const tr = e.target.closest("#corpoVideos tr[data-id]");
        if (!tr) return;
        const v = videos.find((x) => x.id === Number(tr.dataset.id));
        if (!v) return;
        if (e.target.closest("[data-editar]")) abrirForm(v);
        else if (e.target.closest("[data-apagar]")) { if (await P.apagar("videos", v.id, "Apagar este vídeo? Ele sai do site também.")) recarregar(); }
        else if (e.target.closest("[data-olho]")) {
          const novo = v.visivel === false;
          if (await P.gravar("videos", { visivel: novo }, v.id)) { P.toast(novo ? "Agora aparece no site" : "Escondido do site"); recarregar(); }
        }
      });
    }
  };
})();
