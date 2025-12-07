# MusicLearningHelper
Tools and Help system for beginner musicians

## Descrição

Sistema web para auxiliar músicos iniciantes com ferramentas de prática, incluindo:
- Player multitrack de músicas pré-processadas
- Visualização de cifras
- **Upload de áudio com separação automática de faixas usando Spleeter**
- Player customizado para músicas processadas

## Funcionalidades

### 1. Músicas Multitrack
Acesse músicas já processadas com faixas separadas (vocals, bass, drums, other)

### 2. Cifras
Visualize acordes e letras de músicas

### 3. Upload de Áudio
- Faça upload de arquivos de áudio (MP3, WAV, OGG, MP4)
- Processamento automático usando Spleeter do Deezer
- Separação em 4 faixas: vocals, drums, bass, other
- Armazenamento em banco de dados SQLite

### 4. Meus Uploads
- Visualize todas as músicas enviadas
- Acompanhe o status do processamento
- Reproduza músicas processadas no player multitrack

## Requisitos

### Node.js
- Node.js v18 ou superior (recomendado)
- npm 8 ou superior

### Python
- Python 3.7 ou superior
- pip

### Sistema
- FFmpeg instalado no sistema

## Instalação

### 1. Instalar dependências Node.js

```bash
npm install
```

### 2. Instalar FFmpeg

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

#### macOS:
```bash
brew install ffmpeg
```

#### Windows:
Baixe de https://ffmpeg.org/download.html

### 3. Instalar dependências Python

Crie um ambiente virtual e instale as dependências:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Nota:** A instalação do Spleeter e TensorFlow pode levar alguns minutos e requer aproximadamente 1GB de espaço em disco.

### 4. Criar estrutura de pastas

```bash
mkdir -p data uploads processed
```

## Como Rodar

### Modo Desenvolvimento (com auto-reload)
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

O servidor estará disponível em: **http://localhost:3000**

## Estrutura do Projeto

```
MusicLearningHelper/
├── data/                          # Arquivos de dados
│   ├── uploads.db                # Banco SQLite (criado automaticamente)
│   ├── cifras.json               # Dados de cifras
│   └── multitrack-musicas.json   # Dados de multitracks
├── uploads/                       # Arquivos de áudio enviados
├── processed/                     # Músicas processadas pelo Spleeter
│   └── upload_{id}/              # Cada upload tem sua pasta
│       ├── vocals.wav
│       ├── drums.wav
│       ├── bass.wav
│       └── other.wav
├── templates/                     # Templates HTML
│   ├── home.html
│   ├── upload.html
│   ├── my-uploads.html
│   └── player-upload.html
├── public/                        # Arquivos estáticos (CSS, JS, imagens)
├── server.js                      # Servidor Express
├── database.js                    # Módulo do banco de dados
├── process_audio.py               # Script Python para Spleeter
├── logger.js                      # Sistema de logs
└── requirements.txt               # Dependências Python
```

## Uso

### Fazer Upload de uma Música

1. Acesse http://localhost:3000
2. Clique em "Upload de Áudio"
3. Preencha o nome da música e artista (opcional)
4. Selecione ou arraste um arquivo de áudio
5. Clique em "Enviar Arquivo"
6. O processamento iniciará automaticamente em background

### Acompanhar o Processamento

1. Acesse "Meus Uploads" no menu
2. Veja o status de cada música:
   - **Pendente**: Aguardando processamento
   - **Processando**: Spleeter está separando as faixas
   - **Processado**: Pronto para tocar
   - **Erro**: Falha no processamento

### Reproduzir Música Processada

1. Em "Meus Uploads", clique em "Tocar" na música desejada
2. Use o player multitrack para:
   - Ativar/desativar faixas individuais
   - Ajustar volume de cada faixa
   - Controlar a reprodução

## Tecnologias Utilizadas

### Backend
- **Node.js** + **Express**: Servidor web
- **SQLite3**: Banco de dados
- **Multer**: Upload de arquivos
- **Winston**: Sistema de logs

### Processamento de Áudio
- **Spleeter (Deezer)**: Separação de faixas de áudio
- **TensorFlow**: Machine learning para separação
- **FFmpeg**: Processamento de áudio

### Frontend
- **Bootstrap 3**: UI Framework
- **jQuery**: Manipulação DOM
- **TrackSwitch**: Player multitrack customizado

## Troubleshooting

### Erro: "Spleeter não está instalado"
```bash
pip3 install spleeter
```

### Erro: "FFmpeg não encontrado"
Verifique se FFmpeg está instalado:
```bash
ffmpeg -version
```

### Processamento travou
Verifique os logs do servidor. Músicas muito grandes podem demorar vários minutos para processar.

### Porta 3000 em uso
Altere a porta usando variável de ambiente:
```bash
PORT=8080 npm start
```

## Limitações

- Tamanho máximo de upload: 50 MB
- Formatos suportados: MP3, WAV, OGG, MP4
- O processamento pode levar de 2 a 10 minutos dependendo do tamanho do arquivo
- Requer conexão com internet na primeira execução do Spleeter (download de modelos)

## Autor

Ferramenta criada por **Daniel O. Basconcello Filho**
- Website: https://robotizando.com.br

## Licença

ISC
