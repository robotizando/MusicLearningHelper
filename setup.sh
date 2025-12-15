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

# Verifica Python3.10
echo -n "Verificando Python3.11... "
PYTHON_CMD=""
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
    PYTHON_VERSION=$(python3.11 --version)
    echo -e "${GREEN}✓ Instalado ($PYTHON_VERSION)${NC}"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | grep -oP '\d+\.\d+')
    if [[ "$PYTHON_VERSION" == "3.11" ]]; then
        PYTHON_CMD="python3"
        echo -e "${GREEN}✓ Instalado (Python $PYTHON_VERSION)${NC}"
    else
        echo -e "${RED}✗ Python 3.11.x não encontrado${NC}"
        echo "Versão atual: $(python3 --version)"
        echo "Spleeter 2.4.2 requer Python 3.11.x"
        echo "Por favor, instale Python 3.11:"
        echo "  Ubuntu/Debian: sudo apt-get install python3.11 python3.11-venv python3.11-dev"
        echo "  macOS: brew install python@3.11"
        exit 1
    fi
else
    echo -e "${RED}✗ Python3 não encontrado${NC}"
    echo "Por favor, instale Python 3.11.x"
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
echo "2. Criando ambiente virtual Python com Python 3.11..."
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Ambiente virtual criado com $($PYTHON_CMD --version)${NC}"
    else
        echo -e "${RED}✗ Erro ao criar ambiente virtual${NC}"
        echo "Tente instalar: sudo apt-get install python3.11-venv"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Ambiente virtual já existe${NC}"
    echo "   Verificando versão do Python no venv..."
    VENV_PYTHON_VERSION=$(venv/bin/python --version)
    echo "   $VENV_PYTHON_VERSION"
fi

echo ""

# Instala dependências Python
echo "3. Instalando dependências Python (isso pode demorar alguns minutos)..."
echo "   Isso inclui: Spleeter, TensorFlow, Matplotlib, Librosa..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependências Python instaladas${NC}"

    # Verifica se o TensorFlow foi instalado corretamente
    echo "   Verificando instalação do TensorFlow..."
    python3 -c "import tensorflow; print('TensorFlow version:', tensorflow.__version__)" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ TensorFlow instalado corretamente${NC}"
    else
        echo -e "${YELLOW}⚠ TensorFlow não foi detectado, tentando reinstalar...${NC}"
        pip install --upgrade tensorflow==2.12.0
    fi

    # Verifica se o Spleeter foi instalado corretamente
    echo "   Verificando instalação do Spleeter..."
    python3 -c "from spleeter.separator import Separator; print('Spleeter OK')" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Spleeter instalado corretamente${NC}"
    else
        echo -e "${RED}✗ Erro: Spleeter não pôde ser carregado${NC}"
        echo "   Execute 'source venv/bin/activate && python3 verify_spleeter.py' para mais detalhes"
    fi
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
