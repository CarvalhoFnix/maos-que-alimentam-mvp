# Mãos que Alimentam – MVP

Aplicativo web responsivo e offline (PWA) para a ONG "Mãos que Alimentam" (Jardim Esperança, São Paulo).

## Funções
- Cadastro único de famílias, com aviso de duplicidade (RF01, RF02)
- Estoque com entrada, saída e alerta de validade em até 15 dias (RF03 a RF05)
- Registro de entregas e relatório de atendimentos por período (RF06, RF07)
- Cópia de segurança em JSON (RF08)
- Login com senha (PBKDF2-SHA-256, salt, 310.000 iterações), bloqueio após 5 erros e sessão de 15 min (RNF01)

## Tecnologias
Angular 19, Angular Material, Service Worker (PWA), Dexie.js (IndexedDB), Node.js 22 LTS

## Arquitetura
Monolítica em camadas: apresentação (`src/app/pages`), regras de negócio (nos componentes e `auth.service.ts`) e persistência (`src/app/db.ts`).

## Como executar
```
npm install
ng serve          # desenvolvimento
ng build          # produção (gera o Service Worker)
```
Publicação: enviar a pasta `dist/maos-que-alimentam-mvp/browser` para uma hospedagem estática com HTTPS.

## Autor
Luiz Fabiano Carvalho de Lima – Análise e Desenvolvimento de Sistemas
