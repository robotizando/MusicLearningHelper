# Resumo das Melhorias de Diagnóstico

## 📋 O que foi implementado

### 1. **Nova Tela de Diagnóstico Interativa**
   - Localização: `/diagnostic` (apenas para admins)
   - Interface moderna com botões para executar diferentes diagnósticos
   - Resultados exibidos em tempo real na mesma página

### 2. **Tipos de Diagnóstico Disponíveis**

#### 🔧 Variáveis de Ambiente (Node.js)
- Verifica se o `.env` está sendo carregado
- Mostra os caminhos resolvidos (DATA_DIR, UPLOADS_DIR, PROCESSED_DIR)
- Conta quantos arquivos existem em cada diretório

#### 🐍 Variáveis de Ambiente (Python)
- Executa o script `check-env.py`
- Verifica se o Python consegue ler as variáveis de ambiente
- Detecta pastas locais indesejadas (`./uploads/` e `./processed/`)

#### 🎵 Instalação do Spleeter
- Verifica se o Spleeter está instalado corretamente
- Testa a importação e funcionalidade básica

#### 📁 Verificação de Caminhos
- Detecta se há pastas `uploads` ou `processed` dentro do projeto (problema!)
- Mostra os caminhos configurados vs. caminhos locais

#### 🗄️ Conexão do Banco de Dados
- Verifica a conexão com o SQLite
- Conta registros nas tabelas principais

#### ✅ Diagnóstico Completo
- Executa todos os diagnósticos em sequência
- Útil para obter um relatório completo do sistema

### 3. **Scripts de Diagnóstico Standalone**

#### `check-env.js`
```bash
node check-env.js
```
- Script Node.js que pode ser executado independentemente
- Útil para diagnóstico via SSH

#### `check-env.py`
```bash
source venv/bin/activate
python3 check-env.py
```
- Script Python equivalente
- Detecta pastas locais que não deveriam existir

### 4. **Logs Melhorados no Servidor**

Adicionados logs detalhados em:
- **server.js** (linhas 27-44): Logs de configuração de diretórios na inicialização
- **process_audio.py** (linhas 130-141): Logs de caminhos durante processamento

Agora ao iniciar o servidor, você verá:
```
========== CONFIGURAÇÃO DE DIRETÓRIOS ==========
__dirname: /caminho/do/projeto
DATA_DIR (env): ../mdata
DATA_DIR (resolvido): /caminho/do/mdata
UPLOADS_DIR: /caminho/do/mdata/uploads
PROCESSED_DIR: /caminho/do/mdata/processed
================================================
```

## 🚀 Como Usar em Produção

### 1. Fazer Deploy dos Novos Arquivos
```bash
# Envie os novos arquivos para produção:
- check-env.js
- check-env.py
- templates/diagnostic-dashboard.html
- TROUBLESHOOT_PATHS.md (documentação)
```

### 2. Acessar a Tela de Diagnóstico
1. Faça login como admin
2. Acesse o menu **Diagnóstico Sistema**
3. Clique nos botões para executar cada diagnóstico

### 3. Verificar Logs do Servidor
```bash
# Se usar PM2:
pm2 logs music-helper

# Se usar systemd:
journalctl -u seu-servico -f

# Procure por:
# "========== CONFIGURAÇÃO DE DIRETÓRIOS =========="
```

### 4. Executar Scripts Manualmente (via SSH)
```bash
cd /caminho/do/projeto

# Diagnóstico Node.js
node check-env.js

# Diagnóstico Python
source venv/bin/activate
python3 check-env.py
```

## 🔍 Identificando o Problema em Produção

### Sintomas de que `.env` não está sendo carregado:
- ❌ DATA_DIR (env) mostra "não definida"
- ❌ Caminhos resolvidos apontam para `./data` em vez de `../mdata`
- ❌ Pastas `./uploads/` e `./processed/` existem dentro do projeto

### O que deve aparecer se estiver correto:
- ✅ DATA_DIR (env): `../mdata`
- ✅ DATA_DIR (resolvido): `/caminho/completo/mdata`
- ✅ Pasta ./uploads/ local: "Não existe (OK)"
- ✅ Pasta ./processed/ local: "Não existe (OK)"

## 🛠️ Soluções Comuns

### Problema: `.env` não está sendo lido
**Solução 1:** Verificar se o arquivo existe
```bash
ls -la .env
```

**Solução 2:** Reiniciar completamente o serviço
```bash
# PM2
pm2 delete all
pm2 start server.js --name music-helper

# Systemd
sudo systemctl restart seu-servico
```

**Solução 3:** Usar caminhos absolutos no `.env`
```env
DATA_DIR=/caminho/absoluto/para/mdata
DB_PATH=/caminho/absoluto/para/mdata/database/uploads.db
```

### Problema: Pastas locais foram criadas
```bash
# Fazer backup
tar -czf backup-pastas-locais.tar.gz uploads/ processed/

# Remover
rm -rf uploads/ processed/

# Reiniciar servidor
pm2 restart music-helper
```

## 📚 Documentação Adicional

- **TROUBLESHOOT_PATHS.md**: Guia completo de troubleshooting
- **Logs do servidor**: Sempre consulte os logs para ver os caminhos sendo usados
- **Scripts de diagnóstico**: Use `check-env.js` e `check-env.py` para verificação rápida

## ⚡ Dica Rápida

Se em produção os arquivos estão indo para o lugar errado:

1. Acesse `/diagnostic`
2. Clique em "Variáveis de Ambiente (Node.js)"
3. Verifique o valor de "DATA_DIR (resolvido)"
4. Se não for o esperado, o `.env` não está sendo carregado corretamente

---

**Data de criação**: 2025-12-16
**Versão**: 1.0
