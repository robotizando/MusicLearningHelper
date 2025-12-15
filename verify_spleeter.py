#!/usr/bin/env python3
"""
Script para verificar a instalação do Spleeter e suas dependências
"""

import sys
import os

print("=" * 60)
print("VERIFICAÇÃO DE INSTALAÇÃO DO SPLEETER")
print("=" * 60)
print()

# 1. Versão do Python
print(f"1. Python Version: {sys.version}")
print(f"   Executável: {sys.executable}")
print()

# 2. Caminho do Python
print(f"2. Python Path:")
for p in sys.path:
    print(f"   - {p}")
print()

# 3. Pacotes instalados
print("3. Verificando pacotes instalados:")
packages_to_check = [
    'numpy',
    'tensorflow',
    'spleeter',
    'ffmpeg',
    'librosa',
    'matplotlib',
    'pydub',
    'soundfile'
]

for package in packages_to_check:
    try:
        if package == 'ffmpeg':
            import ffmpeg
            print(f"   ✓ {package}: Instalado")
        else:
            mod = __import__(package)
            version = getattr(mod, '__version__', 'unknown')
            print(f"   ✓ {package}: {version}")
    except ImportError as e:
        print(f"   ✗ {package}: NÃO INSTALADO - {e}")
print()

# 4. Teste específico do Spleeter
print("4. Teste de importação do Spleeter:")
try:
    from spleeter.separator import Separator
    print("   ✓ Spleeter.Separator importado com sucesso!")

    # Tenta criar uma instância
    try:
        separator = Separator('spleeter:2stems')
        print("   ✓ Separator inicializado com sucesso!")
    except Exception as e:
        print(f"   ⚠ Erro ao inicializar Separator: {e}")

except ImportError as e:
    print(f"   ✗ ERRO ao importar Spleeter: {e}")
    print(f"   Detalhes: {sys.exc_info()}")
print()

# 5. Verifica FFmpeg no sistema
print("5. Verificando FFmpeg no sistema:")
import subprocess
try:
    result = subprocess.run(['ffmpeg', '-version'],
                          capture_output=True,
                          text=True,
                          timeout=5)
    if result.returncode == 0:
        first_line = result.stdout.split('\n')[0]
        print(f"   ✓ FFmpeg encontrado: {first_line}")
    else:
        print(f"   ✗ FFmpeg não encontrado ou erro ao executar")
except FileNotFoundError:
    print("   ✗ FFmpeg não está instalado no sistema")
except Exception as e:
    print(f"   ⚠ Erro ao verificar FFmpeg: {e}")
print()

# 6. Variáveis de ambiente
print("6. Variáveis de ambiente relevantes:")
env_vars = ['PATH', 'PYTHONPATH', 'LD_LIBRARY_PATH', 'VIRTUAL_ENV']
for var in env_vars:
    value = os.environ.get(var, 'NÃO DEFINIDA')
    if var == 'PATH':
        print(f"   {var}:")
        for p in value.split(':'):
            print(f"      - {p}")
    else:
        print(f"   {var}: {value}")
print()

print("=" * 60)
print("VERIFICAÇÃO CONCLUÍDA")
print("=" * 60)
