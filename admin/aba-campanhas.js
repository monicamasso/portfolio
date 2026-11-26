/* =====================================================================
   ABA CAMPANHAS: igual ao seu Notion "Produção"
   Duas visões: Quadro (colunas por etapa, arrasta o card entre elas)
   e Tabela (todas as colunas ordenam ao clicar no cabeçalho).
   ===================================================================== */
(() => {
  const CAMPOS = ["campanha", "cliente", "tipo", "status", "etapa", "qtd", "valor", "prazo", "pagamento", "ativa", "favorita"];

  /* As cores seguem as do Notion */
  const COR = { cinza: "p-cinza", rosa: "p-rosa", roxo: "p-roxo", amarelo: "p-amarelo", azul: "p-azul", verde: "p-verde", vermelho: "p-vermelho", laranja: "p-laranja", marrom: "p-marrom" };
  const ETAPAS = [
    ["Organização", "cinza"], ["Negociação", "rosa"], ["Pré-Produção", "roxo"], ["Produção", "amarelo"],
    ["Pós-Produção", "azul"], ["Aguardando Pagamento", "cinza"], ["Finalizado", "verde"]
  ];
  /* Os status na ordem do funil do Notion (ordenar por status segue ESTA ordem) */
  const STATUS = [
    ["Campanha Pausada", "cinza"], ["Sem Retorno da Marca", "cinza"], ["Em Negociação", "cinza"], ["Aguardando Produtos", "cinza"],
    ["Enviar Contrato", "cinza"], ["Aguardando Contrato", "cinza"], ["Regravar", "azul"], ["Criar Roteiro", "amarelo"],
    ["Roteiro Criado", "laranja"], ["Roteiro Enviado", "laranja"], ["Aguardando Apv. Roteiro", "laranja"], ["Gravar", "azul"],
    ["Narrar", "roxo"], ["Editar", "roxo"], ["Enviar para Edição", "roxo"], ["Aguardando Edição", "roxo"],
    ["Enviar para Aprovação", "rosa"], ["Aguardando Aprovação", "rosa"], ["Postar", "rosa"], ["Aguardando Pagamento", "vermelho"],
    ["Emitir NF", "vermelho"], ["Concluído", "verde"]
  ];
  const TIPOS = [["Reels Collab", "amarelo"], ["Reels sem Collab", "roxo"], ["UGC", "rosa"], ["Tiktok", "azul"], ["Tiktok Shop", "marrom"]];
  const PAGAMENTOS = [["Nada pago", "marrom"], ["50% pago", "amarelo"], ["Pago", "verde"]];
  const NOTAS = [["Emitida", "verde"], ["Emitir", "amarelo"], ["Não é necessário", "marrom"]];
  const CONTRATOS = [["Assinado", "verde"], ["Pendente de assinatura", "amarelo"], ["Não é necessário", "marrom"], ["Enviar", "cinza"]];
  const PRIORIDADES = [["Alta 🔥", "vermelho"], ["Média", "amarelo"], ["Baixa", "verde"]];
  const PLATAFORMAS = ["Storm", "Comû", "MIS", "Squid", "SI", "Noovid", "Creatify", "Whatsapp", "Instagram", "E-mail", "Flip", "AllFluence", "Creator ADS"];

  const cor = (lista, v) => COR[(lista.find((x) => x[0] === v) || [0, "cinza"])[1]];
  const pilula = (lista, v, bolinha = true) => (v ? `<span class="pilula ${bolinha ? "p-bolinha " : ""}${cor(lista, v)}">${P.esc(v)}</span>` : "");
  const pos = (lista, v) => { const i = lista.findIndex((x) => x[0] === v); return i < 0 ? 99 : i; };
  const finalizada = (x) => x.etapa === "Finalizado" || x.ativa === false;
  const etapaDe = (x) => x.etapa || (x.ativa === false ? "Finalizado" : "Organização");

  let camps = [], nomesMarcas = [], filtro = "todas", busca = "", visao = "quadro", ordem = { col: "prazo", dir: 1 }, el = null;
  let verTodosFinalizados = false;
  try { visao = localStorage.getItem("painel-campanhas-visao") || "quadro"; } catch (e) { /* ok */ }

  const COLUNAS = [
    { c: "favorita", t: "", val: (x) => (x.favorita ? 0 : 1) },
    { c: "campanha", t: "Campanha", val: (x) => P.normal(x.campanha) },
    { c: "etapa", t: "Etapa", val: (x) => pos(ETAPAS, etapaDe(x)) },
    { c: "status", t: "Status", val: (x) => pos(STATUS, x.status) },
    { c: "tipo", t: "Tipo", val: (x) => P.normal(x.tipo) },
    { c: "valor", t: "Cachê", val: (x) => P.num(x.valor), num: true },
    { c: "prazo", t: "Prazo", val: (x) => x.prazo || null },
    { c: "pagamento", t: "Pagamento", val: (x) => pos(PAGAMENTOS, x.pagamento) }
  ];

  function lista() {
    const b = P.normal(busca);
    return camps
      .filter((x) => filtro === "todas" || (filtro === "ativas" ? !finalizada(x) : finalizada(x)))
      .filter((x) => !b || [x.campanha, x.cliente, x.status, x.tipo, x.plataforma].some((v) => P.normal(v).includes(b)));
  }
  function ordenada() {
    const col = COLUNAS.find((c) => c.c === ordem.col) || COLUNAS[6];
    return lista().sort((a, z) => {
      const va = col.val(a), vz = col.val(z);
      if (va === null || vz === null) return va === vz ? 0 : va === null ? 1 : -1; /* sem prazo vai pro fim */
      const r = typeof va === "number" ? va - vz : String(va).localeCompare(String(vz), "pt");
      return r * ordem.dir || P.num(a.id) - P.num(z.id);
    });
  }

  function etiquetaPrazo(x) {
    if (!x.prazo || finalizada(x) || x.status === "Concluído") return "";
    const d = P.diasAte(x.prazo);
    if (d < 0) return `<span class="pilula p-vermelho">atrasada ${P.plural(-d, "dia", "dias")}</span>`;
    if (d === 0) return '<span class="pilula p-amarelo">vence hoje</span>';
    if (d === 1) return '<span class="pilula p-amarelo">vence amanhã</span>';
    if (d <= 3) return `<span class="pilula p-amarelo">vence em ${d} dias</span>`;
    return "";
  }
  const nome = (x) => `${x.emoji ? `<span class="emoji-card">${P.esc(x.emoji)}</span>` : ""}${P.esc(x.campanha || "(sem nome)")}`;

  /* ---------- Números do topo ---------- */
  function numeros() {
    const reais = camps.filter((x) => !x.exemplo);
    const ativas = reais.filter((x) => !finalizada(x)).length;
    const total = reais.reduce((s, x) => s + P.num(x.valor), 0);
    const videos = reais.reduce((s, x) => s + P.num(x.qtd), 0);
    const parte = (x) => (x.pagamento === "Pago" ? 1 : x.pagamento === "50% pago" ? 0.5 : 0);
    const recebido = reais.reduce((s, x) => s + P.num(x.valor) * parte(x), 0);
    const receber = reais.filter((x) => x.pagamento === "Nada pago" || x.pagamento === "50% pago").reduce((s, x) => s + P.num(x.valor) * (1 - parte(x)), 0);
    return `<div class="numeros">
      <div class="numero"><span>Campanhas</span><strong>${reais.length}</strong></div>
      <div class="numero"><span>Ativas</span><strong>${ativas}</strong></div>
      <div class="numero"><span>Valor total (cachês)</span><strong>${P.moeda(total)}</strong><small>ticket médio por vídeo ${P.moeda(P.divide(total, videos))}</small></div>
      <div class="numero"><span>A receber</span><strong>${P.moeda(receber)}</strong><small>já recebido ${P.moeda(recebido)}</small></div>
    </div>`;
  }

  /* ---------- Visão QUADRO ---------- */
  function card(x) {
    const datas = [
      x.prazo ? `<span class="card-data">${P.ic("calendario", "ic-p")}entrega ${P.dataBR(x.prazo)}</span>` : "",
      x.previsao_pagamento ? `<span class="card-data">${P.ic("maleta", "ic-p")}pagamento ${P.dataBR(x.previsao_pagamento)}</span>` : ""
    ].join("");
    return `<div class="card-camp${x.favorita ? " favorita" : ""}" draggable="true" data-id="${x.id}" tabindex="0">
      <div class="card-nome">${nome(x)}${P.seloExemplo(x)}</div>
      <div class="card-pilulas">${pilula(STATUS, x.status)}${etiquetaPrazo(x)}</div>
      ${datas ? `<div class="card-datas">${datas}</div>` : ""}
      ${P.num(x.valor) ? `<div class="card-valor">${P.moeda(x.valor)}</div>` : ""}
    </div>`;
  }
  function quadro() {
    const l = lista();
    const colunas = ETAPAS.filter(([e]) => e !== "Aguardando Pagamento" || l.some((x) => etapaDe(x) === e));
    return `<div class="quadro">${colunas.map(([e, c]) => {
      let itens = l.filter((x) => etapaDe(x) === e).sort((a, z) => (z.favorita - a.favorita) || String(z.criado_em || "").localeCompare(String(a.criado_em || "")));
      const total = itens.length;
      const corta = e === "Finalizado" && !verTodosFinalizados && total > 12;
      if (corta) itens = itens.slice(0, 12);
      return `<section class="coluna col-${c}" data-etapa="${P.esc(e)}">
        <div class="coluna-topo"><span class="pilula ${COR[c]}">${P.esc(e)}</span><small>${total}</small></div>
        <div class="coluna-cards">${itens.map(card).join("")}</div>
        ${corta ? `<button type="button" class="coluna-mais" data-ver-todos>Ver mais ${total - 12}</button>` : ""}
        <button type="button" class="coluna-nova" data-nova="${P.esc(e)}">${P.ic("mais", "ic-p")}Nova</button>
      </section>`;
    }).join("")}</div>`;
  }

  /* ---------- Visão TABELA ---------- */
  function tabela() {
    const cab = `<tr>${COLUNAS.map((c) => {
      const ativa = ordem.col === c.c;
      const seta = ativa ? (ordem.dir === 1 ? "▲" : "▼") : "↕";
      return `<th${c.num ? ' class="num"' : ""} aria-sort="${ativa ? (ordem.dir === 1 ? "ascending" : "descending") : "none"}"><button type="button" class="th-ordena${ativa ? " ativa" : ""}" data-col="${c.c}" aria-label="Ordenar por ${c.c === "favorita" ? "destaque" : c.t}">${c.c === "favorita" ? P.ic("estrela", "ic-p") : P.esc(c.t)}<span class="seta" aria-hidden="true">${seta}</span></button></th>`;
    }).join("")}</tr>`;
    const linhas = ordenada().map((x) => `<tr class="clicavel${x.favorita ? " favorita" : ""}" data-id="${x.id}">
      <td style="width:36px"><button type="button" class="bt bt-icone estrela${x.favorita ? " ligada" : ""}" data-estrela aria-label="${x.favorita ? "Tirar destaque" : "Destacar campanha"}" aria-pressed="${!!x.favorita}">${P.ic("estrela", "ic-p")}</button></td>
      <td><b style="font-weight:500">${nome(x)}</b>${P.seloExemplo(x)}</td>
      <td>${pilula(ETAPAS, etapaDe(x), false)}</td>
      <td>${pilula(STATUS, x.status)}</td>
      <td>${pilula(TIPOS, x.tipo, false)}</td>
      <td class="num">${P.moeda(x.valor)}</td>
      <td style="white-space:nowrap">${x.prazo ? P.dataBR(x.prazo) : '<span class="fraco">sem prazo</span>'} ${etiquetaPrazo(x)}</td>
      <td>${pilula(PAGAMENTOS, x.pagamento, false)}</td>
    </tr>`).join("");
    return `<div class="tabela-rolagem"><table class="tabela"><thead>${cab}</thead>
      <tbody>${linhas || `<tr><td colspan="8" class="vazio">${camps.length ? "Nenhuma campanha com esse filtro." : "Nenhuma campanha ainda. Clique em \"Adicionar campanha\"."}</td></tr>`}</tbody></table></div>`;
  }

  function desenhar() {
    P.$("#numerosCamp", el).innerHTML = numeros();
    const conta = { todas: camps.length, ativas: camps.filter((x) => !finalizada(x)).length, finalizadas: camps.filter(finalizada).length };
    P.$("#chipsCamp", el).innerHTML = [["todas", "Todas"], ["ativas", "Ativas"], ["finalizadas", "Finalizadas"]].map(([v, t]) =>
      `<button type="button" class="chip" data-filtro="${v}" aria-pressed="${filtro === v}">${t} <small>${conta[v]}</small></button>`).join("");
    P.$("#visoesCamp", el).innerHTML = [["quadro", "Quadro"], ["tabela", "Tabela"]].map(([v, t]) =>
      `<button type="button" class="sub-aba" data-visao="${v}" aria-selected="${visao === v}">${t}</button>`).join("");
    P.$("#conteudoCamp", el).innerHTML = visao === "quadro" ? quadro() : tabela();
    P.$("#caixaCamp", el).classList.toggle("caixa-quadro", visao === "quadro");
  }

  /* ---------- Formulário ---------- */
  function abrirForm(x = null, etapaInicial = "Organização") {
    const op = (l) => [["", "Não definido"], ...l.map(([v]) => [v, v])];
    P.formulario({
      titulo: x ? "Editar campanha" : "Adicionar campanha",
      valores: x ? { ...x, etapa: etapaDe(x) } : { etapa: etapaInicial, status: "Aguardando Produtos", qtd: 1, pagamento: "Nada pago", favorita: false },
      campos: [
        { n: "campanha", r: "Campanha / marca", obrig: true },
        { n: "emoji", r: "Emoji do card", meia: true, ajuda: "Opcional. Ex: 📱" },
        { n: "cliente", r: "Cliente", meia: true, lista: nomesMarcas },
        { n: "etapa", r: "Etapa (coluna do quadro)", tipo: "opcoes", meia: true, opcoes: ETAPAS.map(([v]) => [v, v]) },
        { n: "status", r: "Status", tipo: "opcoes", meia: true, opcoes: STATUS.map(([v]) => [v, v]) },
        { n: "tipo", r: "Tipo de conteúdo", tipo: "opcoes", meia: true, opcoes: op(TIPOS) },
        { n: "plataforma", r: "Plataforma de abordagem", meia: true, lista: PLATAFORMAS },
        { n: "valor", r: "Cachê (R$)", tipo: "dinheiro", meia: true },
        { n: "permuta", r: "Valor da permuta (R$)", tipo: "dinheiro", meia: true },
        { n: "qtd", r: "Quantidade de vídeos", tipo: "numero", meia: true },
        { n: "pagamento", r: "Pagamento", tipo: "opcoes", meia: true, opcoes: op(PAGAMENTOS) },
        { n: "prazo", r: "Prazo de entrega", tipo: "data", meia: true },
        { n: "previsao_pagamento", r: "Previsão de pagamento", tipo: "data", meia: true },
        { n: "nota_fiscal", r: "Nota fiscal", tipo: "opcoes", meia: true, opcoes: op(NOTAS) },
        { n: "contrato", r: "Contrato", tipo: "opcoes", meia: true, opcoes: op(CONTRATOS) },
        { n: "prioridade", r: "Prioridade", tipo: "opcoes", meia: true, opcoes: op(PRIORIDADES) },
        { n: "telefone", r: "Telefone", tipo: "tel", meia: true },
        { n: "obs", r: "Anotações (briefing, roteiro, links)", tipo: "area", ajuda: x && x.notion_url ? `Veio do Notion: <a href="${P.esc(x.notion_url)}" target="_blank" rel="noopener">abrir o card original</a>` : "" },
        { n: "favorita", r: "Destacar com estrela", tipo: "caixinha" }
      ],
      salvar: async (dados) => {
        dados.ativa = dados.etapa !== "Finalizado";
        const ok = await P.gravar("campanhas", dados, x ? x.id : null);
        if (ok) { P.toast(x ? "Campanha atualizada" : "Campanha adicionada"); await carregar(); desenhar(); }
        return ok;
      },
      apagar: x ? async () => { const ok = await P.apagar("campanhas", x.id, `Apagar a campanha ${x.campanha || ""}?`); if (ok) { await carregar(); desenhar(); } return ok; } : null
    });
    /* anotações grandes ficam com mais espaço */
    const area = document.querySelector('#formJanela textarea[name="obs"]');
    if (area) { area.style.minHeight = "160px"; area.closest(".janela").classList.add("larga"); }
  }

  async function moverPara(id, etapa) {
    const x = camps.find((c) => c.id === id);
    if (!x || etapaDe(x) === etapa) return;
    const dados = { etapa, ativa: etapa !== "Finalizado" };
    if (etapa === "Finalizado" && x.status !== "Concluído") dados.status = "Concluído";
    if (await P.gravar("campanhas", dados, id)) { Object.assign(x, dados); P.toast(`${x.campanha} foi para ${etapa}`); desenhar(); }
  }

  function baixar() {
    const l = ordenada().filter((x) => !x.exemplo);
    if (!l.length) { P.toast("Não tem nenhuma campanha para baixar ainda", true); return; }
    P.baixarCSV(`campanhas-${P.hoje()}.csv`,
      ["Campanha", "Cliente", "Etapa", "Status", "Tipo", "Cachê", "Permuta", "Qtd", "Pagamento", "Prazo de entrega", "Previsão de pagamento", "Nota fiscal", "Contrato", "Plataforma", "Telefone", "Destaque"],
      l.map((x) => [x.campanha, x.cliente, etapaDe(x), x.status, x.tipo, P.num(x.valor).toFixed(2).replace(".", ","), P.num(x.permuta).toFixed(2).replace(".", ","), P.num(x.qtd),
        x.pagamento, P.dataBR(x.prazo), P.dataBR(x.previsao_pagamento), x.nota_fiscal, x.contrato, x.plataforma, x.telefone, x.favorita ? "Sim" : "Não"]));
  }

  async function carregar() {
    const lidas = await P.ler("campanhas", (q) => q.select("*"));
    camps = lidas || [];
    P.conferirCampos("campanhas", camps, CAMPOS);
    if (camps.length && !("etapa" in camps[0])) {
      P.avisar("campanhas-notion", "As campanhas ainda estão no formato antigo. Rode o banco.sql de novo no Supabase para ganhar as etapas e os campos do Notion.");
    }
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
        <div class="caixa" id="caixaCamp">
          <div class="ferramentas">
            <div class="sub-abas" role="tablist" id="visoesCamp"></div>
            <div class="chips" id="chipsCamp"></div>
            <label class="busca">${P.ic("busca", "ic-p")}<input class="entrada" type="search" id="buscaCamp" placeholder="Buscar campanha, status, tipo" aria-label="Buscar campanhas"></label>
            <div class="direita"><button type="button" class="bt" id="btBaixarCamp">${P.ic("baixar", "ic-p")}Baixar CSV</button></div>
          </div>
          <div id="conteudoCamp"></div>
        </div>`;
      P.$("#buscaCamp", el).value = busca;
      desenhar();
      P.$("#buscaCamp", el).addEventListener("input", (e) => { busca = e.target.value; desenhar(); });
      P.$("#btBaixarCamp", el).addEventListener("click", baixar);

      el.addEventListener("click", async (e) => {
        const v = e.target.closest("[data-visao]");
        if (v) { visao = v.dataset.visao; try { localStorage.setItem("painel-campanhas-visao", visao); } catch (er) { /* ok */ } return desenhar(); }
        const ch = e.target.closest("[data-filtro]");
        if (ch) { filtro = ch.dataset.filtro; return desenhar(); }
        if (e.target.closest("[data-ver-todos]")) { verTodosFinalizados = true; return desenhar(); }
        const nova = e.target.closest("[data-nova]");
        if (nova) return abrirForm(null, nova.dataset.nova);
        const th = e.target.closest("[data-col]");
        if (th) {
          ordem = ordem.col === th.dataset.col ? { col: ordem.col, dir: -ordem.dir } : { col: th.dataset.col, dir: 1 };
          return desenhar();
        }
        const alvoId = e.target.closest("[data-id]");
        if (!alvoId) return;
        const x = camps.find((c) => c.id === Number(alvoId.dataset.id));
        if (!x) return;
        if (e.target.closest("[data-estrela]")) {
          if (await P.gravar("campanhas", { favorita: !x.favorita }, x.id)) { x.favorita = !x.favorita; desenhar(); }
          return;
        }
        abrirForm(x);
      });
      el.addEventListener("keydown", (e) => {
        const c = e.target.closest(".card-camp");
        if (c && e.key === "Enter") abrirForm(camps.find((x) => x.id === Number(c.dataset.id)));
      });

      /* Arrastar o card de uma coluna para outra (como no Notion) */
      let arrastado = null;
      el.addEventListener("dragstart", (e) => {
        const c = e.target.closest(".card-camp");
        if (!c) return;
        arrastado = Number(c.dataset.id);
        c.classList.add("arrastando");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", c.dataset.id);
      });
      el.addEventListener("dragend", (e) => { const c = e.target.closest(".card-camp"); if (c) c.classList.remove("arrastando"); P.$$(".coluna.solta", el).forEach((x) => x.classList.remove("solta")); });
      el.addEventListener("dragover", (e) => {
        const col = e.target.closest(".coluna");
        if (!col || arrastado == null) return;
        e.preventDefault();
        P.$$(".coluna.solta", el).forEach((x) => x !== col && x.classList.remove("solta"));
        col.classList.add("solta");
      });
      el.addEventListener("drop", (e) => {
        const col = e.target.closest(".coluna");
        if (!col || arrastado == null) return;
        e.preventDefault();
        col.classList.remove("solta");
        const id = arrastado;
        arrastado = null;
        moverPara(id, col.dataset.etapa);
      });
    }
  };
})();
