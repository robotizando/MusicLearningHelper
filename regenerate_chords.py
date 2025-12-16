#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para regenerar acordes de um upload processado usando stem específico
"""

import sys
import os
from chord_analyzer import ChordAnalyzer


def regenerate_chords(processed_dir, stem='other'):
    """
    Regenera acordes usando stem específico

    Args:
        processed_dir: Diretório com stems processados
        stem: Stem a usar ('vocals', 'drums', 'bass', 'other', 'all')

    Returns:
        Caminho do arquivo JSON gerado ou None em caso de erro
    """
    print(f"Regenerando acordes do diretório: {processed_dir}")
    print(f"Usando stem: {stem}")

    # Constrói caminhos dos stems
    stems_paths = {}

    if stem == 'all':
        # Usa todos os stems disponíveis
        for stem_type in ['vocals', 'drums', 'bass', 'other']:
            stem_path = os.path.join(processed_dir, f'{stem_type}.mp3')
            if os.path.exists(stem_path):
                stems_paths[stem_type] = stem_path
                print(f"Encontrado: {stem_type}.mp3")
    else:
        # Usa apenas o stem especificado
        stem_path = os.path.join(processed_dir, f'{stem}.mp3')
        if os.path.exists(stem_path):
            stems_paths[stem] = stem_path
            print(f"Encontrado: {stem}.mp3")
        else:
            print(f"ERRO: Stem não encontrado: {stem_path}")
            return None

    if not stems_paths:
        print("ERRO: Nenhum stem encontrado")
        return None

    # Cria analyzer
    analyzer = ChordAnalyzer(hop_length=512, frame_size=2048)

    # Analisa
    if stem == 'all':
        print("Analisando todos os stems combinados...")
        chord_data = analyzer.analyze_stems(stems_paths)
    else:
        print(f"Analisando stem: {stem}...")
        chord_data = analyzer.analyze_audio_file(stems_paths[stem])
        chord_data['primary_stem'] = stem

    # Salva
    output_path = os.path.join(processed_dir, 'chords.json')
    if analyzer.save_to_json(chord_data, output_path):
        print(f"✓ Acordes salvos em: {output_path}")
        print(f"✓ Total de eventos: {len(chord_data.get('events', []))}")
        return output_path

    print("✗ Erro ao salvar acordes")
    return None


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python3 regenerate_chords.py <diretório_processado> [stem]")
        print("Stems válidos: vocals, drums, bass, other, all")
        print("Padrão: other")
        sys.exit(1)

    processed_dir = sys.argv[1]
    stem = sys.argv[2] if len(sys.argv) > 2 else 'other'

    # Valida stem
    valid_stems = ['vocals', 'drums', 'bass', 'other', 'all']
    if stem not in valid_stems:
        print(f"ERRO: Stem inválido: {stem}")
        print(f"Válidos: {', '.join(valid_stems)}")
        sys.exit(1)

    # Verifica se diretório existe
    if not os.path.exists(processed_dir):
        print(f"ERRO: Diretório não encontrado: {processed_dir}")
        sys.exit(1)

    # Regenera
    result = regenerate_chords(processed_dir, stem)

    if result:
        print("\n✓ Regeneração concluída com sucesso!")
        sys.exit(0)
    else:
        print("\n✗ Falha na regeneração")
        sys.exit(1)
