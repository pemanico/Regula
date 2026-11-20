# Regula

Migração da aplicação de KPIs regulatórios de Oracle APEX para React e Node.

Fase 1: duas páginas de KPI, leitura de Oracle.
Fase 2: comentários (inserts append-only na Oracle).

Ver [docs/arquitetura.md](docs/arquitetura.md).

## Estrutura

```
db/         views sobre os datamarts, filtros por grupo, DDL dos comentários (fase 2)
backend/    API Node/TypeScript, sem lógica de negócio
frontend/   React + Vite + TypeScript, build estático
infra/      load balancer, configuração de ambientes, pool de ligações
docs/       arquitetura e decisões
```
