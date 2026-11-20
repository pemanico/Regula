# Arquitetura — fase 1

```
Browser
  │  (token SSO)
  ├──► Load balancer ──► Frontend estático (React + Vite + TS)
  │
  └──► Load balancer ──► API Node/TS (sem estado; 1 em dev, 2 em prod)
                            ├──► Oracle (pool de ligações) ◄── Spark (datamarts existentes)
                            └──► Trino (opcional, por página)
```

## Decisões

- **Fonte por defeito: Oracle.** As páginas KPI leem tabelas já produzidas pelo Spark. O Trino fica configurado, mas só entra numa página se uma medição mostrar ganho ou se a página precisar de dados que só existem em parquet.
- **API fina.** Dois ou três endpoints por página, sem lógica de negócio. Os KPIs chegam calculados. Se a API começar a calcular, a regra fica duplicada entre o Spark e o Node.
- **Autorização por grupo na base de dados.** As views filtram pelo grupo do utilizador, com a identidade definida por pedido no pool de ligações (`DBMS_SESSION.SET_IDENTIFIER` ou VPD). Tem de estar pronta antes de qualquer utilizador real. Um endpoint novo não consegue expor dados por esquecimento.
- **Autenticação.** SSO no frontend, token validado na API, grupos extraídos do token e cruzados com a tabela de regras de acesso na Oracle. Os nomes dos grupos do SSO têm de coincidir com os da tabela; validar cedo.
- **Ambientes.** Dev: uma API e frontend estático. Prod: duas APIs atrás do LB e frontend servido pelo LB ou CDN.
- **Observabilidade.** Latência p95 por endpoint e registo de acessos (contexto regulatório).

## Fase 2 — comentários

Tabela append-only na Oracle com chave de negócio, identificador do utilizador vindo do SSO e timestamp. O Spark não recria esta tabela, por isso o vínculo com os dados não se perde nas reexecuções. Endpoint de escrita com validação e auditoria.

## Riscos em aberto

- Não está medido se a consulta das páginas é lenta na base de dados ou na APEX (20 a 30 segundos hoje). Se for na base, a arquitetura não resolve sozinha: o ganho vem de reescrever a consulta ou de mover o cálculo para o Spark.
- Confirmar se o ORDS está disponível no ambiente Oracle. Se estiver, pode eliminar a API Node.
- Pedido ao fornecedor de identidade (SSO): prazo longo, abrir já.
- Carga: 150 sessões ativas no pico (CFTC). Validar com teste de carga antes de fixar o número de instâncias.
