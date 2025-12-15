#!/bin/bash
# Wrapper para processar áudio com ambiente virtual ativado

# Caminho do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Ativa o ambiente virtual
source "${SCRIPT_DIR}/venv/bin/activate"

# Executa o script Python com os argumentos passados
python3 "${SCRIPT_DIR}/process_audio.py" "$@"

# Captura o código de saída
EXIT_CODE=$?

# Desativa o ambiente virtual
deactivate

# Retorna o código de saída do script Python
exit $EXIT_CODE
