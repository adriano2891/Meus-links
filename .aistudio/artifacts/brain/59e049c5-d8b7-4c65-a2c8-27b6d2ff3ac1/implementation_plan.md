# Plano Técnico Definitivo: Sincronização dos Links da Extensão com Categorias e Subcategorias

## Sumário Executivo
Este plano estabelece a auditoria minuciosa e a correção definitiva do fluxo de integração entre a **Extensão Meus Links**, a **API REST (/api/extension/quick-save)**, o **Banco de Dados (local JSON e Supabase)** e a **Interface do Aplicativo Web**. O objetivo é garantir que todo link capturado pela extensão seja gravado com os identificadores reais e válidos de categoria e subcategoria, aparecendo instantaneamente nas seções correspondentes sem perdas ou desassociações.

---

## Revisão do Usuário e Decisões Críticas

> [!IMPORTANT]
> **Auditoria dos Registros Existentes (Conforme Seção 9 do Requisito):**
> Na tela enviada pelo usuário, há 6 links listados em **LINKS GERAIS DA CATEGORIA** (`Project overview`, `YouTube`, `Youtube`, `Youtube`, `Vite Build Tool`, `Notion`) e 2 links dentro da subcategoria **TESTE002** (`AtivaRH`, `Sign in - Google`).
> - **Decisão de Preservação:** Nenhum registro será excluído.
> - **Recuperação de Vínculos:** Ofereceremos uma ferramenta de sincronização e validação que verifica se o link veio da extensão com tag ou intenção de subcategoria para permitir reatribuição limpa, preservando todos os metadados intactos (favoritos, contagem de cliques, ler depois, tags e datas).

---

## 1. Auditoria e Causa Raiz do Problema

### 1.1. Diagnóstico do Fluxo Atual
1. **Extensão (`popup.js` / `popup.html`)**:
   - No envio do formulário (`handleSaveLink`), o valor de `subcategorySelect.value` era enviado. Se o dropdown estivesse desabilitado ou com placeholder vazio (`""`), o campo `subcategoryId` era enviado como `undefined` ou `""`.
   - Quando nenhuma categoria estava selecionada na abertura do popup, as subcategorias não eram listadas, impedindo a escolha direta de subcategoria.

2. **API Backend (`server.ts` - `/api/extension/quick-save`)**:
   - O endpoint realizava validação de subcategoria exclusivamente em `db.subcategories` do arquivo JSON local (`server.ts` linha 1920):
     ```typescript
     const subExists = (db.subcategories || []).some(
       (s: any) => s.id === subcategoryId && s.categoryId === categoryId && s.userId === user.id
     );
     if (!subExists) {
       subcategoryId = undefined; // <-- Causa da falha silenciosa!
     }
     ```
   - **Falha Crítica 1:** Se a subcategoria foi criada ou sincronizada via Supabase (como `TESTE002`), o array local do JSON podia estar desatualizado em relação ao Supabase.
   - **Falha Crítica 2:** Ao não encontrar o ID localmente, a API **zerava silenciosamente** o `subcategoryId` para `undefined` em vez de consultar a camada unificada de dados (Supabase + local) ou retornar erro de validação.
   - Resultado: O link era salvo como "Link Geral da Categoria", caindo fora da subcategoria pretendida!

3. **Endpoints de Consulta (`/api/categories` e `/api/subcategories`)**:
   - Anteriormente, `/api/subcategories` e `/api/categories` não consultavam o Supabase caso o banco estivesse ativo, gerando discrepâncias entre o que o app exibia e o que a extensão recebia.

4. **Sincronização em Tempo Real (Extensão ➔ Aba Aberta do App)**:
   - Quando o link era salvo pelo popup da extensão, a aba do aplicativo web aberta no navegador não recebia uma notificação de atualização em tempo real, exigindo refresh manual (F5) para refletir os novos itens.

---

## 2. Solução Arquitetural Proposta

### 2.1. Diagrama de Integração Ponta a Ponta

```
┌────────────────────────────────────────────────────────────────────────┐
│                          EXTENSÃO DO NAVEGADOR                         │
│                                                                        │
│  [Aba Ativa] ──> popup.js captura URL, Título e Favicon               │
│                        │                                               │
│                        ▼                                               │
│  [Categorias & Subcategorias Carregadas via API Unificada]            │
│  • Categoria selecionada  ──> filtra subcategorias válidas             │
│  • Subcategoria escolhida ──> seleciona categoria pai automaticamente  │
│                        │                                               │
│                        ▼                                               │
│  [Validação Pré-Envio]: Checa IDs reais (categoryId + subcategoryId)  │
│  [Disparo]: POST /api/extension/quick-save                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Bridge HTTP com Credentials & Bearer Token)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           BACKEND EXPRESS                              │
│                                                                        │
│  POST /api/extension/quick-save                                        │
│  1. Autentica usuário (Bearer / x-api-token)                           │
│  2. Valida existência de categoryId na conta do usuário                │
│  3. Se subcategoryId for informado:                                    │
│     Valida se pertence a categoryId na base unificada                  │
│     (Se inválido, retorna erro 400 claro — NUNCA descarta silencioso)  │
│  4. Grava link com { id, userId, categoryId, subcategoryId, ... }      │
│  5. Persiste em data/database.json E sincroniza com Supabase           │
│  6. Registra log de auditoria com vínculo explícito                    │
│  7. Emite broadcast/resposta com os IDs confirmados                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        APLICATIVO WEB (SPA)                            │
│                                                                        │
│  1. Ouve evento de sincronização (Bridge / BroadcastChannel / Storage) │
│  2. Executa refreshData() instantâneo sem recarregar a página          │
│  3. Links com subcategoryId aparecem DENTRO da subcategoria            │
│  4. Links sem subcategoryId aparecem em "Links Gerais da Categoria"    │
│  5. Contador total da categoria = Gerais + Subcategorias               │
│  6. Contador da subcategoria = apenas seus links                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Plano de Implementação Detalhado

### Etapa 1: Backend — Validação Rigorosa e Unificada de Dados (`server.ts`)
- **Consulta Unificada:** Atualizar o validador de subcategorias em `/api/extension/quick-save` para verificar tanto em `db.subcategories` quanto no Supabase (`getSupabaseAllData`).
- **Validação Estrita:** Se um `subcategoryId` for fornecido e não pertencer à categoria selecionada, retornar erro HTTP 400 com mensagem explicativa:
  `"A subcategoria selecionada não pertence a esta categoria."` — eliminando o descarte silencioso.
- **Persistência Completa:** Garantir que o objeto salvo contenha exatamente:
  ```json
  {
    "id": "link-...",
    "userId": "user-demo-1",
    "categoryId": "cat-1",
    "subcategoryId": "sub-1793667563236q3dz",
    "title": "...",
    "url": "...",
    "tags": ["Extensão", ...],
    "source": "extension"
  }
  ```
- **Sincronização Bidirecional Supabase:** Garantir que `upsertSupabaseLink` salve `category_id` e `subcategory_id` corretamente nas colunas do banco.

### Etapa 2: Extensão — Formulário e Envio Seguro (`popup.js`, `popup.html`, `content.js`)
- **Seletor de Categoria & Subcategoria Conectados:**
  - Carregamento de categorias e subcategorias garantido com fallback resiliente (`/api/categories`, `/api/subcategories` e `/api/data`).
  - IDs enviados são **sempre os IDs alfanuméricos reais** (ex: `cat-1`, `sub-1793667563236q3dz`), nunca strings de nomes.
  - Opção explícita de "📁 Salvar na raiz da categoria" envia `subcategoryId: null` (ou omitido).
  - Opção de subcategoria selecionada envia `subcategoryId: "<id-da-subcategoria>"`.
- **Notificação de Sincronização em Tempo Real (`content.js`)**:
  - Quando a extensão salvar o link com sucesso pelo Tab Bridge ou chamada direta, `content.js` dispara um evento `window.dispatchEvent(new CustomEvent("meuslinks_external_save", { detail: { link } }))` para a aba aberta do App.
  - O aplicativo atualizará a visualização imediatamente na tela do usuário.

### Etapa 3: Interface do Aplicativo (`src/App.tsx`, `AppContext.tsx`, `CategoryCard.tsx`)
- **Auditoria dos Filtros de Renderização**:
  - Validar a filtragem em `src/App.tsx`:
    - Links gerais: `catLinks.filter(l => !l.subcategoryId)`
    - Links da subcategoria: `catLinks.filter(l => l.subcategoryId === sub.id)`
  - Confirmar que o contador total da categoria soma tanto os links gerais quanto os de todas as subcategorias vinculadas.
- **Ouvinte de Atualização Automática**:
  - Em `AppContext.tsx`, registrar listener para o evento `meuslinks_external_save` e `storage` para disparar `refreshData()` imediatamente ao receber links salvos pela extensão.

### Etapa 4: Auditoria e Migração dos Registros Existentes (`data/database.json`)
- Analisar todos os links existentes no banco:
  - Verificar se há links salvos pela extensão que deveriam estar associados a subcategorias (ex: links em `cat-1` compatíveis com `TESTE002`).
  - Atualizar os links sem quebrar nenhuma propriedade pré-existente (preservando cliques, datas, favoritos e títulos).

### Etapa 5: Empacotamento da Extensão (v1.0.4)
- Atualizar `extension/manifest.json` e `public/extension/manifest.json`.
- Garantir que `/api/extension/download` entregue o ZIP com os scripts atualizados e prontos para uso no Brave e Chrome.

---

## 4. Roteiro de Testes Obrigatórios

1. **Teste 1 (Link Direto na Categoria)**: Salvar link com categoria selecionada e subcategoria "Nenhuma (raiz da categoria)". Verificar se aparece em "Links Gerais da Categoria".
2. **Teste 2 (Link em Subcategoria)**: Salvar link com categoria selecionada e subcategoria específica (`TESTE002`). Verificar se aparece dentro da subcategoria `TESTE002` e se soma na contagem da categoria.
3. **Teste 3 (Múltiplos Links)**: Salvar 2 links seguidos na mesma subcategoria e validar agrupamento.
4. **Teste 4 (Troca Dinâmica)**: Alterar de categoria e subcategoria no popup antes de clicar em salvar e verificar persistência dos novos IDs.
5. **Teste 5 (Persistência)**: Recarregar a página (F5) e verificar se todos os links permanecem em seus devidos lugares.
6. **Teste 6 (Favoritos & Ler Depois)**: Salvar com marcações de favorito e ler depois marcadas e conferir filtros nas abas laterais.
7. **Teste 7 (ZIP da Extensão)**: Testar download do pacote compactado e checar integridade dos arquivos.

---

## 5. Arquivos e Componentes Impactados
- `server.ts` (Endpoint `/api/extension/quick-save`, validações e leitura unificada)
- `extension/popup.js` e `public/extension/popup.js` (Lógica de seleção e payload da extensão)
- `extension/content.js` e `public/extension/content.js` (Bridge e notificação de sincronização em tempo real)
- `src/context/AppContext.tsx` (Listener de sincronização externa em tempo real)
- `src/App.tsx` (Renderização de contadores e agrupamento categoria/subcategoria)
- `data/database.json` (Auditoria e preservação dos links existentes)
- `extension/manifest.json` e `public/extension/manifest.json` (Versão 1.0.4)
