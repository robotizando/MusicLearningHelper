# Guia de Exportação e Importação de Músicas

## Visão Geral

Esta feature permite exportar músicas já processadas como arquivos ZIP e importá-las em outro servidor, facilitando a migração de dados ou backup de músicas processadas.

## Funcionalidades

### 1. Exportação de Músicas

#### Como usar:
1. Acesse a página "Minhas Músicas" (`/my-uploads`)
2. Localize a música que deseja exportar (apenas músicas com status "Processado" podem ser exportadas)
3. Clique no botão **"Exportar"** (azul com ícone de download)
4. O navegador fará o download de um arquivo ZIP com o nome: `Artista - Nome da Música.zip`

#### Conteúdo do ZIP exportado:
```
Artista - Nome da Música.zip
├── metadata.json              # Metadados da música (nome, artista, data, etc.)
├── original/
│   └── arquivo_original.mp3   # Arquivo de áudio original
├── stems/
│   ├── vocals.mp3            # Faixa de vocais separada
│   ├── drums.mp3             # Faixa de bateria separada
│   ├── bass.mp3              # Faixa de baixo separada
│   └── other.mp3             # Faixa de outros instrumentos
├── waveforms/
│   ├── vocals.png            # Visualização de waveform dos vocais
│   ├── drums.png             # Visualização de waveform da bateria
│   ├── bass.png              # Visualização de waveform do baixo
│   └── other.png             # Visualização de waveform dos outros
└── analysis/
    └── chords.json           # Análise de acordes da música
```

#### Via API:
```bash
GET /api/music/export/:uploadId
```

**Requisitos:**
- Usuário autenticado
- Música deve pertencer ao usuário (ou usuário deve ser admin)
- Status da música deve ser "completed"

**Resposta:**
- Sucesso: Arquivo ZIP para download
- Erro 404: Música não encontrada
- Erro 403: Sem permissão para exportar
- Erro 400: Música não está processada

---

### 2. Importação de Músicas

#### Como usar:
1. Acesse a página "Minhas Músicas" (`/my-uploads`)
2. No topo da página, localize a seção **"Importar Música Processada"**
3. Clique em **"Escolher arquivo"** e selecione o arquivo ZIP exportado anteriormente
4. Clique no botão **"Importar"**
5. Aguarde a mensagem de sucesso (✓ Importado com sucesso!)
6. A página será recarregada automaticamente e a música importada aparecerá na lista

#### Processo de importação:
1. O sistema lê o arquivo `metadata.json` para obter informações da música
2. O arquivo original é salvo na pasta `uploads/`
3. Os stems, waveforms e análise de acordes são extraídos para a pasta `processed/upload_X/`
4. Um novo registro é criado no banco de dados com status "completed"
5. A música fica disponível imediatamente para reprodução

#### Via API:
```bash
POST /api/music/import
Content-Type: multipart/form-data

Campo do formulário: zipFile (arquivo ZIP)
```

**Requisitos:**
- Usuário autenticado
- Arquivo ZIP válido (máximo 200MB)
- ZIP deve conter `metadata.json` e arquivo original

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Música importada com sucesso",
  "uploadId": 123,
  "songName": "Nome da Música",
  "artist": "Nome do Artista"
}
```

**Resposta de erro:**
```json
{
  "error": "Descrição do erro"
}
```

---

## Casos de Uso

### 1. Migração entre Servidores
Exporte todas as músicas de um servidor e importe no outro:
```bash
# No servidor origem
curl -H "Cookie: connect.sid=SESSION_ID" \
     http://servidor-origem.com/api/music/export/1 \
     -o musica1.zip

# No servidor destino
curl -X POST -H "Cookie: connect.sid=SESSION_ID" \
     -F "zipFile=@musica1.zip" \
     http://servidor-destino.com/api/music/import
```

### 2. Backup de Músicas Processadas
Crie backups periódicos das músicas processadas para evitar perda de dados.

### 3. Compartilhamento entre Usuários
Exporte uma música e compartilhe o ZIP com outro usuário, que pode importá-la em sua própria conta.

---

## Estrutura do metadata.json

```json
{
  "id": 1,
  "song_name": "Nome da Música",
  "artist": "Nome do Artista",
  "original_filename": "arquivo_original.mp3",
  "file_size": 5242880,
  "upload_date": "2025-12-16T12:00:00.000Z",
  "processing_status": "completed",
  "export_date": "2025-12-16T13:30:00.000Z",
  "export_format_version": "1.0"
}
```

---

## Limitações e Notas

1. **Tamanho máximo do ZIP para importação:** 200MB
2. **Permissões:** Usuários só podem exportar suas próprias músicas (admins podem exportar todas)
3. **Status necessário:** Apenas músicas com status "completed" podem ser exportadas
4. **Arquivos opcionais:** Se `chords.json` não existir no ZIP, a importação ainda funcionará
5. **Versão do formato:** O campo `export_format_version` permite compatibilidade futura com novos formatos

---

## Solução de Problemas

### Erro: "Arquivo de metadados não encontrado no ZIP"
- Certifique-se de que o ZIP foi exportado pelo sistema e contém o arquivo `metadata.json`

### Erro: "Arquivo original não encontrado no ZIP"
- Verifique se a pasta `original/` existe no ZIP e contém o arquivo de áudio

### Erro: "Metadados incompletos no arquivo ZIP"
- O `metadata.json` deve conter pelo menos `song_name` e `original_filename`

### Erro: "Apenas arquivos ZIP são permitidos"
- Certifique-se de que está enviando um arquivo com extensão `.zip`

### Exportação não gera stems
- Verifique se os arquivos processados existem em `processed/upload_X/`
- Verifique os logs do servidor para identificar problemas no processamento original

---

## API Endpoints

| Endpoint | Método | Autenticação | Descrição |
|----------|--------|--------------|-----------|
| `/api/music/export/:uploadId` | GET | Sim | Exporta música como ZIP |
| `/api/music/import` | POST | Sim | Importa música de um ZIP |

---

## Logs

Todas as operações de exportação e importação são registradas no sistema de logs:

```javascript
// Exportação
logger.info(`Iniciando exportação da música ID ${uploadId} pelo usuário ${userId}`);
logger.info(`Exportação da música ${uploadId} finalizada`);

// Importação
logger.info(`Iniciando importação de música pelo usuário ${userId}`);
logger.info(`Metadata encontrado: ${metadata.song_name} - ${metadata.artist}`);
logger.info(`Importação concluída com sucesso. Upload ID: ${newUploadId}`);
```

---

## Suporte

Para reportar problemas ou sugerir melhorias, entre em contato com o desenvolvedor ou abra uma issue no repositório do projeto.
