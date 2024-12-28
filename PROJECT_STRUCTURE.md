# G-System Backoffice - Documentação de Estrutura de Projeto

## �조 Visão Geral

### Tecnologias Principais
- Framework: Angular
- Linguagem: TypeScript
- Estilo: SCSS
- Gerenciamento de Dependências: npm

## 🗂️ Estrutura de Diretórios

```
Backoffice/
│
├── src/
│   ├── app/                    # Código-fonte principal
│   │   ├── app.component.ts    # Componente raiz
│   │   ├── app.routes.ts       # Configuração de rotas
│   │   ├── app.config.ts       # Configurações globais
│   │   │
│   │   ├── authentication/     # Módulo de Autenticação
│   │   │   ├── pages/
│   │   │   │   ├── login/      # Componente de Login
│   │   │   │   └── register/   # Componente de Registro
│   │   │   └── services/       # Serviços de autenticação
│   │   │
│   │   ├── core/               # Módulo Core
│   │   │   ├── guards/         # Guardas de rota
│   │   │   ├── interceptors/   # Interceptores HTTP
│   │   │   └── services/       # Serviços principais
│   │   │
│   │   ├── dashboard/          # Módulo de Dashboard
│   │   │   ├── components/     # Componentes reutilizáveis
│   │   │   ├── pages/          # Páginas do dashboard
│   │   │   └── services/       # Serviços específicos
│   │   │
│   │   └── shared/             # Módulo Compartilhado
│   │       ├── components/     # Componentes globais
│   │       ├── directives/     # Diretivas personalizadas
│   │       └── pipes/          # Pipes customizados
│   │
│   ├── assets/                 # Recursos estáticos
│   ├── environments/           # Configurações de ambiente
│   ├── index.html              # Página inicial
│   ├── main.ts                 # Ponto de entrada
│   └── styles.scss             # Estilos globais
│
├── angular.json                # Configurações do Angular
├── package.json                # Dependências e scripts
└── tsconfig.json               # Configurações do TypeScript
```

## 🔒 Segurança e Autenticação

### Fluxo de Autenticação
1. Rota padrão redireciona para `/login`
2. `AuthGuard` protege rotas do dashboard
3. Componentes de Login e Registro implementados

### Rotas Principais
- `/login`: Página de login
- `/register`: Página de registro
- `/dashboard`: Área restrita (protegida por autenticação)

## 🧩 Módulos Principais

### Authentication
- Gerencia processos de login e registro
- Implementa serviços de autenticação
- Contém guardas para proteção de rotas

### Dashboard
- Contém páginas e componentes do painel administrativo
- Rotas carregadas com lazy loading
- Serviços específicos para funcionalidades do dashboard

### Core
- Serviços singleton
- Interceptores HTTP
- Guardas de rota globais

### Shared
- Componentes reutilizáveis
- Diretivas e pipes globais

## 🛠 Configurações

### Ambiente de Desenvolvimento
- Suporte a múltiplos ambientes (development, production)
- Configurações definidas em `environments/`

### TypeScript
- Configurações em `tsconfig.json`
- Strict mode habilitado
- Configurações de compilação otimizadas

## 📦 Dependências Principais
- Angular Core
- RxJS
- Angular Material (presumido)
- Bibliotecas de estado (se aplicável)

## 🔍 Pontos de Atenção
- Verificar implementação completa do módulo de contatos
- Revisar consistência entre rotas e componentes
- Manter documentação atualizada

## 🚀 Próximos Passos
1. Implementar testes unitários
2. Configurar integração contínua
3. Revisar estratégias de gerenciamento de estado

---

**Última Atualização:** ${new Date().toLocaleDateString()}
**Versão do Documento:** 1.0.0
```
