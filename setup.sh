#!/bin/bash

echo "======================================"
echo "MusicLearningHelper - Setup Script"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica Node.js
echo -n "Verificando Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Instalado ($NODE_VERSION)${NC}"
else
    echo -e "${RED}✗ Node.js não encontrado${NC}"
    echo "Por favor, instale Node.js v18 ou superior"
    exit 1
fi

# Verifica npm
echo -n "Verificando npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ Instalado ($NPM_VERSION)${NC}"
else
    echo -e "${RED}✗ npm não encontrado${NC}"
    exit 1
fi

# Verifica Python3
echo -n "Verificando Python3... "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Instalado ($PYTHON_VERSION)${NC}"
else
    echo -e "${RED}✗ Python3 não encontrado${NC}"
    echo "Por favor, instale Python 3.7 ou superior"
    exit 1
fi

# Verifica pip3
echo -n "Verificando pip3... "
if command -v pip3 &> /dev/null; then
    PIP_VERSION=$(pip3 --version)
    echo -e "${GREEN}✓ Instalado${NC}"
else
    echo -e "${RED}✗ pip3 não encontrado${NC}"
    exit 1
fi

# Verifica FFmpeg
echo -n "Verificando FFmpeg... "
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    echo -e "${GREEN}✓ Instalado${NC}"
else
    echo -e "${YELLOW}⚠ FFmpeg não encontrado${NC}"
    echo "FFmpeg é necessário para o Spleeter funcionar"
    echo "Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "macOS: brew install ffmpeg"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "======================================"
echo "Instalando dependências..."
echo "======================================"
echo ""

# Instala dependências Node.js
echo "1. Instalando dependências Node.js..."
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependências Node.js instaladas${NC}"
else
    echo -e "${RED}✗ Erro ao instalar dependências Node.js${NC}"
    exit 1
fi

echo ""

# Cria ambiente virtual Python
echo "2. Criando ambiente virtual Python..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Ambiente virtual criado${NC}"
    else
        echo -e "${RED}✗ Erro ao criar ambiente virtual${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Ambiente virtual já existe${NC}"
fi

echo ""

# Instala dependências Python
echo "3. Instalando dependências Python (isso pode demorar alguns minutos)..."
echo "   Isso inclui: Spleeter, TensorFlow, Matplotlib, Librosa..."
source venv/bin/activate
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependências Python instaladas${NC}"
    echo "   Verificando compatibilidade numpy/tensorflow..."
    pip install "numpy<2.0" --force-reinstall -q
    echo -e "${GREEN}✓ NumPy ajustado para compatibilidade${NC}"
else
    echo -e "${RED}✗ Erro ao instalar dependências Python${NC}"
    exit 1
fi
deactivate

echo ""

# Cria estrutura de pastas
echo "4. Criando estrutura de pastas..."
mkdir -p data uploads processed
echo -e "${GREEN}✓ Pastas criadas${NC}"

echo ""
echo "======================================"
echo -e "${GREEN}Instalação concluída com sucesso!${NC}"
echo "======================================"
echo ""
echo "Para iniciar o servidor:"
echo "  Desenvolvimento: npm run dev"
echo "  Produção:        npm start"
echo ""
echo "O servidor estará disponível em: http://localhost:3000"
echo ""
