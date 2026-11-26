/* =====================================================================
   NÚCLEO DO PAINEL
   1. Confere a sessão ANTES de mostrar qualquer coisa
   2. Ferramentas usadas por todas as abas (datas, dinheiro, janelas...)
   3. Conversa com o banco sem nunca deixar o painel em branco
   ===================================================================== */

/* ---------- 1. CONFERIR A SESSÃO (a primeira coisa de todas) ---------- */
const sessaoConferida = (async () => {
  if (!window.banco) return { semBanco: true };
  try {
    const { data } = await banco.auth.getSession();
    if (!data || !data.session) { location.replace("../login/"); return null; }
    return { sessao: data.session };
  } catch (e) {
    location.replace("../login/");
    return null;
  }
})();

const P = (window.P = { abas: {}, avisos: new Map(), atual: null });

/* ---------- 2. FERRAMENTAS ---------- */
P.$ = (s, el = document) => el.querySelector(s);
P.$$ = (s, el = document) => [...el.querySelectorAll(s)];
P.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/* Texto da biblioteca: deixa passar só negrito e itálico */
P.textoRico = (s) => P.esc(s).replace(/&lt;(\/?)(b|em|strong|i|br)&gt;/g, "<$1$2>");

/* Ícones de traço */
const ICONES = {
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/>',
  pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  maleta: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
  checklist: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  olho: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  olhoFechado: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>',
  alca: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  lixo: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  estrela: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  esquerda: '<path d="m15 18-6-6 6-6"/>',
  direita: '<path d="m9 18 6-6-6-6"/>',
  baixo: '<path d="m6 9 6 6 6-6"/>',
  whats: '<path d="M21 11.5a8.4 8.4 0 0 1-12.5 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
  insta: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  fechar: '<path d="M18 6 6 18M6 6l12 12"/>',
  alerta: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  externo: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  play: '<path d="m6 3 14 9-14 9z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  importar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>'
};
P.ic = (nome, extra = "") => `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome] || ""}</svg>`;

/* Datas (sempre no fuso do seu computador, nunca em UTC) */
P.iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
P.hoje = () => P.iso(new Date());
P.paraData = (iso) => { const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number); return new Date(a, (m || 1) - 1, d || 1); };
P.somarDias = (iso, n) => { const d = P.paraData(iso); d.setDate(d.getDate() + n); return P.iso(d); };
P.diasAte = (iso) => Math.round((P.paraData(iso) - P.paraData(P.hoje())) / 86400000);
P.dataBR = (iso) => { if (!iso) return ""; const [a, m, d] = String(iso).slice(0, 10).split("-"); return a && m && d ? `${d}/${m}/${a}` : ""; };
P.diaMes = (iso) => P.dataBR(iso).slice(0, 5);
P.plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/* Números e dinheiro: nunca mostra NaN */
P.num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
P.moeda = (v) => P.num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
P.divide = (a, b) => (P.num(b) > 0 ? P.num(a) / P.num(b) : 0);
P.lerDinheiro = (txt) => {
  let s = String(txt || "").replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};
P.normal = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Links */
P.youtubeId = (link) => {
  const m = String(link || "").match(/(?:youtube\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1] : "";
};
P.instaUsuario = (s) => String(s || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@/, "");
P.whatsLink = (tel) => {
  let n = String(tel || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.length <= 11) n = "55" + n.replace(/^0+/, "");
  return "https://wa.me/" + n;
};

/* Planilha CSV que abre certinho no Excel (com acento e separada por ponto e vírgula) */
P.baixarCSV = (arquivo, cabecalho, linhas) => {
  const cel = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const texto = "﻿" + [cabecalho, ...linhas].map((l) => l.map(cel).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: arquivo });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/* Aviso rápido no pé da tela */
P.toast = (texto, erro = false) => {
  P.$$(".toast").forEach((t) => t.remove());
  const t = Object.assign(document.createElement("div"), { className: "toast" + (erro ? " erro" : ""), textContent: texto });
  t.setAttribute("role", "status");
  document.body.appendChild(t);
  setTimeout(() => t.remove(), erro ? 6000 : 2600);
};

/* Faixa de aviso fixa no topo (problemas no banco). Mesma chave não repete. */
P.avisar = (chave, texto) => { P.avisos.set(chave, texto); P.mostrarAvisos(); };
P.mostrarAvisos = () => {
  const el = P.$("#avisos");
  el.innerHTML = [...P.avisos].map(([k, t]) => `
    <div class="faixa faixa-erro" data-chave="${P.esc(k)}">${P.ic("alerta")}<div>${P.esc(t)}</div>
      <button type="button" class="bt-icone bt" style="margin-left:auto;width:24px;height:24px" aria-label="Fechar aviso">${P.ic("fechar", "ic-p")}</button></div>`).join("");
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("#avisos .bt-icone");
  if (b) { P.avisos.delete(b.closest(".faixa").dataset.chave); P.mostrarAvisos(); }
});

/* ---------- 3. CONVERSA COM O BANCO ---------- */
/* Transforma o erro técnico numa frase que dá pra entender */
P.erroAmigavel = (erro, tabela) => {
  const cod = String((erro && erro.code) || "");
  const msg = String((erro && erro.message) || erro || "");
  const baixo = msg.toLowerCase();
  if (cod === "42P01" || cod === "PGRST205" || /could not find the table|relation .* does not exist/.test(baixo))
    return `A tabela "${tabela}" não existe no banco. Rode o arquivo banco.sql no Supabase (SQL Editor) e recarregue o painel.`;
  if (cod === "PGRST204" || cod === "42703" || /column/.test(baixo)) {
    const m = msg.match(/'([^']+)' column/) || msg.match(/column "?[\w]*\.?([\w]+)"? does not exist/);
    return `Falta o campo "${m ? m[1] : "?"}" na tabela "${tabela}". Rode o banco.sql de novo no Supabase.`;
  }
  if (cod === "42501" || /permission denied|row-level security/.test(baixo))
    return `O banco não deixou mexer na tabela "${tabela}". Confira se você entrou com o seu e-mail e se o banco.sql foi rodado inteiro.`;
  if (cod === "23514" || /check constraint/.test(baixo))
    return `Um dos valores não é aceito na tabela "${tabela}". Confira as opções escolhidas.`;
  if (/jwt|token/.test(baixo)) return "A sua sessão expirou. Clique em Sair e entre de novo.";
  if (/fetch|network|failed to/.test(baixo)) return "Sem conexão com o banco agora. Confira a internet e tente de novo.";
  return `Não consegui falar com a tabela "${tabela}" agora. Tente de novo em instantes.`;
};

P.faltando = new Set();
P.tabelaFalta = (e) => /^(42P01|PGRST205)$/.test(String(e && e.code)) || /could not find the table|relation .* does not exist/i.test(String(e && e.message));

/* Lê uma tabela. Se der problema, avisa e devolve null (o resto do painel segue). */
P.ler = async (tabela, montar = (q) => q.select("*")) => {
  try {
    const { data, error } = await montar(banco.from(tabela));
    if (error) throw error;
    return data || [];
  } catch (e) {
    /* Tabela que não existe: junta todas num aviso só, com o passo a passo */
    if (P.tabelaFalta(e)) {
      P.faltando.add(tabela);
      P.avisar("tabelas-faltando", `O banco ainda não foi preparado: faltam as tabelas ${[...P.faltando].join(", ")}. ` +
        `Para resolver: no site do Supabase, abra o projeto, clique em SQL Editor e depois em New query, cole o arquivo banco.sql inteiro e clique em Run. ` +
        `Se aparecer "Success", recarregue esta página. Se aparecer uma mensagem de erro, me mande um print dela.`);
      return null;
    }
    P.avisar("ler:" + tabela, P.erroAmigavel(e, tabela));
    /* Se o problema é um campo que falta, tenta de novo lendo a tabela do jeito mais simples */
    if (/42703|PGRST204|PGRST100/.test(String(e && e.code)) || /column/i.test(String(e && e.message))) {
      try {
        const { data, error } = await banco.from(tabela).select("*").limit(5000);
        if (!error) return data || [];
      } catch (e2) { /* segue sem os dados */ }
    }
    return null;
  }
};

/* Confere se os campos que o painel usa existem (dá pra ver quando a tabela tem linhas) */
P.conferirCampos = (tabela, linhas, campos) => {
  if (!linhas || !linhas.length) return;
  const faltam = campos.filter((c) => !(c in linhas[0]));
  if (faltam.length) P.avisar("campos:" + tabela, `Na tabela "${tabela}" faltam os campos: ${faltam.join(", ")}. O painel segue funcionando, mas rode o banco.sql de novo para completar.`);
};

/* Gravar, editar e apagar. Devolvem true quando deu certo. */
P.gravar = async (tabela, dados, id = null, campoId = "id") => {
  try {
    const q = id == null ? banco.from(tabela).insert(dados) : banco.from(tabela).update(dados).eq(campoId, id);
    const { error } = await q;
    if (error) throw error;
    return true;
  } catch (e) {
    P.toast(P.erroAmigavel(e, tabela), true);
    return false;
  }
};
P.apagar = async (tabela, id, pergunta = "Apagar este item? Não dá para desfazer.") => {
  if (!confirm(pergunta)) return false;
  try {
    const { error } = await banco.from(tabela).delete().eq("id", id);
    if (error) throw error;
    P.toast("Apagado");
    return true;
  } catch (e) {
    P.toast(P.erroAmigavel(e, tabela), true);
    return false;
  }
};

/* ---------- JANELAS ---------- */
P.fecharJanela = () => { const j = P.$(".janela-fundo"); if (j) j.remove(); document.removeEventListener("keydown", P._esc); };
P._esc = (e) => { if (e.key === "Escape") P.fecharJanela(); };
P.janela = ({ titulo, corpo, pe = "", larga = false }) => {
  P.fecharJanela();
  const f = document.createElement("div");
  f.className = "janela-fundo";
  f.innerHTML = `<div class="janela${larga ? " larga" : ""}" role="dialog" aria-modal="true" aria-label="${P.esc(titulo)}">
    <div class="janela-topo"><h2>${titulo}</h2><button type="button" class="bt bt-icone" data-fechar aria-label="Fechar">${P.ic("fechar")}</button></div>
    <div class="janela-corpo">${corpo}</div>
    ${pe ? `<div class="janela-pe">${pe}</div>` : ""}
  </div>`;
  f.addEventListener("mousedown", (e) => { if (e.target === f) P.fecharJanela(); });
  f.addEventListener("click", (e) => { if (e.target.closest("[data-fechar]")) P.fecharJanela(); });
  document.body.appendChild(f);
  document.addEventListener("keydown", P._esc);
  return f;
};

/* Formulário em janela.
   campos: [{ n: nome no banco, r: rótulo, tipo: texto|email|tel|data|numero|dinheiro|area|opcoes|caixinha, opcoes: [[valor, texto]], lista: [...sugestões], meia: true, obrig: true, ajuda }] */
P.formulario = ({ titulo, campos, valores = {}, salvar, apagar }) => {
  const campoHtml = (c, i) => {
    const id = "f" + i, v = valores[c.n];
    const lista = c.lista && c.lista.length ? ` list="${id}l"` : "";
    const datalist = lista ? `<datalist id="${id}l">${c.lista.map((x) => `<option value="${P.esc(x)}">`).join("")}</datalist>` : "";
    let input;
    if (c.tipo === "area") input = `<textarea id="${id}" name="${c.n}">${P.esc(v)}</textarea>`;
    else if (c.tipo === "opcoes") input = `<select id="${id}" name="${c.n}">${c.opcoes.map(([val, txt]) => `<option value="${P.esc(val)}"${String(v) === String(val) ? " selected" : ""}>${P.esc(txt)}</option>`).join("")}</select>`;
    else if (c.tipo === "caixinha") return `<label class="campo-check"><input type="checkbox" name="${c.n}"${v ? " checked" : ""}> ${P.esc(c.r)}</label>`;
    else if (c.tipo === "dinheiro") input = `<input id="${id}" name="${c.n}" type="text" inputmode="decimal" placeholder="0,00" value="${v == null || v === "" ? "" : P.esc(P.num(v).toFixed(2).replace(".", ","))}">`;
    else {
      const tipo = { data: "date", numero: "number", email: "email", tel: "tel" }[c.tipo] || "text";
      input = `<input id="${id}" name="${c.n}" type="${tipo}"${tipo === "number" ? ' min="0" step="1"' : ""} value="${P.esc(v == null ? "" : v)}"${lista}${c.obrig ? " required" : ""} autocomplete="off">${datalist}`;
    }
    return `<div class="campo"${c.meia ? "" : ' style="grid-column:1/-1"'}><label for="${id}">${P.esc(c.r)}</label>${input}${c.ajuda ? `<span class="ajuda">${c.ajuda}</span>` : ""}</div>`;
  };
  const f = P.janela({
    titulo: P.esc(titulo),
    corpo: `<form id="formJanela" class="grade-2" novalidate>${campos.map(campoHtml).join("")}<button type="submit" hidden></button></form>`,
    pe: `${apagar ? `<button type="button" class="bt bt-perigo" data-apagar>${P.ic("lixo", "ic-p")}Apagar</button>` : ""}
         <div class="direita"><button type="button" class="bt" data-fechar>Cancelar</button><button type="button" class="bt bt-rosa" data-salvar>Salvar</button></div>`
  });
  const form = P.$("#formJanela", f);
  const primeiro = form.querySelector("input:not([type=checkbox]),select,textarea");
  if (primeiro) setTimeout(() => primeiro.focus(), 30);
  const enviar = async () => {
    const dados = {};
    for (const c of campos) {
      const el = form.elements[c.n];
      if (!el) continue;
      let v = c.tipo === "caixinha" ? el.checked : el.value.trim();
      if (c.tipo === "numero") v = v === "" ? 0 : Math.max(0, Math.round(P.num(v)));
      if (c.tipo === "dinheiro") v = P.lerDinheiro(v);
      if (c.tipo === "data") v = v || null;
      if (c.obrig && (v === "" || v == null)) { el.focus(); P.toast(`Preencha o campo "${c.r}"`, true); return; }
      dados[c.n] = v;
    }
    const bt = P.$("[data-salvar]", f);
    bt.disabled = true;
    const ok = await salvar(dados);
    if (ok) P.fecharJanela(); else bt.disabled = false;
  };
  P.$("[data-salvar]", f).addEventListener("click", enviar);
  form.addEventListener("submit", (e) => { e.preventDefault(); enviar(); });
  if (apagar) P.$("[data-apagar]", f).addEventListener("click", async () => { if (await apagar()) P.fecharJanela(); });
};

/* Etiqueta "exemplo" para as linhas de exemplo */
P.seloExemplo = (linha) => (linha && linha.exemplo ? ' <span class="pilula p-exemplo">exemplo</span>' : "");

/* ---------- NAVEGAÇÃO ENTRE AS ABAS ---------- */
P.acoes = (html) => { P.$("#acoesAba").innerHTML = html || ""; };
P.ir = async (nome, opcoes = {}) => {
  if (!P.abas[nome]) nome = "portfolio";
  const aba = P.abas[nome];
  P.atual = nome;
  if (location.hash !== "#" + nome) history.replaceState(null, "", "#" + nome);
  P.$$(".menu-item[data-aba]").forEach((b) => b.classList.toggle("ativo", b.dataset.aba === nome));
  P.$$(".menu-item[data-aba]").forEach((b) => b.toggleAttribute("aria-current", b.dataset.aba === nome));
  P.$("#tituloAba").textContent = aba.titulo;
  document.title = aba.titulo + " · Painel";
  document.body.classList.remove("menu-aberto");
  P.acoes("");
  /* Troca a área da aba por uma nova, para não acumular cliques de abas anteriores */
  const velho = P.$("#aba"), el = velho.cloneNode(false);
  velho.replaceWith(el);
  el.innerHTML = '<div class="caixa vazio">Carregando...</div>';
  try {
    await aba.montar(el, opcoes);
  } catch (e) {
    console.error(e);
    el.innerHTML = '<div class="caixa vazio">Esta aba não conseguiu abrir agora. As outras continuam funcionando.</div>';
    P.avisar("aba:" + nome, `A aba ${aba.titulo} teve um problema ao abrir. Recarregue a página; se continuar, me mostre este aviso.`);
  }
};

/* ---------- INÍCIO ---------- */
(async () => {
  const r = await sessaoConferida;
  if (r === null) return; /* indo para o login */
  await new Promise((ok) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", ok) : ok()));

  P.$$("[data-ic]").forEach((s) => { s.outerHTML = P.ic(s.dataset.ic); });

  if (r.semBanco) {
    P.$("#aba").innerHTML = '<div class="caixa vazio">Não consegui carregar a conexão com o banco. Confira a internet e recarregue a página.</div>';
    document.documentElement.classList.remove("carregando");
    return;
  }

  P.$("#meuEmail").textContent = r.sessao.user.email || "";
  P.$("#btSair").addEventListener("click", async () => {
    try { await banco.auth.signOut(); } catch (e) { /* sai mesmo assim */ }
    location.replace("../login/");
  });
  banco.auth.onAuthStateChange((evento) => { if (evento === "SIGNED_OUT") location.replace("../login/"); });

  P.$$(".menu-item[data-aba]").forEach((b) => b.addEventListener("click", () => P.ir(b.dataset.aba)));
  P.$("#btMenu").addEventListener("click", () => document.body.classList.add("menu-aberto"));
  P.$("#menuFundo").addEventListener("click", () => document.body.classList.remove("menu-aberto"));
  window.addEventListener("hashchange", () => { const n = location.hash.slice(1); if (n && n !== P.atual && P.abas[n]) P.ir(n); });

  document.documentElement.classList.remove("carregando");
  P.ir(location.hash.slice(1) || "portfolio");
})();
