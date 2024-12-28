# Documentação de Lógica dos Componentes

## 1. Sidebar Component (`sidebar.component.ts`)

### Objetivo
Criar uma barra lateral de navegação para o dashboard, permitindo acesso rápido a diferentes seções do aplicativo.

### Estrutura
- Componente standalone
- Importa módulos necessários para roteamento
- Utiliza ícones para representar visualmente cada seção

### Rotas Disponíveis
- Home (`/dashboard/home`)
- Contatos (`/dashboard/contacts`)
- Relatórios (`/dashboard/reports`)
- Configurações (`/dashboard/settings`)

### Características Principais
- Utiliza `routerLink` para navegação
- Aplica `routerLinkActive` para destacar rota atual
- Ícones de Font Awesome para representação visual

## 2. Contacts Component (`contacts.component.ts`)

### Objetivo
Gerenciar e exibir uma lista de contatos com funcionalidades básicas de visualização.

### Estrutura de Dados
```typescript
interface Contact {
  id: number;
  name: string;
  email: string;
}
```

### Lógica Principal
1. **Inicialização**
   - Método `ngOnInit()` carrega contatos ao iniciar o componente
   - Método `loadContacts()` popula a lista de contatos

2. **Funcionalidades Planejadas**
   - Carregar contatos de uma fonte de dados
   - Exibir contatos em uma tabela
   - Botões para adicionar, editar e excluir contatos

### Fluxo de Dados
- Carregamento inicial de contatos mockados
- Preparado para integração com serviço de backend

### Interface de Usuário
- Tabela responsiva com colunas:
  - ID
  - Nome
  - Email
  - Ações (Editar/Excluir)
- Botão para adicionar novo contato

## 3. Authentication Guard (`auth.guard.ts`)

### Objetivo
Proteger rotas que requerem autenticação, impedindo acesso não autorizado.

### Mecanismo de Proteção
1. Implementa `CanActivate` para verificar permissão de acesso
2. Verifica estado de autenticação do usuário
3. Redireciona para página de login se não autenticado

### Fluxo de Autenticação
```typescript
canActivate(
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
): boolean {
  // Verifica se usuário está logado
  if (this.authService.isLoggedIn()) {
    return true; // Permite acesso
  }
  
  // Redireciona para login
  this.router.navigate(['/login']);
  return false;
}
```

## 4. Dashboard Routes (`dashboard.routes.ts`)

### Objetivo
Configurar rotas para o módulo de dashboard com proteção de autenticação.

### Estratégia de Roteamento
- Rotas filhas do dashboard
- Proteção por `AuthGuard`
- Redirecionamento padrão para página inicial

### Rotas Configuradas
- `/dashboard/home`: Página inicial
- `/dashboard/settings`: Configurações
- `/dashboard/contacts`: Página de contatos
- Rota padrão redireciona para `/dashboard/home`

## 5. Home Component (`home.component.ts`)

### Objetivo
Fornecer uma visão geral e dashboard principal para usuários autenticados.

### Possíveis Elementos
- Resumo de estatísticas
- Widgets informativos
- Notificações rápidas
- Atalhos para funcionalidades principais

### Lógica Prevista
- Buscar dados de resumo ao inicializar
- Atualizar widgets periodicamente
- Gerenciar estado de carregamento

## 6. Settings Component (`settings.component.ts`)

### Objetivo
Permitir que usuários configurem preferências e opções da conta.

### Funcionalidades Esperadas
- Alteração de informações pessoais
- Configurações de privacidade
- Preferências de notificação
- Gerenciamento de conta

### Fluxo de Configuração
1. Carregar configurações atuais
2. Permitir edição
3. Salvar alterações
4. Validar e fornecer feedback

---

**Última Atualização:** ${new Date().toLocaleDateString()}
**Versão:** 1.0.0

*Documentação sujeita a alterações com a evolução do projeto*
