/* =====================================================================
   O QUE AS PESSOAS FIZERAM NO SITE (tabela "eventos")
   Usado pela aba Portfólio. Junta os passos de cada visita pelo código
   "sessao" e mostra: contatos e redes, até onde rolaram, onde saíram,
   quanto tempo ficaram, o que clicaram e as últimas visitas uma a uma.
   ===================================================================== */
(() => {
  /* As partes principais do site, na ordem em que aparecem */
  const SECOES = [
    ["inicio", "Início (capa)"], ["sobre", "Sobre"], ["destaques", "Destaques"], ["trabalhos", "Vídeos por nicho"],
    ["carrosseis", "Carrosséis"], ["fotos", "Fotos"], ["bastidores", "Bastidores"], ["servicos", "Formatos"],
    ["valores", "Valores"], ["numeros", "Números e avaliações"], ["contato", "Contato"]
  ];
  const nomeSecao = (id) => (SECOES.find((s) => s[0] === id) || [id, id || "?"])[1];
  const posSecao = (id) => { const i = SECOES.findIndex((s) => s[0] === id); return i < 0 ? 99 : i; };
  const CONTATOS = ["WhatsApp", "Formulário enviado", "E-mail", "Instagram", "TikTok"];
  const ehContato = (alvo) => CONTATOS.includes(alvo);

  const tempo = (s) => {
    s = Math.max(0, Math.round(P.num(s)));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return m < 60 ? `${m}min ${String(s % 60).padStart(2, "0")}s` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}min`;
  };
  const quando = (iso) => { const d = new Date(iso); return `${P.diaMes(P.iso(d))} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  const mediana = (l) => { if (!l.length) return 0; const o = [...l].sort((a, b) => a - b), m = Math.floor(o.length / 2); return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
  const pct = (a, b) => Math.round(P.divide(a, b) * 100);
  const barras = (linhas, total, vazio) => linhas.length
    ? `<div class="origens">${linhas.map(([nome, n, extra]) => `<div class="origem"><span>${P.esc(nome)}</span><em>${extra != null ? extra : `${n} · ${pct(n, total)}%`}</em><div class="trilho"><i style="width:${pct(n, total)}%"></i></div></div>`).join("")}</div>`
    : `<div class="vazio">${vazio}</div>`;
  const top = (mapa, n) => Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, n);

  /* Junta os eventos de cada visita */
  function montarVisitas(eventos) {
    const mapa = new Map();
    [...eventos].sort((a, b) => String(a.data).localeCompare(String(b.data))).forEach((ev) => {
      const k = ev.sessao || "sem-codigo";
      if (!mapa.has(k)) mapa.set(k, { inicio: ev.data, fim: ev.data, origem: "", secoes: new Set(), passos: [], tempo: 0, saiu: "" });
      const v = mapa.get(k);
      v.fim = ev.data;
      v.tempo = Math.max(v.tempo, P.num(ev.valor));
      if (ev.tipo === "entrada" && !v.origem) v.origem = ev.alvo || "Direto";
      if (ev.tipo === "secao") v.secoes.add(ev.alvo);
      if (ev.tipo === "clique") v.passos.push(ev.alvo);
      if (ev.tipo === "formulario") v.passos.push("Formulário enviado");
      if (ev.tipo === "saida") v.saiu = ev.alvo;
    });
    return [...mapa.values()];
  }

  P.comportamento = (eventos) => {
    const titulo = `<div class="caixa-titulo" style="margin:6px 2px -4px"><h2>O que as pessoas fizeram no site</h2><span class="ajuda">14 dias</span></div>`;
    if (eventos === null) return `${titulo}<div class="caixa vazio">Para ver isto, rode o banco.sql de novo no Supabase: ele cria a tabela "eventos", que guarda o que as pessoas fazem no site.</div>`;
    if (!eventos.length) return `${titulo}<div class="caixa vazio">Quando as pessoas começarem a visitar o seu portfólio, aqui aparece o que elas clicaram (Instagram, TikTok, WhatsApp, vídeos), até onde rolaram a página, onde saíram, quanto tempo ficaram e se mandaram o formulário.</div>`;

    const visitas = montarVisitas(eventos);
    const total = visitas.length;

    /* Contato e redes */
    const cliques = {}, visitasCom = {};
    visitas.forEach((v) => {
      v.passos.forEach((p) => { cliques[p] = (cliques[p] || 0) + 1; });
      new Set(v.passos).forEach((p) => { visitasCom[p] = (visitasCom[p] || 0) + 1; });
    });
    const contatos = CONTATOS.map((c) => [c, visitasCom[c] || 0, `${P.plural(cliques[c] || 0, "clique", "cliques")} · ${P.plural(visitasCom[c] || 0, "visita", "visitas")}`]);
    const fizeramContato = visitas.filter((v) => v.passos.some((p) => p === "WhatsApp" || p === "Formulário enviado" || p === "E-mail")).length;

    /* Até onde rolaram (a parte mais funda que cada visita alcançou) */
    const chegaram = SECOES.map(([id, nome]) => [nome, visitas.filter((v) => [...v.secoes].some((s) => posSecao(s) >= posSecao(id))).length]);

    /* Onde saíram e quanto tempo ficaram */
    const saidas = {};
    visitas.forEach((v) => { const s = nomeSecao(v.saiu || [...v.secoes].sort((a, b) => posSecao(b) - posSecao(a))[0] || "inicio"); saidas[s] = (saidas[s] || 0) + 1; });
    const tipico = mediana(visitas.map((v) => v.tempo));

    /* Vídeos e outros cliques */
    const videos = {}, outros = {};
    Object.entries(cliques).forEach(([alvo, n]) => {
      if (/^(Vídeo|Destaque): /.test(alvo)) videos[alvo] = n;
      else if (!ehContato(alvo)) outros[alvo] = n;
    });
    const somaVideos = Object.values(videos).reduce((a, b) => a + b, 0);
    const somaOutros = Object.values(outros).reduce((a, b) => a + b, 0);

    /* Últimas visitas, uma a uma */
    const ultimas = [...visitas].sort((a, b) => String(b.inicio).localeCompare(String(a.inicio))).slice(0, 20);
    const linhas = ultimas.map((v) => {
      const funda = [...v.secoes].sort((a, b) => posSecao(b) - posSecao(a))[0];
      const passos = v.passos.slice(0, 8).map((p) => `<span class="pilula ${ehContato(p) ? "p-rosa" : ""}" title="${P.esc(p)}" style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${P.esc(p)}</span>`).join(" ");
      return `<tr>
        <td style="white-space:nowrap">${quando(v.inicio)}</td>
        <td>${P.esc(v.origem || "Direto")}</td>
        <td class="num">${tempo(v.tempo)}</td>
        <td>${funda ? P.esc(nomeSecao(funda)) : '<span class="fraco">só a capa</span>'}</td>
        <td class="fraco">${v.saiu ? P.esc(nomeSecao(v.saiu)) : ""}</td>
        <td><div style="display:flex;flex-wrap:wrap;gap:4px">${passos || '<span class="fraco">não clicou em nada</span>'}${v.passos.length > 8 ? ` <span class="fraco">+${v.passos.length - 8}</span>` : ""}</div></td>
      </tr>`;
    }).join("");

    return `${titulo}
      <div class="numeros">
        <div class="numero"><span>Visitas acompanhadas</span><strong>${total}</strong></div>
        <div class="numero"><span>Entraram em contato</span><strong>${fizeramContato}</strong><small>${pct(fizeramContato, total)}% das visitas (WhatsApp, formulário ou e-mail)</small></div>
        <div class="numero"><span>Tempo típico no site</span><strong>${tempo(tipico)}</strong></div>
        <div class="numero"><span>Chegaram até o Contato</span><strong>${pct(chegaram[chegaram.length - 1][1], total)}%</strong></div>
      </div>
      <div class="duas-colunas">
        <div class="caixa"><div class="caixa-titulo"><h2>Contato e redes</h2><span class="ajuda">quantas visitas clicaram</span></div>${barras(contatos, total, "")}</div>
        <div class="caixa"><div class="caixa-titulo"><h2>Até onde rolaram</h2><span class="ajuda">% das visitas que chegaram em cada parte</span></div>${barras(chegaram, total, "")}</div>
      </div>
      <div class="duas-colunas">
        <div class="caixa"><div class="caixa-titulo"><h2>Vídeos e destaques mais abertos</h2></div>${barras(top(videos, 8), somaVideos, "Ninguém abriu um vídeo ainda.")}</div>
        <div class="caixa"><div class="caixa-titulo"><h2>Onde saíram do site</h2><span class="ajuda">a parte que estavam vendo</span></div>${barras(top(saidas, 8), total, "")}</div>
      </div>
      <div class="caixa"><div class="caixa-titulo"><h2>Outros cliques</h2><span class="ajuda">menu, filtros, nichos e links</span></div>${barras(top(outros, 10), somaOutros, "Nenhum outro clique ainda.")}</div>
      <div class="caixa"><div class="caixa-titulo"><h2>Últimas visitas</h2><span class="ajuda">o caminho de cada pessoa, da mais recente para a mais antiga</span></div>
        <div class="tabela-rolagem"><table class="tabela">
          <thead><tr><th>Quando</th><th>De onde veio</th><th class="num">Tempo</th><th>Rolou até</th><th>Saiu em</th><th>O que clicou</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table></div>
      </div>`;
  };
})();
