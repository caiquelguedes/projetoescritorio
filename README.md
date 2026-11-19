# EDAURDO

Protótipo funcional do fluxo de projetos de extensão/pesquisa: mural público (dados básicos), manifestação de interesse, notificação do CAEX, liberação do contato da coordenação, relatório final e certificado.

## Como executar

Terminal 1 — API (porta 3001):

```bash
npm install
npm run dev
```

Terminal 2 — interface (porta 5173):

```bash
cd client
npm install
npm run dev
```

Abra <http://localhost:5173>. O Vite proxy encaminha `/api` para a API.

Para testar o fluxo completo da API:

```bash
npm test
```

## Perfis de demonstração

Use o atalho na tela de login ou a credencial:

| Perfil | Nome | Credencial |
| --- | --- | --- |
| Discente | Ana Beatriz Lima | `2023123456` |
| Discente | João Pedro Alves | `2023987654` |
| Docente | Prof. Carlos Eduardo Rocha | `1234567` |
| Servidor | Marta Helena Souza | `7654321` |
| CAEX | Equipe CAEX | `caex` |
| Administrador | Administração EDAURDO | `admin` |

## Fluxo implementado

1. O CAEX cadastra projetos e os publica no mural com dados mínimos (título, área, modalidade, carga horária, vagas, período, resumo e requisitos).
2. O discente manifesta interesse. O sistema **não barra** por requisito: eles são informativos.
3. A inscrição entra em **em contato**, o projeto sai do mural, o CAEX é notificado e a coordenação recebe a demanda. E-mails de confirmação são registrados.
4. O CAEX libera o contato do(a) coordenador(a): status passa a **em andamento** e o contato aparece para o discente.
5. A coordenação pode marcar **aguardando retorno**.
6. O discente envia o **relatório final**; o CAEX emite o **certificado** e o projeto vira **concluído**.

## Estrutura

```
app.js                 main da API (Express)
src/constants.js       perfis e status
src/store.js           dados em memória, regras e e-mails simulados
src/middlewares.js     autenticação e autorização por perfil
src/routes/            auth, projetos, inscricoes, caex
client/src/            interface React + Vite
scripts/smoke-test.js  teste de ponta a ponta
```

## Observações

- Os dados ficam em memória e são reiniciados com o servidor. O ponto de troca é `src/store.js`.
- Login, e-mails e certificados são simulados. A integração com o SIGA/BD da UFJF deve substituir `usuarioPorCredencial` e `registrarEmail`.
- Em produção, rode `npm run build` em `client/`; a API passa a servir `client/dist` automaticamente.
