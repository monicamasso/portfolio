/* =====================================================================
   CONEXÃO COM O SUPABASE (o banco de dados do site e do painel)
   Este arquivo é usado pelo portfólio, pelo login e pelo painel.
   As duas informações abaixo são PÚBLICAS: podem ficar no site sem medo.
   Quem protege os dados é a "tranca" (RLS) que foi ligada no banco.sql.
   NUNCA coloque aqui a chave secreta (service_role / secret).
   ===================================================================== */
window.BANCO_URL = "https://vzasimnsgkkhecrfafjg.supabase.co";
window.BANCO_CHAVE = "sb_publishable_apWpz6ouetpPuYmw11ioyg_uDTyHwaw";

/* Cria a conexão uma vez só. Se o Supabase não carregar (internet fora, por exemplo),
   window.banco fica null e cada página segue funcionando do jeito que dá. */
window.banco = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(window.BANCO_URL, window.BANCO_CHAVE)
  : null;
