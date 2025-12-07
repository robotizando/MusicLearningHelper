#!/usr/bin/env venv/bin/python3
"""
Script para processar áudio usando Spleeter
Separa a música em 4 faixas: vocals, drums, bass, other
"""

import sys
import os
import json
import sqlite3
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use backend sem display
import matplotlib.pyplot as plt
import librosa
import soundfile as sf

def generate_waveform(audio_file, output_image, color='#4CAF50'):
    """Gera imagem da forma de onda do áudio"""
    try:
        print(f"Gerando waveform para: {os.path.basename(audio_file)}")

        # Carrega o áudio
        y, sr = librosa.load(audio_file, sr=None, mono=True)

        # Configurações para imagem sem margens
        width_px = 1200
        height_px = 300
        dpi = 100

        # Cria figura com dimensões exatas em pixels
        fig = plt.figure(figsize=(width_px/dpi, height_px/dpi), dpi=dpi, facecolor='none')
        ax = fig.add_axes([0, 0, 1, 1])  # [left, bottom, width, height] - ocupa 100% da figura
        ax.set_facecolor('none')

        # Plota a forma de onda
        time = np.linspace(0, len(y) / sr, len(y))
        ax.fill_between(time, y, alpha=0.6, color=color)
        ax.plot(time, y, color=color, linewidth=0.5, alpha=0.8)

        # Remove eixos e define limites exatos
        ax.set_xlim(0, len(y) / sr)
        ax.set_ylim(-1, 1)
        ax.axis('off')

        # Salva imagem sem qualquer margem ou padding
        plt.savefig(output_image, transparent=True, bbox_inches=None, pad_inches=0, dpi=dpi)
        plt.close()

        print(f"Waveform salvo em: {output_image}")
        return True
    except Exception as e:
        print(f"Erro ao gerar waveform: {e}")
        return False

def update_db_status(upload_id, status, processed_path=None):
    """Atualiza o status do processamento no banco de dados"""
    db_path = os.path.join(os.path.dirname(__file__), 'data', 'uploads.db')

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        if processed_path:
            cursor.execute(
                "UPDATE uploads SET processing_status = ?, processed_path = ? WHERE id = ?",
                (status, processed_path, upload_id)
            )
        else:
            cursor.execute(
                "UPDATE uploads SET processing_status = ? WHERE id = ?",
                (status, upload_id)
            )

        conn.commit()
        conn.close()
        print(f"Status atualizado para: {status}")
    except Exception as e:
        print(f"Erro ao atualizar banco de dados: {e}")

def process_audio(audio_path, upload_id):
    """Processa o áudio usando Spleeter"""
    try:
        print(f"Iniciando processamento do arquivo: {audio_path}")
        print(f"Upload ID: {upload_id}")

        # Atualiza status para "processing"
        update_db_status(upload_id, 'processing')

        # Importa Spleeter
        try:
            from spleeter.separator import Separator
        except ImportError:
            print("ERRO: Spleeter não está instalado!")
            print("Instale com: pip install spleeter")
            update_db_status(upload_id, 'error')
            return False

        # Cria diretório de saída
        base_dir = os.path.dirname(__file__)
        output_dir = os.path.join(base_dir, 'processed', f'upload_{upload_id}')
        os.makedirs(output_dir, exist_ok=True)

        print(f"Diretório de saída: {output_dir}")

        # Configura o Spleeter para 4 stems (vocals, drums, bass, other)
        separator = Separator('spleeter:4stems')

        print("Separando faixas com Spleeter (4 stems)...")
        print("Isso pode levar alguns minutos dependendo do tamanho do arquivo...")

        # Processa o áudio
        separator.separate_to_file(audio_path, output_dir)

        # O Spleeter cria uma subpasta com o nome do arquivo
        # Precisamos encontrar essa pasta e reorganizar os arquivos
        audio_filename = os.path.splitext(os.path.basename(audio_path))[0]
        spleeter_output = os.path.join(output_dir, audio_filename)

        if os.path.exists(spleeter_output):
            # Move os arquivos para o diretório principal
            import shutil
            for file in os.listdir(spleeter_output):
                src = os.path.join(spleeter_output, file)
                dst = os.path.join(output_dir, file)
                shutil.move(src, dst)

            # Remove a pasta vazia
            os.rmdir(spleeter_output)

        # Gera waveforms para cada faixa
        print("\nGerando waveforms...")
        stems = ['vocals', 'drums', 'bass', 'other']
        colors = {
            'vocals': '#FF6B6B',    # Vermelho
            'drums': '#4ECDC4',     # Ciano
            'bass': '#FFD93D',      # Amarelo
            'other': '#6C5CE7'      # Roxo
        }

        for stem in stems:
            audio_file = os.path.join(output_dir, f'{stem}.wav')
            if os.path.exists(audio_file):
                waveform_image = os.path.join(output_dir, f'{stem}.png')
                generate_waveform(audio_file, waveform_image, colors[stem])

        # Caminho relativo para armazenar no banco
        processed_path = f'/processed/upload_{upload_id}'

        print("\nProcessamento concluído com sucesso!")
        print(f"Faixas e waveforms salvos em: {output_dir}")

        # Atualiza status para "completed"
        update_db_status(upload_id, 'completed', processed_path)

        return True

    except Exception as e:
        print(f"ERRO durante o processamento: {e}")
        import traceback
        traceback.print_exc()
        update_db_status(upload_id, 'error')
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python3 process_audio.py <caminho_audio> <upload_id>")
        sys.exit(1)

    audio_path = sys.argv[1]
    upload_id = sys.argv[2]

    if not os.path.exists(audio_path):
        print(f"ERRO: Arquivo não encontrado: {audio_path}")
        update_db_status(upload_id, 'error')
        sys.exit(1)

    success = process_audio(audio_path, upload_id)
    sys.exit(0 if success else 1)
