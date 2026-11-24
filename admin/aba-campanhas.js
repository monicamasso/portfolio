/* =====================================================================
   ABA CAMPANHAS: os seus trabalhos com marcas
   ===================================================================== */
(() => {
  const CAMPOS = ["campanha", "cliente", "tipo", "status", "qtd", "valor", "prazo", "pagamento", "ativa", "favorita"];
  /* A ordem do funil. Ordenar por status segue ESTA ordem, nunca a alfabética. */
  const FUNIL = ["Briefing", "Roteiro", "Aprovação Roteiro", "Gravação", "Edição", "Aprovado", "Entregue"];
  const COR_STATUS = { "Briefing": "p-cinza", "Roteiro": "p-azul", "Aprovação Roteiro": "p-amarelo", "Gravação": "p-rosa", "Edição": "p-roxo", "Aprovado": "p-verde", "Entregue": "p-verde p-bolinha" };
  const COR_TIPO = { "Conteúdo": "p-azul", "Publicidade": "p-roxo" };

  let camps = [], nomesMarcas = [], filtro = "todas", busca = "", ordem = { col: "prazo", dir: 1 }, el = null;

  const COLUNAS = [
    { c: "favorita", t: "", val: (x) => (x.favorita ? 0 : 1) },
    { c: "campanha", t: "Campanha", val: (x) => P.normal(x.campanha) },
    { c: "cliente", t: "Cliente", val: (x) => P.normal(x.cliente) },
    { c: "tipo", t: "Tipo", val: (x) => P.normal(x.tipo) },
    { c: "status", t: "Status", val: (x) => { const i = FUNIL.indexOf(x.status); return i < 0 ? 99 : i; } },
    { c: "qtd", t: "Qtd", val: (x) => P.num(x.qtd), num: true },
    { c: "valor", t: "Valor", val: (x) => P.num(x.valor), num: true },
    { c: "prazo", t: "Prazo", val: (x) => x.prazo || null },
    { c: "pagamento", t: "Pagamento", val: (x) => (x.pagamento === "pago" ? 1 : 0) }
  ];

  function lista() {
    const b = P.normal(busca);
    const col = COLUNAS.find((c) => c.c === ordem.col) || COLUNAS[7];
    return camps
      .filter((x) => filtro === "todas" || (filtro === "ativas" ? x.ativa !== false : x.ativa === false))
      .filter((x) => !b || P.normal(x.campanha).includes(b) || P.normal(x.cliente).includes(b))
      .sort((a, z) => {
        const va = col.val(a), vz = col.val(z);
        /* sem prazo vai sempre para o fim, nos dois sentidos */
        if (va === null || vz === null) return va === vz ? 0 : va === null ? 1 : -1;
        const r = typeof va === "number" ? va - vz : String(va).localeCompare(String(vz), "pt");
        return r * ordem.dir || P.num(a.id) - P.num(z.id);
      });
  }

  function etiquetaPrazo(x) {
    if (!x.prazo || x.status === "Entregue") return "";
    const d = P.diasAte(x.prazo);
    if (d < 0) return ` <span class="pilula p-vermelho">atrasada ${P.plural(-d, "dia", "dias")}</span>`;
    if (d === 0) return ' <span class="pilula p-amarelo">vence hoje</span>';
    if (d === 1) return ' <span class="pilula p-amarelo">vence amanhã</span>';
    if (d <= 3) return ` <span class="pilula p-amarelo">vence em ${d} dias</span>`;
    return "";
  }

  function linha(x) {
    return `<tr class="clicavel${x.favorita ? " favorita" : ""}" data-id="${x.id}">
      <td style="width:36px"><button type="button" class="bt bt-icone estrela${x.favorita ? " ligada" : ""}" data-estrela aria-label="${x.favorita ? "Tirar destaque" : "Destacar campanha"}" aria-pressed="${!!x.favorita}">${P.ic("estrela", "ic-p")}</button></td>
      <td><b style="font-weight:500">${P.esc(x.campanha || "(sem nome)")}</b>${P.seloExemplo(x)}${x.ativa === false ? ' <span class="pilula">finalizada</span>' : ""}</td>
      <td>${P.esc(x.cliente)}</td>
      <td><span class="pilula ${COR_TIPO[x.tipo] || ""}">${P.esc(x.tipo)}</span></td>
      <td><span class="pilula ${COR_STATUS[x.status] || ""}">${P.esc(x.status)}</span></td>
      <td class="num">${P.num(x.qtd)}</td>
      <td class="num">${P.moeda(x.valor)}</td>
      <td style="white-space:nowrap">${x.prazo ? P.dataBR(x.prazo) : '<span class="fraco">sem prazo</span>'}${etiquetaPrazo(x)}</td>
      <td><button type="button" class="pilula ${x.pagamento === "pago" ? "p-verde" : "p-amarelo"}" style="border:0;cursor:pointer" data-pagamento title="Clique para trocar">${x.pagamento === "pago" ? "Pago" : "Pendente"}</button></td>
    </tr>`;
  }

  function numeros() {
    const reais = camps.filter((x) => !x.exemplo);
    const ativas = reais.filter((x) => x.ativa !== false).length;
    const total = reais.reduce((s, x) => s + P.num(x.valor), 0);
    const videos = reais.reduce((s, x) => s + P.num(x.qtd), 0);
    const recebido = reais.filter((x) => x.pagamento === "pago").reduce((s, x) => s + P.num(x.valor), 0);
    const receber = reais.filter((x) => x.pagamento !== "pago").reduce((s, x) => s + P.num(x.valor), 0);
    return `<div class="numeros">
      <div class="numero"><span>Campanhas</span><strong>${reais.length}</strong></div>
      <div class="numero"><span>Ativas</span><strong>${ativas}</strong></div>
      <div class="numero"><span>Valor total</span><strong>${P.moeda(total)}</strong><small>ticket médio por vídeo ${P.moeda(P.divide(total, videos))}</small></div>
      <div class="numero"><span>A receber</span><strong>${P.moeda(receber)}</strong><small>já recebido ${P.moeda(recebido)}</small></div>
    </div>`;
  }

  function desenhar() {
    P.$("#numerosCamp", el).innerHTML = numeros();
    const conta = { todas: camps.length, ativas: camps.filter((x) => x.ativa !== false).length, finalizadas: camps.filter((x) => x.ativa === false).length };
    P.$("#chipsCamp", el).innerHTML = [["todas", "Todas"], ["ativas", "Ativas"], ["finalizadas", "Finalizadas"]].map(([v, t]) =>
      `<button type="button" class="chip" data-filtro="${v}" aria-pressed="${filtro === v}">${t} <small>${conta[v]}</small></button>`).join("");
    P.$("#cabecaCamp", el).innerHTML = `<tr>${COLUNAS.map((c) => {
      const ativa = ordem.col === c.c;
      const seta = ativa ? (ordem.dir === 1 ? "▲" : "▼") : "↕";
      const nome = c.c === "favorita" ? "Destaque" : c.t;
      return `<th${c.num ? ' class="num"' : ""} aria-sort="${ativa ? (ordem.dir === 1 ? "ascending" : "descending") : "none"}"><button type="button" class="th-ordena${ativa ? " ativa" : ""}" data-col="${c.c}" aria-label="Ordenar por ${nome}">${c.c === "favorita" ? P.ic("estrela", "ic-p") : P.esc(c.t)}<span class="seta" aria-hidden="true">${seta}</span></button></th>`;
    }).join("")}</tr>`;
    const l = lista();
    P.$("#corpoCamp", el).innerHTML = l.map(linha).join("") ||
      `<tr><td colspan="9" class="vazio">${camps.length ? "Nenhuma campanha com esse filtro." : "Nenhuma campanha ainda. Clique em \"Adicionar campanha\"."}</td></tr>`;
  }

  function abrirForm(x = null) {
    P.formulario({
      titulo: x ? "Editar campanha" : "Adicionar campanha",
      valores: x || { tipo: "Conteúdo", status: "Briefing", qtd: 1, pagamento: "pendente", ativa: true, favorita: false },
      campos: [
        { n: "campanha", r: "Campanha", obrig: true },
        { n: "cliente", r: "Cliente", meia: true, lista: nomesMarcas },
        { n: "tipo", r: "Tipo", tipo: "opcoes", meia: true, opcoes: [["Conteúdo", "Conteúdo"], ["Publicidade", "Publicidade"]] },
        { n: "status", r: "Status", tipo: "opcoes", meia: true, opcoes: FUNIL.map((s) => [s, s]) },
        { n: "prazo", r: "Prazo", tipo: "data", meia: true },
        { n: "qtd", r: "Quantidade de vídeos", tipo: "numero", meia: true },
        { n: "valor", r: "Valor total (R$)", tipo: "dinheiro", meia: true },
        { n: "pagamento", r: "Pagamento", tipo: "opcoes", meia: true, opcoes: [["pendente", "Pendente"], ["pago", "Pago"]] },
        { n: "ativa", r: "Campanha ativa (desmarque quando finalizar)", tipo: "caixinha" },
        { n: "favorita", r: "Destacar com estrela", tipo: "caixinha" }
      ],
      salvar: async (dados) => {
        const ok = await P.gravar("campanhas", dados, x ? x.id : null);
        if (ok) { P.toast(x ? "Campanha atualizada" : "Campanha adicionada"); await carregar(); desenhar(); }
        return ok;
      },
      apagar: x ? async () => { const ok = await P.apagar("campanhas", x.id, `Apagar a campanha ${x.campanha || ""}?`); if (ok) { await carregar(); desenhar(); } return ok; } : null
    });
  }

  function baixar() {
    const l = lista().filter((x) => !x.exemplo);
    if (!l.length) { P.toast("Não tem nenhuma campanha para baixar ainda", true); return; }
    P.baixarCSV(`campanhas-${P.hoje()}.csv`,
      ["Campanha", "Cliente", "Tipo", "Status", "Qtd", "Valor", "Prazo", "Pagamento", "Ativa", "Destaque"],
      l.map((x) => [x.campanha, x.cliente, x.tipo, x.status, P.num(x.qtd), P.num(x.valor).toFixed(2).replace(".", ","), P.dataBR(x.prazo), x.pagamento === "pago" ? "Pago" : "Pendente", x.ativa === false ? "Não" : "Sim", x.favorita ? "Sim" : "Não"]));
  }

  async function carregar() {
    const lidas = await P.ler("campanhas", (q) => q.select("*"));
    camps = lidas || [];
    P.conferirCampos("campanhas", camps, CAMPOS);
  }

  P.abas.campanhas = {
    titulo: "Campanhas",
    async montar(alvo, opcoes = {}) {
      el = alvo;
      busca = opcoes.busca || "";
      if (opcoes.busca) filtro = "todas";
      P.acoes(`<button type="button" class="bt bt-rosa" id="btNovaCamp">${P.ic("mais", "ic-p")}Adicionar campanha</button>`);
      P.$("#btNovaCamp").addEventListener("click", () => abrirForm());
      await carregar();
      P.ler("marcas", (q) => q.select("nome")).then((m) => { nomesMarcas = [...new Set((m || []).map((x) => x.nome).filter(Boolean))].sort(); });

      el.innerHTML = `<div id="numerosCamp"></div>
        <div class="caixa">
          <div class="ferramentas">
            <div class="chips" id="chipsCamp"></div>
            <label class="busca">${P.ic("busca", "ic-p")}<input class="entrada" type="search" id="buscaCamp" placeholder="Buscar campanha ou cliente" aria-label="Buscar campanhas"></label>
            <div class="direita"><button type="button" class="bt" id="btBaixarCamp">${P.ic("baixar", "ic-p")}Baixar CSV</button></div>
          </div>
          <div class="tabela-rolagem"><table class="tabela">
            <thead id="cabecaCamp"></thead>
            <tbody id="corpoCamp"></tbody>
          </table></div>
        </div>`;
      P.$("#buscaCamp", el).value = busca;
      desenhar();
      P.$("#buscaCamp", el).addEventListener("input", (e) => { busca = e.target.value; desenhar(); });
      P.$("#btBaixarCamp", el).addEventListener("click", baixar);

      el.addEventListener("click", async (e) => {
        const ch = e.target.closest("[data-filtro]");
        if (ch) { filtro = ch.dataset.filtro; return desenhar(); }
        const th = e.target.closest("[data-col]");
        if (th) {
          ordem = ordem.col === th.dataset.col ? { col: ordem.col, dir: -ordem.dir } : { col: th.dataset.col, dir: 1 };
          return desenhar();
        }
        const tr = e.target.closest("tr[data-id]");
        if (!tr) return;
        const x = camps.find((c) => c.id === Number(tr.dataset.id));
        if (!x) return;
        if (e.target.closest("[data-estrela]")) {
          if (await P.gravar("campanhas", { favorita: !x.favorita }, x.id)) { x.favorita = !x.favorita; desenhar(); }
          return;
        }
        if (e.target.closest("[data-pagamento]")) {
          const novo = x.pagamento === "pago" ? "pendente" : "pago";
          if (await P.gravar("campanhas", { pagamento: novo }, x.id)) { x.pagamento = novo; P.toast(novo === "pago" ? "Marcado como pago" : "Marcado como pendente"); desenhar(); }
          return;
        }
        abrirForm(x);
      });
    }
  };
})();
