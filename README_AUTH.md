# Sistema de Autenticação - Music Learning Helper

## Resumo das Alterações

Foi implementado um sistema completo de autenticação e gerenciamento de usuários no Music Learning Helper.

## Funcionalidades Implementadas

### 1. Sistema de Login
- Página de login acessível em `/login`
- Autenticação com username e senha
- Sessões persistentes (24 horas)
- Logout automático ao fechar a sessão

### 2. Gerenciamento de Usuários (CRUD)
- **Listar usuários**: `/users` (apenas administradores)
- **Criar usuário**: `/users/new` (apenas administradores)
- **Editar usuário**: `/users/edit/:id` (apenas administradores)
- **Deletar usuário**: `/users/delete/:id` (apenas administradores)
- Senhas criptografadas com bcrypt

### 3. Controle de Acesso
- **Página inicial**: Pública apenas para visualização, todas as ações requerem login
- **Upload de músicas**: Requer autenticação
- **Minhas músicas**: Mostra apenas músicas do usuário logado
- **Player, edição e exclusão**: Apenas para músicas do próprio usuário (ou admin)
- **Gerenciamento de usuários**: Apenas para administradores

### 4. Associação de Músicas por Usuário
- Cada upload está associado ao usuário que o criou
- Usuários só veem suas próprias músicas
- Administradores podem ver e gerenciar todas as músicas

## Credenciais Padrão

Ao iniciar o sistema pela primeira vez, é criado automaticamente um usuário administrador:

```
Usuário: admin
Senha: admin123
```

**IMPORTANTE**: Altere a senha padrão após o primeiro login!

## Estrutura do Banco de Dados

### Tabela `users`
- `id`: ID único do usuário
- `username`: Nome de usuário (único)
- `password`: Senha criptografada (bcrypt)
- `full_name`: Nome completo
- `email`: Email (único)
- `is_admin`: Flag de administrador (0 ou 1)
- `created_at`: Data de criação
- `updated_at`: Data de última atualização

### Tabela `uploads` (atualizada)
- **Novo campo**: `user_id` - Referência ao usuário dono do upload
- Relação: `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

## Arquivos Criados/Modificados

### Novos Arquivos
- `auth.js`: Middleware de autenticação e funções auxiliares
- `templates/login.html`: Página de login
- `templates/users-list.html`: Lista de usuários
- `templates/user-form.html`: Formulário de criação/edição de usuários
- `README_AUTH.md`: Este arquivo

### Arquivos Modificados
- `server.js`: Adicionadas rotas de autenticação e CRUD de usuários
- `database.js`: Adicionada tabela de usuários e operações relacionadas
- `templates/home.html`: Adicionado menu de logout e link para gerenciar usuários (admin)
- `package.json`: Adicionadas dependências (express-session, bcryptjs)
- `.env.example`: Adicionada configuração SESSION_SECRET
- `.gitignore`: Adicionado banco de dados à lista de ignorados

## Fluxo de Uso

1. **Primeiro Acesso**
   - Acesse `/login`
   - Faça login com admin/admin123
   - Você será redirecionado para a home

2. **Criar Novos Usuários**
   - Como administrador, acesse "Gerenciar Usuários" no menu
   - Clique em "Novo Usuário"
   - Preencha os dados (marque "Administrador" se necessário)
   - Salve

3. **Upload de Músicas**
   - Faça login
   - Acesse "Upload de Áudio"
   - Envie sua música
   - A música ficará associada ao seu usuário

4. **Visualizar Minhas Músicas**
   - Acesse "Minhas Músicas"
   - Você verá apenas as músicas que você enviou
   - Admins podem ver músicas de todos os usuários

## Segurança

### Implementações de Segurança
- ✅ Senhas criptografadas com bcrypt (10 rounds)
- ✅ Sessões seguras com express-session
- ✅ Proteção de rotas com middleware de autenticação
- ✅ Verificação de propriedade de recursos
- ✅ Prevenção de SQL injection (prepared statements)
- ✅ Validação de permissões (admin vs usuário comum)

### Recomendações para Produção
1. **Altere a SESSION_SECRET** no arquivo `.env`:
   ```
   SESSION_SECRET=sua-chave-secreta-aleatoria-muito-longa
   ```

2. **Use HTTPS**: Configure SSL/TLS no servidor

3. **Implemente rate limiting**: Evite ataques de força bruta

4. **Configure CORS**: Se necessário, configure adequadamente

5. **Backups regulares**: Faça backup do banco de dados regularmente

## Rotas da Aplicação

### Públicas
- `GET /login` - Página de login

### Autenticadas (requer login)
- `GET /` - Página inicial
- `GET /logout` - Fazer logout
- `GET /upload` - Página de upload
- `POST /upload` - Processar upload
- `GET /my-uploads` - Listar minhas músicas
- `GET /player/:id` - Tocar música
- `GET /edit/:id` - Editar música
- `POST /update/:id` - Atualizar música
- `POST /delete/:id` - Deletar música
- `GET /multitrack-list` - Lista de multitracks
- `GET /multitrack/:id` - Player de multitrack
- `GET /cifras` - Lista de cifras
- `GET /cifras/:id` - Visualizar cifra

### Admin (requer login + permissão de admin)
- `GET /users` - Listar usuários
- `GET /users/new` - Formulário de novo usuário
- `POST /users/create` - Criar usuário
- `GET /users/edit/:id` - Formulário de edição
- `POST /users/update/:id` - Atualizar usuário
- `POST /users/delete/:id` - Deletar usuário

## Testando o Sistema

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Acesse: http://localhost:3000/login

3. Faça login com as credenciais padrão

4. Teste as funcionalidades:
   - Criar um novo usuário
   - Fazer upload de uma música
   - Visualizar suas músicas
   - Editar/deletar músicas
   - Gerenciar usuários (como admin)

## Suporte

Para questões ou problemas, verifique:
1. Os logs do servidor (`logger.js`)
2. O console do navegador
3. As mensagens de erro retornadas pela API
