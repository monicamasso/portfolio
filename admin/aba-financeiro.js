/* =====================================================================
   ABA FINANCEIRO: igual à sua página "Financeiro" do Notion
   Fechamento Futuro no topo e um bloco por mês (Fechamento Novembro...),
   com contagem e somas no rodapé. Ligada às campanhas:
   - pagamento preenchido na campanha aparece aqui sozinho;
   - "Recebido" aqui deixa a campanha como Paga (ou 50% paga).
   ===================================================================== */
(() => {
  const CAMPOS = ["marca", "recebido", "receber_ate", "cache", "produto", "status", "modalidade", "fechamento", "campanha_id"];
  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const STATUS = [["Não começou", "p-cinza"], ["Em andamento", "p-azul"], ["Em transferência", "p-amarelo"], ["Recebido", "p-verde"], ["Em atraso", "p-vermelho"]];
  const MODALIDADES = [["UGC", "p-roxo"], ["Influencer", "p-laranja"], ["Tiktok Shop", "p-escuro"], ["Modelo", "p-rosa"], ["Portfólio", "p-marrom"], ["Mentoria", "p-cinza"]];
  const pilula = (lista, v, bolinha) => (v ? `<span class="pilula ${bolinha ? "p-bolinha " : ""}${(lista.find((x) => x[0] === v) || [0, "p-cinza"])[1]}">${P.esc(v)}</span>` : "");

  let itens = [], camps = [], ano = null, busca = "", el = null;

  const mesDe = (iso) => String(iso || "").slice(0, 7);
  const anoDe = (f) => (f === "futuro" ? null : String(f || "").slice(0, 4));
  const nomeFechamento = (f) => {
    if (!f || f === "futuro") return "Fechamento Futuro";
    if (/^\d{4}$/.test(f)) return `Fechamento ${f}`;
    const [a, m] = f.split("-");
    return `Fechamento ${MESES[Number(m) - 1] || m}${a !== String(new Date().getFullYear()) ? " " + a : ""}`;
  };
  const recebidoDe = (x) => x.status === "Recebido";
  /* Parcela: "" = pagamento único, "1/2" e "2/2" = metade antes e metade depois */
  const PARCELAS = [["", "Pagamento único"], ["1/2", "1/2 (primeira metade)"], ["2/2", "2/2 (segunda metade)"], ["1/3", "1/3"], ["2/3", "2/3"], ["3/3", "3/3"]];
  const RE_PARCELA = /\s*(\d+)\s*\/\s*(\d+)\s*$/;
  let temParcela = true; /* o banco já tem o campo "parcela"? (vem do banco.sql) */
  const pilulaParcela = (p) => (p ? `<span class="pilula p-amarelo" title="Pagamento dividido: parcela ${P.esc(p)}">${P.esc(p)}</span>` : `<span class="pilula" title="Pagamento único">Único</span>`);

  /* ---------- Ligação com as campanhas ---------- */
  const modalidadeDoTipo = (t) => ({ "UGC": "UGC", "Tiktok Shop": "Tiktok Shop", "Tiktok": "Influencer", "Reels Collab": "Influencer", "Reels sem Collab": "Influencer" }[t] || "");

  P.financeiro = {
    /* Chamado quando uma campanha é salva: cria ou atualiza o recebimento dela */
    async sincronizarCampanha(c) {
      if (!c || !c.id) return;
      if (!(P.num(c.valor) > 0) && !c.previsao_pagamento) return;
      let ligados;
      try {
        const { data, error } = await banco.from("financeiro").select("*").eq("campanha_id", c.id);
        if (error) throw error;
        ligados = data || [];
      } catch (e) { return; } /* sem a tabela financeiro ainda: segue sem sincronizar */
      const pago = c.pagamento === "Pago";
      const hoje = P.hoje();
      if (!ligados.length) {
        await P.gravar("financeiro", {
          marca: c.campanha || "", campanha_id: c.id, cache: P.num(c.valor), produto: P.num(c.permuta),
          receber_ate: c.previsao_pagamento || null, modalidade: modalidadeDoTipo(c.tipo),
          status: pago ? "Recebido" : "Em andamento", recebido: pago ? hoje : null, fechamento: pago ? mesDe(hoje) : "futuro"
        });
        P.toast("Também foi para o Financeiro");
        return;
      }
      /* Uma parcela só e ainda não recebida: acompanha a campanha. Com parcelas (1/2, 2/2) você ajusta no Financeiro. */
      if (ligados.length === 1 && !recebidoDe(ligados[0])) {
        const dados = { cache: P.num(c.valor), receber_ate: c.previsao_pagamento || ligados[0].receber_ate || null };
        if (pago) Object.assign(dados, { status: "Recebido", recebido: hoje, fechamento: mesDe(hoje) });
        await P.gravar("financeiro", dados, ligados[0].id);
      }
    },
    /* Chamado quando um recebimento muda: deixa a campanha Paga, 50% paga ou Nada paga */
    async atualizarCampanha(campanhaId) {
      if (!campanhaId) return;
      const { data } = await banco.from("financeiro").select("status").eq("campanha_id", campanhaId);
      if (!data || !data.length) return;
      const recebidos = data.filter(recebidoDe).length;
      const pagamento = recebidos === data.length ? "Pago" : recebidos > 0 ? "50% pago" : "Nada pago";
      await P.gravar("campanhas", { pagamento }, campanhaId);
    }
  };

  /* ---------- Desenho ---------- */
  function anos() {
    const lista = [...new Set(itens.map((x) => anoDe(x.fechamento)).filter(Boolean))].sort().reverse();
    const atual = String(new Date().getFullYear());
    if (!lista.includes(atual)) lista.unshift(atual);
    return lista;
  }
  const filtrados = () => {
    const b = P.normal(busca);
    return itens.filter((x) => !b || P.normal(x.marca).includes(b) || P.normal(x.modalidade).includes(b) || P.normal(x.status).includes(b));
  };

  function numeros() {
    const reais = itens.filter((x) => !x.exemplo);
    const doAno = reais.filter((x) => anoDe(x.fechamento) === ano);
    const recebido = doAno.filter(recebidoDe).reduce((s, x) => s + P.num(x.cache), 0);
    const produtos = doAno.reduce((s, x) => s + P.num(x.produto), 0);
    const aReceber = reais.filter((x) => !recebidoDe(x)).reduce((s, x) => s + P.num(x.cache), 0);
    const mesesComReceita = new Set(doAno.filter(recebidoDe).map((x) => x.fechamento)).size;
    return `<div class="numeros">
      <div class="numero"><span>Recebido em ${ano}</span><strong>${P.moeda(recebido)}</strong><small>${P.plural(doAno.filter(recebidoDe).length, "recebimento", "recebimentos")}</small></div>
      <div class="numero"><span>Média por mês</span><strong>${P.moeda(P.divide(recebido, mesesComReceita))}</strong><small>${P.plural(mesesComReceita, "mês", "meses")} com recebimento</small></div>
      <div class="numero"><span>Em produtos (permuta)</span><strong>${P.moeda(produtos)}</strong></div>
      <div class="numero"><span>A receber</span><strong>${P.moeda(aReceber)}</strong><small>tudo que ainda não foi recebido</small></div>
    </div>`;
  }

  function etiquetaAtraso(x) {
    if (recebidoDe(x) || !x.receber_ate) return "";
    const d = P.diasAte(x.receber_ate);
    if (d < 0) return ` <span class="pilula p-vermelho">atrasado ${P.plural(-d, "dia", "dias")}</span>`;
    if (d <= 3) return ` <span class="pilula p-amarelo">${d === 0 ? "vence hoje" : `em ${P.plural(d, "dia", "dias")}`}</span>`;
    return "";
  }

  function bloco(fechamento, linhas) {
    const extras = linhas.some((x) => P.num(x.gasto) || x.ads_ate);
    const soma = (k) => linhas.reduce((s, x) => s + P.num(x[k]), 0);
    const ordenadas = [...linhas].sort((a, b) => String(a.recebido || a.receber_ate || "9").localeCompare(String(b.recebido || b.receber_ate || "9")));
    return `<div class="caixa fin-bloco">
      <div class="caixa-titulo"><h2>${P.esc(nomeFechamento(fechamento))}</h2>
        <button type="button" class="bt" style="height:28px;margin-left:auto" data-novo-fin="${P.esc(fechamento)}">${P.ic("mais", "ic-p")}Nova</button></div>
      <div class="tabela-rolagem"><table class="tabela">
        <thead><tr><th>Marca</th><th style="width:90px">Pagamento</th><th>Recebido</th><th>Receber até</th>${extras ? "<th>ADS até</th>" : ""}<th class="num">Cachê</th><th class="num">Produto</th>${extras ? '<th class="num">Gasto</th>' : ""}<th>Status</th><th>Modalidade</th></tr></thead>
        <tbody>${ordenadas.map((x) => `<tr class="clicavel" data-id="${x.id}">
          <td><b style="font-weight:500">${P.esc(x.marca || "(sem nome)")}</b>${x.pessoa === "Casal" ? ' <span class="pilula p-verde" title="Recebimento do casal: aqui está só a sua metade">casal</span>' : ""}${x.campanha_id ? ` <span class="fraco" title="Ligado a uma campanha">${P.ic("maleta", "ic-p")}</span>` : ""}${P.seloExemplo(x)}</td>
          <td>${pilulaParcela(x.parcela)}</td>
          <td class="fraco" style="white-space:nowrap">${P.dataBR(x.recebido)}</td>
          <td class="fraco" style="white-space:nowrap">${P.dataBR(x.receber_ate)}${etiquetaAtraso(x)}</td>
          ${extras ? `<td class="fraco">${P.dataBR(x.ads_ate)}</td>` : ""}
          <td class="num">${P.moeda(x.cache)}</td>
          <td class="num fraco">${P.num(x.produto) ? P.moeda(x.produto) : ""}</td>
          ${extras ? `<td class="num fraco">${P.num(x.gasto) ? P.moeda(x.gasto) : ""}</td>` : ""}
          <td>${pilula(STATUS, x.status, true)}</td>
          <td>${pilula(MODALIDADES, x.modalidade)}</td>
        </tr>`).join("") || `<tr><td colspan="10" class="vazio">Nada aqui ainda.</td></tr>`}</tbody>
        <tfoot><tr class="fin-rodape"><td>contagem ${linhas.length}</td><td></td><td></td><td></td>${extras ? "<td></td>" : ""}<td class="num">soma ${P.moeda(soma("cache"))}</td><td class="num">soma ${P.moeda(soma("produto"))}</td>${extras ? `<td class="num">soma ${P.moeda(soma("gasto"))}</td>` : ""}<td></td><td></td></tr></tfoot>
      </table></div>
    </div>`;
  }

  function desenhar() {
    P.$("#numerosFin", el).innerHTML = numeros();
    P.$("#anosFin", el).innerHTML = anos().map((a) => `<button type="button" class="chip" data-ano="${a}" aria-pressed="${a === ano}">${a}</button>`).join("");
    const l = filtrados();
    const futuro = l.filter((x) => !x.fechamento || x.fechamento === "futuro");
    const doAno = l.filter((x) => anoDe(x.fechamento) === ano);
    const grupos = [...new Set(doAno.map((x) => x.fechamento))].sort().reverse();
    P.$("#blocosFin", el).innerHTML = bloco("futuro", futuro) + (grupos.map((g) => bloco(g, doAno.filter((x) => x.fechamento === g))).join("")
      || `<div class="caixa vazio">Nenhum recebimento em ${ano}${busca ? " com essa busca" : ""}.</div>`);
  }

  /* ---------- Formulário ---------- */
  function opcoesFechamento(atual) {
    const lista = new Set(["futuro", ...itens.map((x) => x.fechamento).filter(Boolean)]);
    const hoje = new Date();
    for (let i = -2; i <= 12; i++) { const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1); lista.add(P.iso(d).slice(0, 7)); }
    if (atual) lista.add(atual);
    return [...lista].sort((a, b) => (a === "futuro" ? -1 : b === "futuro" ? 1 : b.localeCompare(a))).map((f) => [f, nomeFechamento(f).replace("Fechamento ", "")]);
  }

  function abrirForm(x = null, fechamento = "futuro") {
    const opCamp = [["", "Sem ligação"], ...camps.map((c) => [String(c.id), `${c.emoji ? c.emoji + " " : ""}${c.campanha}`])];
    P.formulario({
      titulo: x ? "Editar recebimento" : "Novo recebimento",
      valores: x ? { ...x, campanha_id: x.campanha_id ? String(x.campanha_id) : "" } : { fechamento, status: "Em andamento", campanha_id: "" },
      campos: [
        { n: "marca", r: "Marca", obrig: true, lista: [...new Set(camps.map((c) => c.campanha))] },
        { n: "parcela", r: "Pagamento", tipo: "opcoes", meia: true, opcoes: PARCELAS, ajuda: "Único ou dividido (metade antes e metade depois)" },
        { n: "campanha_id", r: "Ligado à campanha", tipo: "opcoes", meia: true, opcoes: opCamp, ajuda: "Quando marcar Recebido, a campanha fica como Paga sozinha" },
        { n: "fechamento", r: "Fechamento", tipo: "opcoes", meia: true, opcoes: opcoesFechamento(x && x.fechamento) },
        { n: "recebido", r: "Recebido em", tipo: "data", meia: true },
        { n: "receber_ate", r: "Receber até", tipo: "data", meia: true },
        { n: "cache", r: "Cachê (R$)", tipo: "dinheiro", meia: true },
        { n: "produto", r: "Produto (R$)", tipo: "dinheiro", meia: true },
        { n: "status", r: "Status", tipo: "opcoes", meia: true, opcoes: STATUS.map(([v]) => [v, v]) },
        { n: "modalidade", r: "Modalidade", tipo: "opcoes", meia: true, opcoes: [["", "Não definida"], ...MODALIDADES.map(([v]) => [v, v])] },
        { n: "gasto", r: "Gasto (R$)", tipo: "dinheiro", meia: true },
        { n: "ads_ate", r: "ADS até", tipo: "data", meia: true }
      ],
      salvar: async (dados) => {
        dados.campanha_id = dados.campanha_id ? Number(dados.campanha_id) : null;
        /* sem o campo "parcela" no banco ainda: guarda a parcela no fim do nome, como era antes */
        if (!temParcela) {
          if (dados.parcela) dados.marca = `${dados.marca} ${dados.parcela}`;
          delete dados.parcela;
          P.avisar("parcela-sql", "Para a coluna Pagamento (Único, 1/2, 2/2) ficar salva direitinho, rode o banco.sql de novo no Supabase.");
        }
        /* Marcou Recebido: preenche a data e leva para o mês certo */
        if (dados.status === "Recebido") {
          if (!dados.recebido) dados.recebido = P.hoje();
          if (dados.fechamento === "futuro") dados.fechamento = mesDe(dados.recebido);
        }
        const ok = await P.gravar("financeiro", dados, x ? x.id : null);
        if (ok) {
          const ligadas = new Set([dados.campanha_id, x && x.campanha_id].filter(Boolean));
          for (const id of ligadas) await P.financeiro.atualizarCampanha(id);
          P.toast(x ? "Recebimento atualizado" : "Recebimento adicionado");
          await carregar(); desenhar();
        }
        return ok;
      },
      apagar: x ? async () => {
        const ok = await P.apagar("financeiro", x.id, `Apagar o recebimento ${x.marca || ""}?`);
        if (ok) { if (x.campanha_id) await P.financeiro.atualizarCampanha(x.campanha_id); await carregar(); desenhar(); }
        return ok;
      } : null
    });
  }

  function baixar() {
    const l = filtrados().filter((x) => !x.exemplo);
    if (!l.length) { P.toast("Não tem nada para baixar ainda", true); return; }
    const din = (v) => P.num(v).toFixed(2).replace(".", ",");
    P.baixarCSV(`financeiro-${P.hoje()}.csv`,
      ["Fechamento", "Marca", "Pagamento", "Recebido", "Receber até", "Cachê", "Produto", "Gasto", "Status", "Modalidade"],
      l.map((x) => [nomeFechamento(x.fechamento), x.marca, x.parcela || "Único", P.dataBR(x.recebido), P.dataBR(x.receber_ate), din(x.cache), din(x.produto), din(x.gasto), x.status, x.modalidade]));
  }

  async function carregar() {
    const [lidos, cs] = await Promise.all([
      P.ler("financeiro", (q) => q.select("*")),
      P.ler("campanhas", (q) => q.select("id,campanha,emoji,criado_em").order("criado_em", { ascending: false }))
    ]);
    /* seus recebimentos e os de casal (que entram com a sua metade) */
    itens = (lidos || []).filter((x) => !x.pessoa || x.pessoa === "Mônica" || x.pessoa === "Casal");
    temParcela = !itens.length || "parcela" in itens[0];
    /* "Truth 1/2" vira marca "Truth" + parcela "1/2" (até o banco.sql fazer isso de vez) */
    itens.forEach((x) => {
      const m = String(x.marca || "").match(RE_PARCELA);
      if (m && !x.parcela) { x.parcela = `${m[1]}/${m[2]}`; x.marca = x.marca.replace(RE_PARCELA, "").trim(); }
    });
    camps = cs || [];
    P.conferirCampos("financeiro", itens, CAMPOS);
  }

  P.abas.financeiro = {
    titulo: "Financeiro",
    async montar(alvo) {
      el = alvo;
      busca = "";
      P.acoes(`<button type="button" class="bt bt-rosa" id="btNovoFin">${P.ic("mais", "ic-p")}Novo recebimento</button>`);
      P.$("#btNovoFin").addEventListener("click", () => abrirForm());
      await carregar();
      if (!ano) ano = String(new Date().getFullYear());
      el.innerHTML = `<div id="numerosFin"></div>
        <div class="caixa"><div class="ferramentas" style="margin:0">
          <div class="chips" id="anosFin"></div>
          <label class="busca">${P.ic("busca", "ic-p")}<input class="entrada" type="search" id="buscaFin" placeholder="Buscar marca, status ou modalidade" aria-label="Buscar no financeiro"></label>
          <div class="direita"><button type="button" class="bt" id="btBaixarFin">${P.ic("baixar", "ic-p")}Baixar CSV</button></div>
        </div></div>
        <div id="blocosFin" style="display:grid;gap:16px"></div>`;
      desenhar();
      P.$("#buscaFin", el).addEventListener("input", (e) => { busca = e.target.value; desenhar(); });
      P.$("#btBaixarFin", el).addEventListener("click", baixar);
      el.addEventListener("click", (e) => {
        const a = e.target.closest("[data-ano]");
        if (a) { ano = a.dataset.ano; return desenhar(); }
        const n = e.target.closest("[data-novo-fin]");
        if (n) return abrirForm(null, n.dataset.novoFin);
        const tr = e.target.closest("tr[data-id]");
        if (tr) abrirForm(itens.find((x) => x.id === Number(tr.dataset.id)));
      });
    }
  };
})();
