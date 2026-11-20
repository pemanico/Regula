# Infraestrutura — tipo de servidor por componente

Valores de partida, não medidos. Devem ser validados no PoC com a consulta real das páginas e com o teste de carga de 150 sessões ativas no pico (CFTC). Até lá, usar estes números para pedir ambientes, não para fixar capacidade.

## Frontend

O frontend é um build estático (HTML, JS, CSS). Não precisa de servidor de aplicação.

| Ambiente | Onde servir | Recursos |
|---|---|---|
| Dev | Container com nginx, ou o próprio servidor de estáticos da plataforma | 1 vCPU, 512 MB RAM |
| Prod | Load balancer ou CDN (preferível) | Sem servidor dedicado |

Se a BNP exigir um servidor próprio para estáticos, usar nginx num container com 1 vCPU e 512 MB. Não usar um servidor Node só para servir ficheiros estáticos.

## Backend (API Node/TypeScript)

A API é sem estado: cada instância é idêntica e pode ser reiniciada ou substituída sem perda de dados. Isto permite escalar horizontalmente atrás do load balancer.

| Ambiente | Instâncias | Recursos por instância |
|---|---|---|
| Dev | 1 | 2 vCPU, 2 GB RAM |
| Prod | 2 (mínimo), 3 se o PoC o justificar | 2 vCPU, 4 GB RAM |

Parâmetros a definir por instância:

- **Runtime:** Node.js LTS (versão a confirmar com a equipa de plataforma).
- **Pool de ligações à Oracle:** comece com 10 a 20 ligações por instância. O total (instâncias × pool) tem de caber nos limites de `processes` e `sessions` da base, que o DBA deve confirmar antes do go-live.
- **Timeout de consulta:** definir um limite (por exemplo, 10 segundos) para uma consulta lenta não bloquear o pool.
- **Health check:** endpoint `/health` que o load balancer usa para retirar instâncias doentes.

Porquê duas instâncias em prod: uma só é um ponto único de falha. Três instâncias só se o teste de carga mostrar que duas não cumprem o p95 alvo.

## Alternativa sem servidor de API: Oracle ORDS

Se o ORDS estiver disponível no ambiente Oracle da BNP, expõe as views diretamente em REST e elimina a API Node. Nesse cenário, a infraestrutura reduz-se a:

- Frontend: estáticos, como acima.
- Backend: nenhum servidor próprio. O ORDS corre no servidor que a BNP já mantém para a Oracle.

Confirmar disponibilidade e política de instalação antes de decidir.

## Trino

O Trino não é um servidor que se configure nesta arquitetura: é um serviço existente. A API só o usa se uma página o justificar, e o dimensionamento é responsabilidade da equipa que o mantém.

## O que falta confirmar

- Limites `processes` e `sessions` da base Oracle, com o DBA.
- Disponibilidade do ORDS.
- Política da BNP para hosting de estáticos (LB, CDN ou servidor próprio).
- Versão de Node suportada pela plataforma.
- Resultado do PoC: se as duas instâncias de prod cumprem o p95 com 150 sessões, o número fica fixado.
