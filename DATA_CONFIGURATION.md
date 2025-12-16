# Configuração de Diretórios de Dados

## Resumo Rápido

Todos os dados da aplicação (uploads, arquivos processados e banco de dados) agora podem ser configurados através de variáveis de ambiente no arquivo `.env`.

## Configuração Padrão

Por padrão, todos os dados ficam dentro da pasta `data/`:

```
data/
├── uploads/          # Arquivos de áudio enviados
├── processed/        # Arquivos processados (vocals, drums, bass, other)
└── database/         # Banco de dados SQLite
    └── uploads.db
```

## Como Configurar

### 1. Edite o arquivo `.env`

```bash
# Diretório base para uploads e arquivos processados
DATA_DIR=./data

# Caminho do banco de dados
DB_PATH=./data/database/uploads.db
```

### 2. Exemplos de Uso

#### Mover todos os dados para outra pasta
```bash
DATA_DIR=/mnt/storage/music-data
DB_PATH=/mnt/storage/music-data/database/uploads.db
```

#### Usar caminho relativo fora do projeto
```bash
DATA_DIR=../mdata
DB_PATH=../mdata/database/uploads.db
```

#### Banco de dados em local diferente
```bash
DATA_DIR=./data
DB_PATH=/var/lib/music-helper/uploads.db
```

## Migração de Dados Existentes

Se você já tem dados nas pastas antigas (`uploads/` e `processed/`), execute:

```bash
node migrate-data.js
```

Este script irá:
- Copiar todos os arquivos para a nova estrutura
- Atualizar os caminhos no banco de dados
- Preservar os arquivos originais (você pode deletá-los manualmente depois)

## Instalação em Ambiente Novo

Para instalar em um novo ambiente:

1. Clone o repositório
2. Configure o `.env` com os caminhos desejados
3. Instale as dependências:
   ```bash
   npm install
   pip install -r requirements.txt
   ```
4. Inicie o servidor:
   ```bash
   node server.js
   ```

A aplicação criará automaticamente a estrutura de pastas necessária.

## Vantagens

✅ **Organização**: Todos os dados em um único local
✅ **Flexibilidade**: Fácil mover para outro disco/partição
✅ **Backup**: Basta fazer backup de uma pasta
✅ **Multi-ambiente**: Configuração diferente para dev/prod
✅ **Segurança**: Mais fácil configurar permissões

## Notas Importantes

- Caminhos relativos são resolvidos a partir da raiz do projeto
- Caminhos absolutos são usados como especificado
- A aplicação cria os diretórios automaticamente se não existirem
- Garanta que o usuário da aplicação tem permissões de leitura/escrita

## Troubleshooting

### Aplicação não encontra os arquivos
- Verifique se os caminhos no `.env` estão corretos
- Confirme que as variáveis estão sendo carregadas (veja os logs ao iniciar)

### Erro de permissão
```bash
chmod -R 755 /caminho/para/data
```

### Resetar para configuração padrão
```bash
DATA_DIR=./data
DB_PATH=./data/database/uploads.db
```
