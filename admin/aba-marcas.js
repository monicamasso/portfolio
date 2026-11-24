/* =====================================================================
   ABA MARCAS: a sua base de contatos de empresas
   ===================================================================== */
(() => {
  const CAMPOS = ["nome", "instagram", "email", "telefone", "situacao", "obs", "ultimo_contato"];
  const SITUACOES = [
    ["lead", "Lead", "p-azul"],
    ["conversando", "Conversando", "p-amarelo"],
    ["cliente", "Cliente", "p-verde"],
    ["parada", "Parada", "p-cinza"]
  ];
  const nomeSit = (s) => (SITUACOES.find((x) => x[0] === s) || [s, s || "Lead"])[1];
  const corSit = (s) => (SITUACOES.find((x) => x[0] === s) || [0, 0, "p-cinza"])[2];

  let marcas = [], filtro = "todas", busca = "", el = null;

  function filtradas() {
    const b = P.normal(busca).replace(/^@/, "");
    return marcas.filter((m) =>
      (filtro === "todas" || m.situacao === filtro) &&
      (!b || [m.nome, m.instagram, m.email].some((x) => P.normal(x).replace(/^@/, "").includes(b))));
  }

  function linha(m) {
    const insta = P.instaUsuario(m.instagram);
    const wa = P.whatsLink(m.telefone);
    return `<tr class="clicavel" data-id="${m.id}">
      <td><b style="font-weight:500">${P.esc(m.nome || "(sem nome)")}</b>${P.seloExemplo(m)}${m.origem === "site" ? ' <span class="pilula p-rosa">pelo site</span>' : ""}</td>
      <td>${insta ? `<a href="https://instagram.com/${encodeURIComponent(insta)}" target="_blank" rel="noopener" data-link>@${P.esc(insta)}</a>` : '<span class="fraco"></span>'}</td>
      <td class="corta">${m.email ? `<a href="mailto:${P.esc(m.email)}" data-link>${P.esc(m.email)}</a>` : ""}</td>
      <td style="white-space:nowrap">${P.esc(m.telefone)}${wa ? `<span class="mini-links"><a class="bt bt-icone" href="${wa}" target="_blank" rel="noopener" data-link aria-label="Abrir conversa no WhatsApp" title="Abrir no WhatsApp">${P.ic("whats", "ic-p")}</a></span>` : ""}</td>
      <td><span class="pilula p-bolinha ${corSit(m.situacao)}">${nomeSit(m.situacao)}</span></td>
      <td class="corta fraco" title="${P.esc(m.obs)}">${P.esc(m.obs)}</td>
      <td class="fraco" style="white-space:nowrap">${P.dataBR(m.ultimo_contato)}</td>
    </tr>`;
  }

  function desenhar() {
    const lista = filtradas();
    const conta = (s) => marcas.filter((m) => m.situacao === s).length;
    P.$("#chipsSit", el).innerHTML = [["todas", "Todas"], ...SITUACOES].map(([v, t]) =>
      `<button type="button" class="chip" data-sit="${v}" aria-pressed="${filtro === v}">${t} <small>${v === "todas" ? marcas.length : conta(v)}</small></button>`).join("");
    P.$("#corpoMarcas", el).innerHTML = lista.map(linha).join("") ||
      `<tr><td colspan="7" class="vazio">${marcas.length ? "Nenhuma marca encontrada com essa busca." : "A sua base ainda está vazia. Clique em \"Adicionar marca\"."}</td></tr>`;
  }

  function abrirForm(m = null) {
    P.formulario({
      titulo: m ? "Editar marca" : "Adicionar marca",
      valores: m || { situacao: "lead", ultimo_contato: P.hoje() },
      campos: [
        { n: "nome", r: "Marca", obrig: true },
        { n: "instagram", r: "Instagram", meia: true, ajuda: "Ex: @marca" },
        { n: "email", r: "E-mail", tipo: "email", meia: true },
        { n: "telefone", r: "Telefone / WhatsApp", tipo: "tel", meia: true, ajuda: "Com DDD. Ex: 16 99999-9999" },
        { n: "situacao", r: "Situação", tipo: "opcoes", meia: true, opcoes: SITUACOES.map(([v, t]) => [v, t]) },
        { n: "ultimo_contato", r: "Último contato", tipo: "data", meia: true },
        { n: "obs", r: "Observação", tipo: "area" }
      ],
      salvar: async (dados) => {
        if (dados.instagram) dados.instagram = "@" + P.instaUsuario(dados.instagram);
        const ok = await P.gravar("marcas", dados, m ? m.id : null);
        if (ok) { P.toast(m ? "Marca atualizada" : "Marca adicionada"); await carregar(); desenhar(); }
        return ok;
      },
      apagar: m ? async () => { const ok = await P.apagar("marcas", m.id, `Apagar ${m.nome || "esta marca"} da sua base?`); if (ok) { await carregar(); desenhar(); } return ok; } : null
    });
  }

  function baixar() {
    const lista = filtradas().filter((m) => !m.exemplo);
    if (!lista.length) { P.toast("Não tem nenhuma marca para baixar ainda", true); return; }
    P.baixarCSV(`marcas-${P.hoje()}.csv`,
      ["Marca", "Instagram", "E-mail", "Telefone", "Situação", "Observação", "Último contato", "Origem"],
      lista.map((m) => [m.nome, m.instagram, m.email, m.telefone, nomeSit(m.situacao), m.obs, P.dataBR(m.ultimo_contato), m.origem === "site" ? "Formulário do site" : "Painel"]));
  }

  async function carregar() {
    const lidas = await P.ler("marcas", (q) => q.select("*").order("criado_em", { ascending: false }));
    marcas = lidas || [];
    P.conferirCampos("marcas", marcas, CAMPOS);
  }

  P.abas.marcas = {
    titulo: "Marcas",
    async montar(alvo) {
      el = alvo;
      busca = ""; filtro = "todas";
      P.acoes(`<button type="button" class="bt" id="btBaixarMarcas">${P.ic("baixar", "ic-p")}Baixar CSV</button>
               <button type="button" class="bt bt-rosa" id="btNovaMarca">${P.ic("mais", "ic-p")}Adicionar marca</button>`);
      P.$("#btNovaMarca").addEventListener("click", () => abrirForm());
      P.$("#btBaixarMarcas").addEventListener("click", baixar);
      await carregar();
      el.innerHTML = `<div class="caixa">
        <div class="ferramentas">
          <label class="busca">${P.ic("busca", "ic-p")}<input class="entrada" type="search" id="buscaMarcas" placeholder="Buscar por nome, @ ou e-mail" aria-label="Buscar marcas"></label>
          <div class="chips" id="chipsSit"></div>
        </div>
        <div class="tabela-rolagem"><table class="tabela">
          <thead><tr><th>Marca</th><th>Instagram</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Observação</th><th>Último contato</th></tr></thead>
          <tbody id="corpoMarcas"></tbody>
        </table></div>
      </div>`;
      desenhar();
      P.$("#buscaMarcas", el).addEventListener("input", (e) => { busca = e.target.value; desenhar(); });
      el.addEventListener("click", (e) => {
        const chip = e.target.closest("[data-sit]");
        if (chip) { filtro = chip.dataset.sit; desenhar(); return; }
        if (e.target.closest("[data-link]")) return; /* WhatsApp, Instagram e e-mail abrem sem editar */
        const tr = e.target.closest("tr[data-id]");
        if (tr) abrirForm(marcas.find((m) => m.id === Number(tr.dataset.id)));
      });
    }
  };
})();
