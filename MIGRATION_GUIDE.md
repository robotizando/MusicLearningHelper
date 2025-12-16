# Guia de Migração - Estrutura de Dados Configurável

## Visão Geral

A aplicação foi atualizada para usar uma estrutura de dados centralizada e configurável. Agora todos os dados (uploads, arquivos processados e banco de dados) podem ser armazenados em um diretório único configurável.

## Nova Estrutura

### Antes (estrutura fixa)
```
MusicLearningHelper/
├── uploads/              # Arquivos de áudio originais
├── processed/            # Arquivos processados pelo Spleeter
└── data/
    └── uploads.db        # Banco de dados SQLite
```

### Depois (estrutura configurável)
```
MusicLearningHelper/
└── data/                 # Diretório base (configurável)
    ├── uploads/          # Arquivos de áudio originais
    ├── processed/        # Arquivos processados pelo Spleeter
    └── database/         # Banco de dados
        └── uploads.db
```

## Configuração

### Variáveis de Ambiente (.env)

```bash
# Diretório base para uploads e arquivos processados
# Caminho absoluto ou relativo (padrão: ./data)
DATA_DIR=./data

# Configuração do Banco de Dados
# Caminho absoluto ou relativo para o arquivo do banco de dados SQLite
# (padrão: ./data/database/uploads.db)
DB_PATH=./data/database/uploads.db
```

### Exemplos de Configuração

#### 1. Estrutura padrão (dentro do projeto)
```bash
DATA_DIR=./data
DB_PATH=./data/database/uploads.db
```

#### 2. Dados em diretório externo
```bash
DATA_DIR=/mnt/storage/music-helper-data
DB_PATH=/mnt/storage/music-helper-data/database/uploads.db
```

#### 3. Banco de dados em local separado
```bash
DATA_DIR=./data
DB_PATH=/var/lib/music-helper/database/uploads.db
```

#### 4. Caminho relativo fora do projeto
```bash
DATA_DIR=../music-data
DB_PATH=../music-data/database/uploads.db
```

## Como Migrar os Dados Existentes

### Passo 1: Configurar o .env

Edite o arquivo `.env` e configure as variáveis `DATA_DIR` e `DB_PATH` conforme desejado.

### Passo 2: Executar o script de migração

```bash
node migrate-data.js
```

O script irá:
1. Copiar todos os arquivos de `uploads/` para `DATA_DIR/uploads/`
2. Copiar todos os arquivos de `processed/` para `DATA_DIR/processed/`
3. Atualizar os caminhos no banco de dados

### Passo 3: Verificar a migração

1. Inicie a aplicação:
   ```bash
   npm start
   # ou
   node server.js
   ```

2. Acesse a aplicação e verifique se:
   - Os uploads existentes aparecem na lista
   - Os arquivos processados podem ser reproduzidos
   - Novos uploads funcionam corretamente

### Passo 4: Limpar arquivos antigos (CUIDADO!)

**IMPORTANTE: Só faça isso após confirmar que tudo está funcionando!**

Se a migração foi bem-sucedida e você configurou um novo diretório, pode deletar as pastas antigas:

```bash
# Faça backup primeiro!
rm -rf uploads/
rm -rf processed/
```

Se você manteve a configuração padrão (`DATA_DIR=./data`), as pastas antigas `uploads/` e `processed/` podem ser deletadas pois os dados agora estão em `data/uploads/` e `data/processed/`.

## Estrutura de Arquivos Criados

Quando a aplicação roda, ela cria automaticamente a seguinte estrutura no `DATA_DIR`:

```
DATA_DIR/
├── uploads/                    # Criado automaticamente
│   └── [arquivos de áudio]
├── processed/                  # Criado automaticamente
│   ├── upload_1/
│   │   ├── vocals.mp3
│   │   ├── vocals.png
│   │   ├── drums.mp3
│   │   ├── drums.png
│   │   ├── bass.mp3
│   │   ├── bass.png
│   │   ├── other.mp3
│   │   ├── other.png
│   │   └── chords.json
│   ├── upload_2/
│   └── ...
└── database/                   # Criado automaticamente
    └── uploads.db
```

## Benefícios

1. **Organização**: Todos os dados em um único diretório
2. **Flexibilidade**: Fácil mover dados para outro disco/partição
3. **Backup**: Mais fácil fazer backup de tudo de uma vez
4. **Deployment**: Facilita configuração em diferentes ambientes
5. **Segurança**: Mais fácil configurar permissões de acesso

## Troubleshooting

### Erro: "ENOENT: no such file or directory"

**Solução**: Verifique se os caminhos em `.env` estão corretos e se os diretórios existem (a aplicação cria automaticamente).

### Erro: "SQLITE_CANTOPEN: unable to open database file"

**Solução**: Verifique se o diretório do banco de dados tem permissões de escrita.

### Arquivos não aparecem após migração

**Solução**:
1. Verifique se o script de migração executou sem erros
2. Confirme que os caminhos no `.env` estão corretos
3. Verifique os logs da aplicação para ver os caminhos sendo usados

### Permissões negadas

**Solução**:
```bash
# Garanta que o usuário da aplicação tem permissões
chmod -R 755 DATA_DIR
chown -R seu-usuario:seu-grupo DATA_DIR
```

## Arquivos Modificados

Os seguintes arquivos foram atualizados para suportar a nova estrutura:

- `.env` / `.env.example` - Novas variáveis de ambiente
- `database.js` - Lê DB_PATH e cria estrutura automaticamente
- `server.js` - Lê DATA_DIR e configura caminhos de upload/processed
- `process_audio.py` - Lê variáveis de ambiente para processar áudio
- `migrate-data.js` - Script de migração (novo)
- `MIGRATION_GUIDE.md` - Este arquivo (novo)

## Suporte

Em caso de problemas, verifique:
1. Os logs da aplicação (`logs/` se existir)
2. As permissões dos diretórios
3. Se as variáveis de ambiente estão sendo carregadas corretamente

Para resetar para a configuração padrão, use:
```bash
DATA_DIR=./data
DB_PATH=./data/database/uploads.db
```
