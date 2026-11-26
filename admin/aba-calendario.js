/* =====================================================================
   ABA CALENDÁRIO: o mês inteiro, com o que gravar, editar e postar,
   e os prazos das campanhas puxados sozinhos da tabela campanhas
   ===================================================================== */
(() => {
  const CAMPOS = ["titulo", "marca", "tipo", "data", "status"];
  const TIPOS = [["gravar", "Gravar"], ["editar", "Editar"], ["postar", "Postar"]];
  const ORDEM_TIPO = { gravar: 0, editar: 1, postar: 2, prazo: 3 };
  const SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  let itens = [], prazos = [], nomesMarcas = [];
  let ano, mes, filtro = "todos", el = null;

  const nomeTipo = (t) => (t === "prazo" ? "Prazo" : (TIPOS.find((x) => x[0] === t) || [t, t])[1]);

  /* Campanhas: a gravação conta como feita quando a campanha chega na Pós-Produção,
     a edição quando chega em aprovação, postagem ou depois, e o prazo quando foi concluída */
  const ETAPAS = ["Organização", "Negociação", "Pré-Produção", "Produção", "Pós-Produção", "Aguardando Pagamento", "Finalizado"];
  const DEPOIS_DA_EDICAO = ["Enviar para Aprovação", "Aguardando Aprovação", "Postar", "Aguardando Pagamento", "Emitir NF", "Concluído", "Entregue"];
  const etapaPos = (c) => ETAPAS.indexOf(c.etapa || (c.ativa === false ? "Finalizado" : "Organização"));
  const concluida = (c) => c.status === "Entregue" || c.status === "Concluído" || c.etapa === "Finalizado" || c.ativa === false;
  const gravou = (c) => concluida(c) || etapaPos(c) >= ETAPAS.indexOf("Pós-Produção");
  const editou = (c) => concluida(c) || etapaPos(c) >= ETAPAS.indexOf("Aguardando Pagamento") || DEPOIS_DA_EDICAO.includes(c.status);

  /* Os compromissos que vêm sozinhos das campanhas: gravar, editar e prazo de entrega */
  function daCampanha(c) {
    const base = { _camp: true, id: c.id, titulo: c.campanha || "Campanha", marca: c.cliente };
    return [
      c.dia_gravacao && { ...base, _tipo: "gravar", data: c.dia_gravacao, rotulo: "Gravar: ", status: gravou(c) ? "feito" : "a fazer" },
      c.dia_edicao && { ...base, _tipo: "editar", data: c.dia_edicao, rotulo: "Editar: ", status: editou(c) ? "feito" : "a fazer" },
      c.prazo && { ...base, _tipo: "prazo", data: c.prazo, rotulo: "Prazo: ", status: concluida(c) ? "feito" : "a fazer" }
    ].filter(Boolean);
  }

  /* Junta os itens do calendário com o que vem das campanhas */
  function doDia(iso) {
    const a = itens.filter((i) => String(i.data).slice(0, 10) === iso).map((i) => ({ ...i, _tipo: i.tipo || "gravar" }));
    const b = prazos.flatMap(daCampanha).filter((x) => String(x.data).slice(0, 10) === iso);
    return [...a, ...b]
      .filter((x) => filtro === "todos" || x._tipo === filtro)
      .sort((x, y) => (ORDEM_TIPO[x._tipo] ?? 9) - (ORDEM_TIPO[y._tipo] ?? 9));
  }

  function itemHtml(x) {
    const feito = x.status === "feito";
    const rotulo = x._camp ? x.rotulo + x.titulo : x.titulo || "(sem título)";
    return `<button type="button" class="cal-item t-${x._tipo}${feito ? " feito" : ""}" data-item="${x._camp ? "p" : "c"}${x.id}" title="${P.esc(rotulo + (x.marca && x.marca !== x.titulo ? " · " + x.marca : "") + (x._camp ? " (da campanha)" : ""))}">
      ${feito ? P.ic("check", "ic-p") : x._camp ? P.ic("maleta", "ic-p") : ""}<span>${P.esc(rotulo)}</span></button>`;
  }

  function grade() {
    const primeiro = new Date(ano, mes, 1);
    const recuo = (primeiro.getDay() + 6) % 7; /* segunda = 0 */
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const semanas = Math.ceil((recuo + diasNoMes) / 7);
    const inicio = P.somarDias(P.iso(primeiro), -recuo);
    const hoje = P.hoje();
    let html = SEMANA.map((d) => `<div class="cal-semana">${d}</div>`).join("");
    for (let i = 0; i < semanas * 7; i++) {
      const iso = P.somarDias(inicio, i);
      const d = P.paraData(iso);
      const lista = doDia(iso);
      const fora = d.getMonth() !== mes;
      html += `<div class="cal-dia${fora ? " fora" : ""}${iso === hoje ? " hoje" : ""}" data-dia="${iso}">
        <span class="cal-num">${d.getDate()}</span>
        <button type="button" class="cal-mais-add" data-novo="${iso}" aria-label="Adicionar no dia ${P.dataBR(iso)}">${P.ic("mais", "ic-p")}</button>
        ${lista.slice(0, 3).map(itemHtml).join("")}
        ${lista.length > 3 ? `<button type="button" class="cal-ver-mais" data-ver="${iso}">+${lista.length - 3} mais</button>` : ""}
      </div>`;
    }
    return html;
  }

  function atrasados() {
    const hoje = P.hoje();
    const daAgenda = itens.map((i) => ({ ...i, _tipo: i.tipo || "gravar" }));
    const lista = [...daAgenda, ...prazos.flatMap(daCampanha).filter((x) => x._tipo !== "prazo")]
      .filter((i) => i.status !== "feito" && i.data && String(i.data).slice(0, 10) < hoje)
      .sort((a, b) => String(a.data).localeCompare(String(b.data)));
    if (!lista.length) return `<div class="vazio">Nada ficou pra trás. Tudo em dia!</div>`;
    return `<div class="atrasos">${lista.map((i) => {
      const dias = -P.diasAte(i.data);
      const botao = i._camp
        ? `<button type="button" class="bt" style="height:28px" data-item="p${i.id}">${P.ic("maleta", "ic-p")}Abrir campanha</button>`
        : `<button type="button" class="bt" style="height:28px" data-feito="${i.id}">${P.ic("check", "ic-p")}Feito</button>`;
      return `<div class="atraso"><span class="pilula t-${P.esc(i._tipo)}">${nomeTipo(i._tipo)}</span>
        <span><b style="font-weight:500">${P.esc(i.titulo || "(sem título)")}</b>${i.marca && i.marca !== i.titulo ? ` <span class="fraco">· ${P.esc(i.marca)}</span>` : ""}${i._camp ? ' <span class="pilula p-rosa">campanha</span>' : ""}${P.seloExemplo(i)}</span>
        <span class="quando">${P.dataBR(i.data)} · há ${P.plural(dias, "dia", "dias")}</span>
        ${botao}</div>`;
    }).join("")}</div>`;
  }

  function desenhar() {
    P.$("#mesAtual", el).textContent = `${MESES[mes]} ${ano}`;
    P.$("#chipsTipo", el).innerHTML = [["todos", "Todos"], ...TIPOS, ["prazo", "Prazos"]].map(([v, t]) =>
      `<button type="button" class="chip" data-tipo="${v}" aria-pressed="${filtro === v}">${t}</button>`).join("");
    P.$("#gradeCal", el).innerHTML = grade();
    P.$("#atrasos", el).innerHTML = atrasados();
  }

  function abrirForm(item = null, dataInicial = P.hoje()) {
    P.formulario({
      titulo: item ? "Editar no calendário" : `Adicionar em ${P.dataBR(dataInicial)}`,
      valores: item || { data: dataInicial, tipo: "gravar", status: "a fazer" },
      campos: [
        { n: "titulo", r: "O que é", obrig: true },
        { n: "marca", r: "Marca", meia: true, lista: nomesMarcas },
        { n: "tipo", r: "Tipo", tipo: "opcoes", meia: true, opcoes: TIPOS },
        { n: "data", r: "Data", tipo: "data", meia: true, obrig: true },
        { n: "status", r: "Status", tipo: "opcoes", meia: true, opcoes: [["a fazer", "A fazer"], ["feito", "Feito"]] }
      ],
      salvar: async (dados) => {
        const ok = await P.gravar("calendario", dados, item ? item.id : null);
        if (ok) { P.toast(item ? "Atualizado" : "Adicionado ao calendário"); await carregar(); desenhar(); }
        return ok;
      },
      apagar: item ? async () => { const ok = await P.apagar("calendario", item.id); if (ok) { await carregar(); desenhar(); } return ok; } : null
    });
  }

  function abrirDia(iso) {
    const lista = doDia(iso);
    const f = P.janela({
      titulo: P.esc(P.paraData(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })),
      corpo: `<div style="display:grid;gap:6px">${lista.map((x) => `${itemHtml(x).replace('class="cal-item', 'style="font-size:13px;padding:6px 10px" class="cal-item')}`).join("")}</div>`,
      pe: `<div class="direita"><button type="button" class="bt bt-rosa" data-add>${P.ic("mais", "ic-p")}Adicionar neste dia</button></div>`
    });
    P.$("[data-add]", f).addEventListener("click", () => abrirForm(null, iso));
    f.addEventListener("click", (e) => { const b = e.target.closest("[data-item]"); if (b) abrirItem(b.dataset.item); });
  }

  function abrirItem(chave) {
    const id = Number(chave.slice(1));
    if (chave[0] === "p") {
      P.fecharJanela();
      P.ir("campanhas", { abrir: id }); /* abre a ficha da campanha */
      return;
    }
    abrirForm(itens.find((x) => x.id === id));
  }

  async function carregar() {
    const [lidos, camps] = await Promise.all([
      P.ler("calendario", (q) => q.select("*").order("data", { ascending: true })),
      P.ler("campanhas", (q) => q.select("id,campanha,cliente,prazo,status,ativa,etapa,dia_gravacao,dia_edicao"))
    ]);
    itens = lidos || [];
    prazos = (camps || []).filter((c) => c.prazo || c.dia_gravacao || c.dia_edicao);
    P.conferirCampos("calendario", itens, CAMPOS);
  }

  P.abas.calendario = {
    titulo: "Calendário",
    async montar(alvo) {
      el = alvo;
      const agora = new Date();
      if (ano == null) { ano = agora.getFullYear(); mes = agora.getMonth(); }
      P.acoes(`<button type="button" class="bt bt-rosa" id="btNovoCal">${P.ic("mais", "ic-p")}Adicionar</button>`);
      P.$("#btNovoCal").addEventListener("click", () => abrirForm());
      await carregar();
      P.ler("marcas", (q) => q.select("nome")).then((m) => { nomesMarcas = [...new Set((m || []).map((x) => x.nome).filter(Boolean))].sort(); });

      el.innerHTML = `<div class="caixa">
          <div class="ferramentas">
            <div class="cal-nav">
              <button type="button" class="bt bt-icone" id="mesAntes" aria-label="Mês anterior">${P.ic("esquerda")}</button>
              <h2 id="mesAtual"></h2>
              <button type="button" class="bt bt-icone" id="mesDepois" aria-label="Próximo mês">${P.ic("direita")}</button>
              <button type="button" class="bt" id="esteMes" style="height:30px">Este mês</button>
            </div>
            <div class="chips direita" id="chipsTipo"></div>
          </div>
          <div class="cal" id="gradeCal"></div>
        </div>
        <div class="caixa"><div class="caixa-titulo"><h2>Ficou pra trás</h2><span class="ajuda">O que passou do dia e não foi feito</span></div><div id="atrasos"></div></div>`;
      desenhar();

      el.addEventListener("click", async (e) => {
        const t = e.target;
        if (t.closest("#mesAntes")) { mes--; if (mes < 0) { mes = 11; ano--; } return desenhar(); }
        if (t.closest("#mesDepois")) { mes++; if (mes > 11) { mes = 0; ano++; } return desenhar(); }
        if (t.closest("#esteMes")) { ano = new Date().getFullYear(); mes = new Date().getMonth(); return desenhar(); }
        const chip = t.closest("[data-tipo]");
        if (chip) { filtro = chip.dataset.tipo; return desenhar(); }
        const feito = t.closest("[data-feito]");
        if (feito) {
          if (await P.gravar("calendario", { status: "feito" }, Number(feito.dataset.feito))) { P.toast("Marcado como feito"); await carregar(); desenhar(); }
          return;
        }
        const item = t.closest("[data-item]");
        if (item) return abrirItem(item.dataset.item);
        const ver = t.closest("[data-ver]");
        if (ver) return abrirDia(ver.dataset.ver);
        const novo = t.closest("[data-novo]");
        if (novo) return abrirForm(null, novo.dataset.novo);
        const dia = t.closest(".cal-dia");
        if (dia) abrirForm(null, dia.dataset.dia);
      });
    }
  };
})();
