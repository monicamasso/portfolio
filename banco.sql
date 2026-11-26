-- =====================================================================
-- BANCO DE DADOS DO PORTFÓLIO E DO PAINEL DA MÔNICA
--
-- ONDE COLAR: no site do Supabase, abra o seu projeto, clique em
-- "SQL Editor" no menu da esquerda, depois em "New query".
-- Cole TUDO deste arquivo e clique em "Run" (canto de baixo, à direita).
--
-- Pode rodar de novo quantas vezes quiser: nada é apagado nem duplicado.
-- As tabelas que já existem ficam como estão, e as linhas de exemplo
-- só entram quando a tabela está vazia.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. QUEM É A DONA
-- Uma pequena função que responde "sim" só quando quem está logada é a
-- Mônica. Todas as trancas lá embaixo usam ela. Se um dia você trocar o
-- e-mail de login, troque só aqui e rode o arquivo de novo.
-- ---------------------------------------------------------------------
create or replace function public.sou_eu()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'ugcmonicamasso@gmail.com'
$$;


-- ---------------------------------------------------------------------
-- 2. TABELA "videos"
-- Os vídeos que aparecem no portfólio. "ordem" é a posição (arrastar no
-- painel muda isso), "visivel" é o olhinho, "exemplo" marca a linha de
-- exemplo, que nunca aparece no site.
-- ---------------------------------------------------------------------
create table if not exists public.videos (
  id         bigint generated always as identity primary key,
  titulo     text not null default '',
  link       text not null default '',
  nicho      text not null default '',
  formato    text not null default '',
  marca      text not null default '',
  destaque   text not null default '',
  ordem      integer not null default 0,
  visivel    boolean not null default true,
  exemplo    boolean not null default false,
  criado_em  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3. TABELA "marcas"
-- A sua base de contatos de empresas. A situação só aceita quatro
-- valores: lead, conversando, cliente e parada. "origem" diz se a marca
-- foi cadastrada por você no painel ou chegou pelo formulário do site.
-- ---------------------------------------------------------------------
create table if not exists public.marcas (
  id              bigint generated always as identity primary key,
  nome            text not null default '',
  instagram       text not null default '',
  email           text not null default '',
  telefone        text not null default '',
  situacao        text not null default 'lead'
                  check (situacao in ('lead', 'conversando', 'cliente', 'parada')),
  obs             text not null default '',
  ultimo_contato  date,
  origem          text not null default 'painel',
  exemplo         boolean not null default false,
  criado_em       timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 4. TABELA "calendario"
-- O que você vai gravar, editar ou postar, com data e se já foi feito.
-- ---------------------------------------------------------------------
create table if not exists public.calendario (
  id         bigint generated always as identity primary key,
  titulo     text not null default '',
  marca      text not null default '',
  tipo       text not null default 'gravar'
             check (tipo in ('gravar', 'editar', 'postar')),
  data       date not null default current_date,
  status     text not null default 'a fazer'
             check (status in ('a fazer', 'feito')),
  exemplo    boolean not null default false,
  criado_em  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 5. TABELA "campanhas"
-- Os seus trabalhos com marcas, organizados igual ao seu Notion "Produção":
-- etapa = a coluna do quadro (Negociação, Pré-Produção,
-- Produção, Pós-Produção, Aguardando Pagamento, Finalizado, Arquivado) e status = a
-- etiqueta do card (Aguardando Produtos, Criar Roteiro, Gravar...).
-- "valor" é o cachê, "qtd" é quantos vídeos.
-- ---------------------------------------------------------------------
create table if not exists public.campanhas (
  id          bigint generated always as identity primary key,
  campanha    text not null default '',
  cliente     text not null default '',
  tipo        text not null default '',
  status      text not null default 'Aguardando Produtos',
  qtd         integer not null default 1 check (qtd >= 0),
  valor       numeric(12, 2) not null default 0 check (valor >= 0),
  prazo       date,
  pagamento   text not null default '',
  ativa       boolean not null default true,
  favorita    boolean not null default false,
  exemplo     boolean not null default false,
  criado_em   timestamptz not null default now()
);

-- 5.1 Campos do Notion. Se a tabela já existia (do jeito antigo), aqui ela
-- ganha os campos novos e as opções ficam livres, como no Notion.
-- Nada que você já cadastrou é apagado.
alter table public.campanhas add column if not exists etapa text not null default 'Organização';
alter table public.campanhas add column if not exists emoji text not null default '';
alter table public.campanhas add column if not exists permuta numeric(12, 2) not null default 0;
alter table public.campanhas add column if not exists nota_fiscal text not null default '';
alter table public.campanhas add column if not exists contrato text not null default '';
alter table public.campanhas add column if not exists prioridade text not null default '';
alter table public.campanhas add column if not exists plataforma text not null default '';
alter table public.campanhas add column if not exists telefone text not null default '';
alter table public.campanhas add column if not exists previsao_pagamento date;
alter table public.campanhas add column if not exists obs text not null default '';
alter table public.campanhas add column if not exists notion_url text not null default '';
-- Dias de gravação e de edição: quando preenchidos, a campanha aparece sozinha no Calendário
alter table public.campanhas add column if not exists dia_gravacao date;
alter table public.campanhas add column if not exists dia_edicao date;

alter table public.campanhas drop constraint if exists campanhas_tipo_check;
alter table public.campanhas drop constraint if exists campanhas_status_check;
alter table public.campanhas drop constraint if exists campanhas_pagamento_check;
alter table public.campanhas alter column tipo set default '';
alter table public.campanhas alter column status set default 'Aguardando Produtos';
alter table public.campanhas alter column pagamento set default '';

-- Traduz o que estava no formato antigo para o formato do Notion
update public.campanhas set pagamento = 'Nada pago' where pagamento = 'pendente';
update public.campanhas set pagamento = 'Pago' where pagamento = 'pago';
update public.campanhas set status = 'Aguardando Produtos', etapa = 'Negociação' where status = 'Briefing';
update public.campanhas set status = 'Criar Roteiro', etapa = 'Pré-Produção' where status = 'Roteiro';
update public.campanhas set status = 'Aguardando Apv. Roteiro', etapa = 'Pré-Produção' where status = 'Aprovação Roteiro';
update public.campanhas set status = 'Gravar', etapa = 'Produção' where status = 'Gravação';
update public.campanhas set status = 'Editar', etapa = 'Pós-Produção' where status = 'Edição';
update public.campanhas set status = 'Postar', etapa = 'Pós-Produção' where status = 'Aprovado';
update public.campanhas set status = 'Concluído', etapa = 'Finalizado' where status = 'Entregue';
update public.campanhas set tipo = 'UGC' where tipo in ('Conteúdo', 'Publicidade');

-- 5.2 "Organização" virou "Arquivado": marcas que não responderam.
-- Campanhas arquivadas ficam fora das contas e do calendário.
alter table public.campanhas alter column etapa set default 'Negociação';
update public.campanhas set etapa = 'Arquivado', ativa = false where etapa = 'Organização';


-- ---------------------------------------------------------------------
-- 6. TABELA "marcados"
-- Guarda o que você já marcou no checklist. Cada item tem uma chave de
-- texto (por exemplo "checklist:capa:0"). Se a chave está aqui com
-- marcado = true, o item aparece marcado.
-- ---------------------------------------------------------------------
create table if not exists public.marcados (
  chave          text primary key,
  marcado        boolean not null default true,
  atualizado_em  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 7. TABELA "visitas"
-- Uma linha por visita ao portfólio: quando, qual página e de onde a
-- pessoa veio (Instagram, Google, direto...). Não guarda nome, e-mail,
-- IP nem nada que identifique quem visitou.
-- ---------------------------------------------------------------------
create table if not exists public.visitas (
  id      bigint generated always as identity primary key,
  data    timestamptz not null default now(),
  pagina  text not null default '/',
  origem  text not null default 'direto'
);

create index if not exists visitas_data_idx on public.visitas (data);


-- ---------------------------------------------------------------------
-- 7.1 TABELA "eventos"
-- O que cada visitante fez no site: em que parte da página chegou, o que
-- clicou (Instagram, TikTok, WhatsApp, vídeos...), se mandou o formulário
-- e quando saiu. "sessao" é um código sorteado na hora, que só serve para
-- juntar os passos da mesma visita. Não guarda nome, IP nem nada pessoal.
-- tipo: entrada (de onde veio), secao (parte da página que apareceu),
--       clique, formulario, saida (onde estava ao sair)
-- valor: segundos desde que a pessoa abriu o site
-- ---------------------------------------------------------------------
create table if not exists public.eventos (
  id      bigint generated always as identity primary key,
  data    timestamptz not null default now(),
  sessao  text not null default '',
  pagina  text not null default '/',
  tipo    text not null default 'clique'
          check (tipo in ('entrada', 'secao', 'clique', 'formulario', 'saida')),
  alvo    text not null default '',
  valor   integer not null default 0
);

create index if not exists eventos_data_idx on public.eventos (data);

-- Tranca: só você lê. O site só consegue CRIAR eventos, nunca ler.
alter table public.eventos enable row level security;

drop policy if exists "dona faz tudo" on public.eventos;
create policy "dona faz tudo" on public.eventos
  for all to authenticated using (public.sou_eu()) with check (public.sou_eu());

drop policy if exists "site registra evento" on public.eventos;
create policy "site registra evento" on public.eventos
  for insert to anon, authenticated
  with check (
    char_length(sessao) <= 40
    and char_length(pagina) <= 300
    and char_length(alvo) <= 200
    and valor between 0 and 86400
    and data > now() - interval '1 hour'
    and data < now() + interval '1 hour'
  );

grant select, insert, update, delete on public.eventos to authenticated;
grant insert on public.eventos to anon;


-- ---------------------------------------------------------------------
-- 8. A TRANCA (RLS, Row Level Security)
-- Ligar o RLS faz o banco recusar TUDO por padrão. Depois, cada
-- "policy" abre só uma porta específica. Sem policy, ninguém entra.
-- ---------------------------------------------------------------------
alter table public.videos     enable row level security;
alter table public.marcas     enable row level security;
alter table public.calendario enable row level security;
alter table public.campanhas  enable row level security;
alter table public.marcados   enable row level security;
alter table public.visitas    enable row level security;


-- 8.1 Porta da dona: só você, logada, lê, cria, edita e apaga em todas as tabelas.
drop policy if exists "dona faz tudo" on public.videos;
create policy "dona faz tudo" on public.videos
  for all to authenticated using (public.sou_eu()) with check (public.sou_eu());

drop policy if exists "dona faz tudo" on public.marcas;
create policy "dona faz tudo" on public.marcas
  for all to authenticated using (public.sou_eu()) with check (public.sou_eu());

drop policy if exists "dona faz tudo" on public.calendario;
create policy "dona faz tudo" on public.calendario
  for all to authenticated using (public.sou_eu()) with check (public.sou_eu());

drop policy if exists "dona faz tudo" on public.campanhas;
create policy "dona faz tudo" on public.campanhas
  for all to authenticated using (public.sou_eu()) with check (public.sou_eu());

drop policy if exists "dona faz tudo" on public.marcados;
create policy "dona faz tudo" on public.marcados
  for all to authenticated using (public.sou_eu()) with check (public.sou_eu());

drop policy if exists "dona faz tudo" on public.visitas;
create policy "dona faz tudo" on public.visitas
  for all to authenticated using (public.sou_eu()) with check (public.sou_eu());


-- 8.2 Exceção 1: o formulário do site pode CRIAR uma marca, e só como
-- Lead vinda do site. Não consegue ler, editar nem apagar nada.
-- Os limites de tamanho evitam que alguém mande um texto gigante.
drop policy if exists "formulario do site cria lead" on public.marcas;
create policy "formulario do site cria lead" on public.marcas
  for insert to anon, authenticated
  with check (
    situacao = 'lead'
    and origem = 'site'
    and exemplo = false
    and char_length(nome) <= 200
    and char_length(email) <= 200
    and char_length(instagram) <= 100
    and char_length(telefone) <= 50
    and char_length(obs) <= 5000
  );


-- 8.3 Exceção 2: qualquer visitante pode CRIAR uma linha de visita.
-- Também não consegue ler as visitas de ninguém.
drop policy if exists "site registra visita" on public.visitas;
create policy "site registra visita" on public.visitas
  for insert to anon, authenticated
  with check (
    char_length(pagina) <= 300
    and char_length(origem) <= 100
    and data > now() - interval '1 hour'
    and data < now() + interval '1 hour'
  );


-- 8.4 Leitura pública dos vídeos (necessária para o portfólio mostrar
-- os vídeos que vêm daqui). Só os vídeos com o olhinho aberto e que não
-- são exemplo. Os escondidos continuam visíveis só pra você.
-- São os mesmos vídeos que já aparecem publicamente no seu site.
drop policy if exists "site le videos visiveis" on public.videos;
create policy "site le videos visiveis" on public.videos
  for select to anon, authenticated
  using (visivel = true and exemplo = false);


-- 8.5 Permissões básicas de acesso às tabelas. Sozinhas elas não abrem
-- nada: quem decide o que cada um vê são as policies acima.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.videos, public.marcas, public.calendario,
  public.campanhas, public.marcados, public.visitas
  to authenticated;
grant select on public.videos to anon;
grant insert on public.marcas, public.visitas to anon;


-- ---------------------------------------------------------------------
-- 9. UMA LINHA DE EXEMPLO EM CADA LISTA
-- Só para você ver o formato. Todas estão marcadas como exemplo:
-- não entram nas contas do painel e não aparecem no site.
-- Apague pelo painel quando quiser. Só entram se a tabela estiver vazia.
-- ---------------------------------------------------------------------
insert into public.videos (titulo, link, nicho, formato, marca, destaque, ordem, visivel, exemplo)
select 'Exemplo: apague esta linha', 'https://youtube.com/shorts/CODIGO-DO-VIDEO', 'Skincare', 'Review', 'Marca Exemplo', '0 views', 0, false, true
where not exists (select 1 from public.videos);

insert into public.marcas (nome, instagram, email, telefone, situacao, obs, ultimo_contato, origem, exemplo)
select 'Marca Exemplo', '@marcaexemplo', 'contato@marcaexemplo.com.br', '', 'lead', 'Exemplo: apague esta linha', current_date, 'painel', true
where not exists (select 1 from public.marcas);

insert into public.calendario (titulo, marca, tipo, data, status, exemplo)
select 'Exemplo: apague esta linha', 'Marca Exemplo', 'gravar', current_date + 2, 'a fazer', true
where not exists (select 1 from public.calendario);

insert into public.campanhas (campanha, cliente, tipo, status, etapa, qtd, valor, prazo, pagamento, ativa, favorita, exemplo)
select 'Exemplo: apague esta linha', 'Marca Exemplo', 'UGC', 'Aguardando Produtos', 'Negociação', 1, 0, current_date + 7, 'Nada pago', true, false, true
where not exists (select 1 from public.campanhas);


-- =====================================================================
-- COMO TESTAR SE A TRANCA FUNCIONA (opcional)
-- Selecione SÓ as 4 linhas abaixo (sem os dois traços do começo, tire
-- os "-- " antes de rodar) e clique em "Run". Elas fingem ser um
-- visitante deslogado. O resultado esperado é 0 em marcas, mesmo com a
-- linha de exemplo lá dentro. Se aparecer 1, a tranca não está ligada.
--
-- begin;
-- set local role anon;
-- select count(*) as marcas_que_um_estranho_ve from public.marcas;
-- rollback;
-- =====================================================================
