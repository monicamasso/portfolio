#!/bin/bash
# Gera proposta.html (https://monicamasso.com.br/proposta) a partir do index.html, SEM nenhum valor.
# Rode sempre que mudar o index.html:   bash gerar-proposta.sh
# O que muda em relação ao site principal:
#  - <html class="proposta">: o CSS esconde as áreas de preço e deixa só os painéis de métricas das redes
#  - todos os preços (preco: "R$ ...") viram texto vazio, então nem no código da página aparecem valores
#  - não é indexada pelo Google (noindex) e o endereço de compartilhamento é /proposta
cd "$(dirname "$0")" || exit 1
sed -E \
  -e 's|<html lang="pt-BR">|<html lang="pt-BR" class="proposta">|' \
  -e 's|<head>|<head>\n<meta name="robots" content="noindex, nofollow">|' \
  -e 's|preco: *"R\$[^"]*"|preco: ""|g' \
  -e 's|(og:url" content=")[^"]*"|\1https://monicamasso.com.br/proposta"|' \
  index.html > proposta.html
echo "proposta.html gerado: $(grep -c 'preco: ""' proposta.html) preços removidos, $(grep -c 'preco: "R\$' proposta.html) restantes"
