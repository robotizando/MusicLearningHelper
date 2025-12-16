#!/usr/bin/env python3
"""
Script de diagnóstico para verificar variáveis de ambiente no Python
Use em produção para verificar se o .env está sendo carregado
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

print('=' * 70)
print('DIAGNÓSTICO DE VARIÁVEIS DE AMBIENTE (PYTHON)')
print('=' * 70)
print()

# Diretório do script
script_dir = os.path.dirname(os.path.abspath(__file__))
print(f'Diretório atual do script: {script_dir}')
print()

# Verifica arquivo .env
env_path = os.path.join(script_dir, '.env')
env_exists = os.path.exists(env_path)
print(f'Arquivo .env existe? {env_exists}')
print(f'Caminho do .env: {env_path}')
print()

# Carrega .env
load_dotenv()
print('dotenv.load_dotenv() executado')
print()

# Mostra variáveis relevantes
print('Variáveis de Ambiente:')
print('-' * 70)
print(f'DATA_DIR (raw)        : {os.getenv("DATA_DIR", "NÃO DEFINIDA")}')
print(f'DB_PATH (raw)         : {os.getenv("DB_PATH", "NÃO DEFINIDA")}')
print(f'PORT                  : {os.getenv("PORT", "NÃO DEFINIDA")}')
print(f'SESSION_SECRET        : {"DEFINIDA" if os.getenv("SESSION_SECRET") else "NÃO DEFINIDA"}')
print()

# Calcula caminhos resolvidos (igual ao process_audio.py)
def get_data_dir():
    """Obtém o diretório base de dados a partir das variáveis de ambiente"""
    data_dir = os.getenv('DATA_DIR', './data')

    # Se for caminho relativo, resolve a partir do diretório do script
    if not os.path.isabs(data_dir):
        data_dir = os.path.join(os.path.dirname(__file__), data_dir)

    return data_dir

def get_db_path():
    """Obtém o caminho do banco de dados a partir das variáveis de ambiente"""
    db_path = os.getenv('DB_PATH', './data/database/uploads.db')

    # Se for caminho relativo, resolve a partir do diretório do script
    if not os.path.isabs(db_path):
        db_path = os.path.join(os.path.dirname(__file__), db_path)

    return db_path

data_dir = get_data_dir()
uploads_dir = os.path.join(data_dir, 'uploads')
processed_dir = os.path.join(data_dir, 'processed')
db_path = get_db_path()

print('Caminhos Resolvidos (como o Python vê):')
print('-' * 70)
print(f'DATA_DIR (resolvido)  : {data_dir}')
print(f'UPLOADS_DIR           : {uploads_dir}')
print(f'PROCESSED_DIR         : {processed_dir}')
print(f'DB_PATH (resolvido)   : {db_path}')
print()

# Verifica se os diretórios existem
print('Diretórios Existem?')
print('-' * 70)
print(f'DATA_DIR              : {"SIM" if os.path.exists(data_dir) else "NÃO"}')
print(f'UPLOADS_DIR           : {"SIM" if os.path.exists(uploads_dir) else "NÃO"}')
print(f'PROCESSED_DIR         : {"SIM" if os.path.exists(processed_dir) else "NÃO"}')
print(f'DB_PATH (dir)         : {"SIM" if os.path.exists(os.path.dirname(db_path)) else "NÃO"}')
print()

# Lista conteúdo se existirem
if os.path.exists(uploads_dir):
    uploads = os.listdir(uploads_dir)
    print(f'UPLOADS_DIR contém {len(uploads)} arquivo(s)')

if os.path.exists(processed_dir):
    processed = os.listdir(processed_dir)
    print(f'PROCESSED_DIR contém {len(processed)} arquivo(s)')

print()

# Verifica se há pastas "uploads" e "processed" no diretório do projeto
project_uploads = os.path.join(script_dir, 'uploads')
project_processed = os.path.join(script_dir, 'processed')

print('⚠️  VERIFICAÇÃO DE PASTAS LOCAIS (dentro do projeto):')
print('-' * 70)
if os.path.exists(project_uploads):
    local_uploads = os.listdir(project_uploads)
    print(f'❌ ENCONTRADA: ./uploads/ com {len(local_uploads)} arquivo(s)')
    print(f'   Caminho: {project_uploads}')
else:
    print('✅ Pasta ./uploads/ não existe (OK)')

if os.path.exists(project_processed):
    local_processed = os.listdir(project_processed)
    print(f'❌ ENCONTRADA: ./processed/ com {len(local_processed)} arquivo(s)')
    print(f'   Caminho: {project_processed}')
else:
    print('✅ Pasta ./processed/ não existe (OK)')

print()
print('=' * 70)
