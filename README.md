# CoinHat DEX - TODO

## Backend / Database
- [x] Schema: tabela `tokens` (id, name, contractAddress, network, logoUrl, price, marketCap, liquidity, volume, createdAt)
- [x] Schema: tabela `boosts` (id, tokenId, amountPaid, txid, startTime, expiresAt, status, planType)
- [x] Migration SQL aplicada via webdev_execute_sql
- [x] DB helpers: getTokens, getTokenById, createToken, getActiveBoosts, createBoost, markBoostExpired
- [x] tRPC router: tokens.list (com filtro/busca, ordenação por boost)
- [x] tRPC router: tokens.create (adicionar token)
- [x] tRPC router: tokens.get (detalhes de token)
- [x] tRPC router: boost.getPlans (listar planos)
- [x] tRPC router: boost.submit (enviar TXID + tokenId + plano)
- [x] tRPC router: boost.validate (validar TXID na blockchain Solana)
- [x] Validação TXID: verificar valor correto em USDC, endereço correto, sem reutilização
- [x] Ativação automática de boost após confirmação
- [x] Cron/job para expirar boosts vencidos

## Frontend
- [x] Sistema i18n com 3 idiomas: EN, PT, ZH (traduções completas)
- [x] Seletor de idioma no header (globo + bandeira)
- [x] Layout fiel ao design: dark theme, cores amarelo/preto/verde
- [x] Header: logo CoinHat, seletor idioma, botão wallet, menu
- [x] Área BOOST no topo: carrossel horizontal de tokens boosted com badge 🔥
- [x] Barra de busca
- [x] Seção Trending: lista de tokens com preço, market cap, liquidez, volume
- [x] Badge 🔥 Boosted nos tokens com boost ativo
- [x] Contador regressivo para boost ativo
- [x] Ordenação: maior valor pago primeiro, depois tempo restante
- [x] Filtros de tokens (rede, volume, etc.)
- [x] Bottom navigation: HOME, BOOST, SWAP, CHART, INFO
- [x] Página BOOST: formulário para adicionar token + escolher plano
- [x] Wallet connect modal: Phantom e Solflare para Solana
- [x] Fluxo de pagamento: exibir endereço fixo USDC, campo TXID
- [x] Validação e ativação de boost no frontend
- [x] Página INFO com informações da plataforma
- [x] Responsividade mobile-first

## Testes
- [x] Vitest: tokens.list retorna tokens ordenados por boost
- [x] Vitest: boost.submit valida TXID duplicado
- [x] Vitest: boost.validate verifica valor correto

## DexScreener Integration
- [x] Backend: serviço DexScreener para buscar dados de tokens por endereço/rede
- [x] Backend: validação automática (liquidez ativa + marketCap >= $40k)
- [x] Backend: endpoint tRPC `tokens.search` para buscar tokens via DexScreener
- [x] Backend: endpoint tRPC `tokens.trending` para listar trending tokens aprovados
- [x] Backend: cache de 60s para evitar excesso de chamadas à API
- [x] Backend: prevenção de duplicação de contratos
- [x] Backend: categorização automática "safe" vs "new" (< 24h)
- [x] Frontend: seção "Safe Tokens" com badge verde
- [x] Frontend: seção "New Tokens" com badge azul
- [x] Frontend: filtros por Maior MarketCap, Maior Volume, Tokens Recentes
- [x] Frontend: botão "Ver Gráfico" (link DexScreener)
- [x] Frontend: botão "Trade" (link externo DEX)
- [x] Frontend: aviso quando token não atende requisitos
- [x] Frontend: aviso quando dados não encontrados
- [x] Frontend: atualização automática a cada 60 segundos


## Swap Funcional (Web3)
- [x] Instalar ethers.js, wagmi, @rainbow-me/rainbowkit
- [x] Criar contexto Web3 com detecção de rede (Ethereum/BSC)
- [x] Implementar conexão MetaMask e WalletConnect
- [x] Criar serviço de swap com approve e swapExactTokensForTokens
- [x] Criar página SwapPage com UI de swap
- [x] Implementar estimativa de preço via Uniswap V2 Router
- [x] Adicionar slippage tolerance
- [x] Mostrar status de transação (pending/success/error)
- [x] Criar página de detalhes do token (sem redirecionamento)


## Correções de Swap (Web3)
- [x] Corrigir Web3Context para expor signer do provider
- [x] Atualizar SwapService para usar signer em transações
- [x] Atualizar SwapPage para consumir signer do Web3Context
- [x] Suporte a decimais variáveis de tokens (parseUnits/formatUnits)
- [x] Cálculo dinâmico de preço via getAmountsOut
- [x] Validar rota de swap (mínimo 2 tokens)
- [x] Tratamento de erros em quote e transações


## Testes Manuais E2E (Swap)
- [x] Teste MetaMask: conectar, aprovar token, executar swap, verificar tx hash
- [x] Teste WalletConnect: conectar, aprovar, swap, verificar confirmação
- [x] Teste de erro: rota inválida, allowance insuficiente, slippage alto
