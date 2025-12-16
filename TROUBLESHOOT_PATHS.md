# Guia de Diagnóstico e Correção de Caminhos em Produção

## Problema
Os arquivos de upload e processamento estão indo para pastas dentro do projeto (`./uploads` e `./processed`) em vez de usar o diretório configurado no `.env` (`../mdata`).

## Diagnóstico

### 1. Execute o script de diagnóstico Node.js:
```bash
cd /caminho/do/projeto
node check-env.js
```

### 2. Execute o script de diagnóstico Python:
```bash
cd /caminho/do/projeto
source venv/bin/activate
python3 check-env.py
```

## Possíveis Causas e Soluções

### Causa 1: Arquivo `.env` não existe em produção
**Sintoma:** Os scripts mostram "NÃO DEFINIDA" para DATA_DIR e DB_PATH

**Solução:**
```bash
# Verifique se o .env existe
ls -la .env

# Se não existir, copie do exemplo e configure
cp .env.example .env
nano .env
```

Configure corretamente:
```env
DATA_DIR=../mdata
DB_PATH=../mdata/database/uploads.db
```

### Causa 2: Permissões do arquivo `.env`
**Sintoma:** Arquivo existe mas variáveis não são lidas

**Solução:**
```bash
# Verifique as permissões
ls -l .env

# Ajuste se necessário
chmod 644 .env
```

### Causa 3: O `.env` está sendo ignorado pelo processo
**Sintoma:** Funciona localmente mas não em produção

**Solução para PM2:**
```bash
# Se usar PM2, reinicie completamente
pm2 delete all
pm2 start server.js --name music-helper

# Ou especifique o .env explicitamente
pm2 start server.js --name music-helper --env production
```

**Solução para systemd:**
```bash
# Edite o serviço systemd para incluir as variáveis
sudo nano /etc/systemd/system/seu-servico.service

# Adicione na seção [Service]:
Environment="DATA_DIR=/caminho/completo/para/mdata"
Environment="DB_PATH=/caminho/completo/para/mdata/database/uploads.db"

# Recarregue e reinicie
sudo systemctl daemon-reload
sudo systemctl restart seu-servico
```

### Causa 4: Caminhos relativos resolvem diferente
**Sintoma:** Os caminhos resolvidos são diferentes do esperado

**Solução:** Use caminhos absolutos no `.env`:
```env
# Em vez de relativo:
# DATA_DIR=../mdata

# Use absoluto:
DATA_DIR=/home/usuario/mdata
DB_PATH=/home/usuario/mdata/database/uploads.db
```

Para descobrir o caminho completo:
```bash
cd ..
mkdir -p mdata
realpath mdata
# Use o resultado no .env
```

## Limpeza das Pastas Locais Indesejadas

Se houver pastas `uploads` e `processed` dentro do projeto que não deveriam existir:

```bash
# CUIDADO! Backup primeiro se houver dados importantes
cd /caminho/do/projeto

# Faça backup
tar -czf backup-local-folders.tar.gz uploads/ processed/ 2>/dev/null

# Remova as pastas locais (se tiver certeza)
rm -rf uploads/
rm -rf processed/

# Verifique que não existem mais
ls -la | grep -E "uploads|processed"
```

## Verificação Final

Após aplicar as correções:

1. Reinicie o servidor
2. Execute os scripts de diagnóstico novamente
3. Faça um upload de teste
4. Verifique onde os arquivos foram salvos:

```bash
# Verifique o diretório correto
ls -lh ../mdata/uploads/
ls -lh ../mdata/processed/

# NÃO deveria haver arquivos aqui:
ls -lh ./uploads/
ls -lh ./processed/
```

## Prevenção

Adicione ao `.gitignore` para evitar commit acidental das pastas locais:
```
# Pastas de dados (devem estar em DATA_DIR configurado)
/uploads/
/processed/
/data/uploads/
/data/processed/
```

## Monitoramento

Crie um cron job para alertar se pastas locais forem criadas:
```bash
# Adicione ao crontab
crontab -e

# Adicione esta linha (checa a cada hora)
0 * * * * test -d /caminho/do/projeto/uploads && echo "ALERTA: Pasta uploads local existe!" | mail -s "Alerta MusicHelper" seu@email.com
```

## Contato
Se o problema persistir após seguir este guia, documente:
- Saída dos scripts de diagnóstico
- Como o servidor está sendo executado (PM2, systemd, etc.)
- Sistema operacional e versão
