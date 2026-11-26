/* =====================================================================
   AJUSTES QUE VOCÊ MESMA EDITA NO PAINEL
   Colunas do quadro de campanhas e lista de status (nome, cor, ordem).
   Ficam na tabela "ajustes" do banco. Se a tabela ainda não existir,
   ficam guardados neste navegador até você rodar o banco.sql.
   ===================================================================== */
(() => {
  const CORES = [["cinza", "Cinza"], ["rosa", "Rosa"], ["roxo", "Roxo"], ["amarelo", "Amarelo"], ["azul", "Azul"],
    ["verde", "Verde"], ["vermelho", "Vermelho"], ["laranja", "Laranja"], ["marrom", "Marrom"]];
  const TIPOS_COLUNA = [["andamento", "Em andamento"], ["finalizada", "Finalizada (conta como concluída)"], ["arquivada", "Arquivada (fora das contas e do calendário)"]];

  /* Como começa, igual ao seu Notion */
  const PADRAO = {
    "campanhas.etapas": [
      { nome: "Negociação", cor: "rosa", tipo: "andamento" }, { nome: "Pré-Produção", cor: "roxo", tipo: "andamento" },
      { nome: "Produção", cor: "amarelo", tipo: "andamento" }, { nome: "Pós-Produção", cor: "azul", tipo: "andamento" },
      { nome: "Aguardando Pagamento", cor: "cinza", tipo: "andamento" }, { nome: "Finalizado", cor: "verde", tipo: "finalizada" },
      { nome: "Arquivado", cor: "cinza", tipo: "arquivada" }
    ],
    "campanhas.status": [
      ["Campanha Pausada", "cinza"], ["Sem Retorno da Marca", "cinza"], ["Em Negociação", "cinza"], ["Aguardando Produtos", "cinza"],
      ["Enviar Contrato", "cinza"], ["Aguardando Contrato", "cinza"], ["Regravar", "azul"], ["Criar Roteiro", "amarelo"],
      ["Roteiro Criado", "laranja"], ["Roteiro Enviado", "laranja"], ["Aguardando Apv. Roteiro", "laranja"], ["Gravar", "azul"],
      ["Narrar", "roxo"], ["Editar", "roxo"], ["Enviar para Edição", "roxo"], ["Aguardando Edição", "roxo"],
      ["Enviar para Aprovação", "rosa"], ["Aguardando Aprovação", "rosa"], ["Postar", "rosa"], ["Aguardando Pagamento", "vermelho"],
      ["Emitir NF", "vermelho"], ["Concluído", "verde"]
    ].map(([nome, cor]) => ({ nome, cor }))
  };

  const cache = {};
  let semTabela = false;
  const local = (chave) => { try { return JSON.parse(localStorage.getItem("painel-ajuste:" + chave) || "null"); } catch (e) { return null; } };
  const valido = (v) => Array.isArray(v) && v.length && v.every((x) => x && typeof x.nome === "string" && x.nome.trim());

  P.ajustes = {
    CORES, TIPOS_COLUNA,
    /* Lê do banco (ou do navegador, ou o padrão) */
    async carregar(chave) {
      if (cache[chave]) return cache[chave];
      let valor = null;
      if (!semTabela) {
        try {
          const { data, error } = await banco.from("ajustes").select("valor").eq("chave", chave).maybeSingle();
          if (error) throw error;
          if (data && valido(data.valor)) valor = data.valor;
        } catch (e) {
          if (P.tabelaFalta(e)) semTabela = true;
        }
      }
      if (!valor && valido(local(chave))) valor = local(chave);
      cache[chave] = (valor || PADRAO[chave] || []).map((x) => ({ ...x }));
      return cache[chave];
    },
    pegar: (chave) => cache[chave] || (PADRAO[chave] || []).map((x) => ({ ...x })),
    async salvar(chave, valor) {
      cache[chave] = valor;
      try { localStorage.setItem("painel-ajuste:" + chave, JSON.stringify(valor)); } catch (e) { /* ok */ }
      if (semTabela) {
        P.avisar("ajustes-local", "Suas colunas e status ficaram guardados só neste navegador. Rode o banco.sql de novo no Supabase para eles ficarem salvos no banco e valerem no celular também.");
        return true;
      }
      try {
        const { error } = await banco.from("ajustes").upsert({ chave, valor, atualizado_em: new Date().toISOString() });
        if (error) throw error;
        return true;
      } catch (e) {
        if (P.tabelaFalta(e)) { semTabela = true; return P.ajustes.salvar(chave, valor); }
        P.toast(P.erroAmigavel(e, "ajustes"), true);
        return false;
      }
    },

    /* Editor: lista com nome, cor, (tipo), setas para mudar a ordem e lixeira.
       contar(nome) diz quantas campanhas usam aquele nome.
       aoSalvar({ lista, renomeados: [[antigo, novo]], apagados: [[nome, destino]] }) */
    editar({ titulo, chave, comTipo, campo, contar, aoSalvar }) {
      const itens = P.ajustes.pegar(chave).map((x) => ({ ...x, original: x.nome }));
      const apagados = []; /* { nome, destino } */
      const opcoes = (lista, v) => lista.map(([val, txt]) => `<option value="${val}"${val === v ? " selected" : ""}>${P.esc(txt)}</option>`).join("");

      const desenhar = (f) => {
        const corpo = P.$(".janela-corpo", f);
        corpo.innerHTML = `
          <p class="ajuda" style="margin:0">Mude o nome, a cor e a ordem. As campanhas acompanham as mudanças sozinhas.</p>
          <div class="editor-lista">${itens.map((x, i) => `
            <div class="editor-linha" data-i="${i}">
              <div class="editor-setas">
                <button type="button" class="bt bt-icone" data-subir aria-label="Subir"${i === 0 ? " disabled" : ""}>${P.ic("esquerda", "ic-p seta-cima")}</button>
                <button type="button" class="bt bt-icone" data-descer aria-label="Descer"${i === itens.length - 1 ? " disabled" : ""}>${P.ic("esquerda", "ic-p seta-baixo")}</button>
              </div>
              <span class="pilula p-${x.cor || "cinza"} editor-amostra">${P.esc(x.nome || "sem nome")}</span>
              <input class="entrada" data-nome value="${P.esc(x.nome)}" aria-label="Nome" maxlength="60">
              <select class="entrada" data-cor aria-label="Cor">${opcoes(CORES, x.cor)}</select>
              ${comTipo ? `<select class="entrada" data-tipo aria-label="Tipo">${opcoes(TIPOS_COLUNA.map(([v, t]) => [v, t.replace(/ \(.*\)/, "")]), x.tipo || "andamento")}</select>` : ""}
              <span class="fraco editor-conta">${contar(x.original) ? P.plural(contar(x.original), "campanha", "campanhas") : ""}</span>
              <button type="button" class="bt bt-icone" data-tirar aria-label="Apagar">${P.ic("lixo", "ic-p")}</button>
            </div>`).join("")}</div>
          <button type="button" class="bt" data-mais style="justify-self:start">${P.ic("mais", "ic-p")}Adicionar</button>
          ${apagados.length ? `<div class="editor-destinos"><b>O que acontece com as campanhas das que você apagou:</b>${apagados.map((a, j) => `
            <label>As ${P.plural(contar(a.nome), "campanha", "campanhas")} de "${P.esc(a.nome)}" vão para
              <select class="entrada" data-destino="${j}">${itens.map((x) => `<option${x.nome === a.destino ? " selected" : ""}>${P.esc(x.nome)}</option>`).join("")}</select></label>`).join("")}</div>` : ""}
          ${comTipo ? `<p class="ajuda" style="margin:0"><b>Em andamento</b>: conta como ativa. <b>Finalizada</b>: conta como concluída. <b>Arquivada</b>: fica fora das contas e do calendário.</p>` : ""}`;
      };

      const f = P.janela({
        titulo: P.esc(titulo), larga: true, corpo: "",
        pe: `<div class="direita"><button type="button" class="bt" data-fechar>Cancelar</button><button type="button" class="bt bt-rosa" data-salvar-lista>Salvar</button></div>`
      });
      desenhar(f);

      /* digitar e escolher atualizam a lista sem redesenhar tudo */
      f.addEventListener("input", (e) => {
        const linha = e.target.closest(".editor-linha");
        const d = e.target.closest("[data-destino]");
        if (d) { apagados[Number(d.dataset.destino)].destino = d.value; return; }
        if (!linha) return;
        const x = itens[Number(linha.dataset.i)];
        if (e.target.matches("[data-nome]")) x.nome = e.target.value;
        if (e.target.matches("[data-cor]")) x.cor = e.target.value;
        if (e.target.matches("[data-tipo]")) x.tipo = e.target.value;
        const amostra = P.$(".editor-amostra", linha);
        amostra.className = `pilula p-${x.cor} editor-amostra`;
        amostra.textContent = x.nome || "sem nome";
      });
      f.addEventListener("click", async (e) => {
        const linha = e.target.closest(".editor-linha");
        const i = linha ? Number(linha.dataset.i) : -1;
        if (e.target.closest("[data-subir]") && i > 0) { [itens[i - 1], itens[i]] = [itens[i], itens[i - 1]]; return desenhar(f); }
        if (e.target.closest("[data-descer]") && i < itens.length - 1) { [itens[i + 1], itens[i]] = [itens[i], itens[i + 1]]; return desenhar(f); }
        if (e.target.closest("[data-tirar]")) {
          if (itens.length === 1) { P.toast("Precisa ficar pelo menos uma", true); return; }
          const [tirado] = itens.splice(i, 1);
          if (tirado.original && contar(tirado.original)) apagados.push({ nome: tirado.original, destino: itens[0].nome });
          return desenhar(f);
        }
        if (e.target.closest("[data-mais]")) {
          itens.push({ nome: "", cor: "cinza", tipo: "andamento", original: "" });
          desenhar(f);
          const ultimos = P.$$("[data-nome]", f);
          ultimos[ultimos.length - 1].focus();
          return;
        }
        if (e.target.closest("[data-salvar-lista]")) {
          const nomes = itens.map((x) => x.nome.trim());
          if (nomes.some((n) => !n)) { P.toast("Tem uma sem nome. Escreva um nome ou apague a linha.", true); return; }
          if (new Set(nomes.map((n) => n.toLowerCase())).size !== nomes.length) { P.toast("Tem dois nomes iguais. Cada uma precisa de um nome diferente.", true); return; }
          const botao = e.target.closest("[data-salvar-lista]");
          botao.disabled = true;
          const lista = itens.map((x) => ({ nome: x.nome.trim(), cor: x.cor || "cinza", ...(comTipo ? { tipo: x.tipo || "andamento" } : {}) }));
          const renomeados = itens.filter((x) => x.original && x.original !== x.nome.trim()).map((x) => [x.original, x.nome.trim()]);
          /* o destino pode ter sido renomeado depois de escolhido: usa o nome atual */
          const apagadosFinal = apagados.map((a) => {
            const alvo = itens.find((x) => x.nome === a.destino || x.original === a.destino) || itens[0];
            return [a.nome, alvo.nome.trim()];
          });
          const ok = await P.ajustes.salvar(chave, lista) && await aoSalvar({ lista, renomeados, apagados: apagadosFinal, campo });
          if (ok) { P.fecharJanela(); P.toast("Salvo"); } else botao.disabled = false;
        }
      });
    }
  };
})();
