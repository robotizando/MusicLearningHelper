#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chord Analyzer Module - Extrai acordes e notas de arquivos de áudio usando Librosa
Integrado ao MusicLearningHelper para sincronização com TrackSwitch player
"""

import librosa
import numpy as np
import json
from typing import Dict, List, Tuple, Optional


class ChordAnalyzer:
    """
    Analisa arquivos de áudio para extrair acordes com timestamps
    usando técnicas de análise espectral e detecção de pitch
    """

    # Mapeamento de índices de notas para nomes
    NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    # Templates de acordes baseados em intervalos (semitons)
    CHORD_TEMPLATES = {
        'major': [0, 4, 7],           # Tríade maior
        'minor': [0, 3, 7],           # Tríade menor
        'dim': [0, 3, 6],             # Diminuto
        'aug': [0, 4, 8],             # Aumentado
        '7': [0, 4, 7, 10],           # Dominante (7ª menor)
        'maj7': [0, 4, 7, 11],        # 7ª maior
        'min7': [0, 3, 7, 10],        # Menor 7ª
        'm7b5': [0, 3, 6, 10],        # Meio-diminuto
        'sus2': [0, 2, 7],            # Suspenso 2ª
        'sus4': [0, 5, 7],            # Suspenso 4ª
    }

    def __init__(self, hop_length: int = 512, frame_size: int = 2048):
        """
        Inicializa o analisador de acordes

        Args:
            hop_length: Tamanho do salto entre frames (afeta resolução temporal)
            frame_size: Tamanho da janela de análise
        """
        self.hop_length = hop_length
        self.frame_size = frame_size

    def analyze_audio_file(self, audio_path: str, sr: int = 22050) -> Dict:
        """
        Analisa um arquivo de áudio e extrai acordes com timestamps

        Args:
            audio_path: Caminho para o arquivo de áudio
            sr: Taxa de amostragem (sample rate)

        Returns:
            Dicionário com duração e lista de eventos de acordes
        """
        try:
            # Carrega o arquivo de áudio
            y, sr = librosa.load(audio_path, sr=sr)

            # Calcula a duração total
            duration = librosa.get_duration(y=y, sr=sr)

            # Extrai acordes
            events = self._extract_chords(y, sr)

            return {
                'duration': float(duration),
                'events': events,
                'sample_rate': sr,
                'hop_length': self.hop_length
            }

        except Exception as e:
            print(f"Erro ao analisar áudio: {str(e)}")
            return {
                'duration': 0.0,
                'events': [],
                'error': str(e)
            }

    def _extract_chords(self, y: np.ndarray, sr: int) -> List[Dict]:
        """
        Extrai acordes do sinal de áudio

        Args:
            y: Sinal de áudio
            sr: Taxa de amostragem

        Returns:
            Lista de eventos de acordes com timestamps
        """
        # Calcula o chromagram (representação das 12 notas cromáticas)
        chroma = librosa.feature.chroma_cqt(
            y=y,
            sr=sr,
            hop_length=self.hop_length,
            n_chroma=12
        )

        # Calcula o tempo de cada frame
        times = librosa.frames_to_time(
            np.arange(chroma.shape[1]),
            sr=sr,
            hop_length=self.hop_length
        )

        # Agrupa frames em segmentos (~2 segundos)
        frames_per_segment = int(2.0 * sr / self.hop_length)

        events = []
        current_chord = None
        segment_start_time = 0.0

        for i in range(0, chroma.shape[1], frames_per_segment):
            # Pega o segmento atual
            end_idx = min(i + frames_per_segment, chroma.shape[1])
            segment_chroma = chroma[:, i:end_idx]

            # Média do chromagram no segmento
            avg_chroma = np.mean(segment_chroma, axis=1)

            # Normaliza
            if np.max(avg_chroma) > 0:
                avg_chroma = avg_chroma / np.max(avg_chroma)

            # Detecta acorde e confiança
            chord, confidence = self._detect_chord(avg_chroma)

            # Só adiciona se mudou de acorde ou é o primeiro
            if chord != current_chord and confidence > 0.3:
                events.append({
                    'time': float(times[i]),
                    'chord': chord,
                    'confidence': float(confidence)
                })
                current_chord = chord
                segment_start_time = times[i]

        return events

    def _detect_chord(self, chroma: np.ndarray) -> Tuple[str, float]:
        """
        Detecta o acorde mais provável a partir de um chromagram

        Args:
            chroma: Vetor de 12 dimensões com intensidade de cada nota

        Returns:
            Tupla (nome_do_acorde, confiança)
        """
        # Encontra a nota fundamental (nota mais forte)
        root_idx = np.argmax(chroma)
        root_note = self.NOTE_NAMES[root_idx]

        best_match = 'major'
        best_score = 0.0

        # Testa cada template de acorde
        for chord_type, intervals in self.CHORD_TEMPLATES.items():
            # Cria o template rotacionado para a nota fundamental
            template = np.zeros(12)
            for interval in intervals:
                template[(root_idx + interval) % 12] = 1.0

            # Calcula similaridade (correlação)
            score = np.corrcoef(chroma, template)[0, 1]

            if score > best_score:
                best_score = score
                best_match = chord_type

        # Constrói nome do acorde
        if best_match == 'major':
            chord_name = root_note
        elif best_match == 'minor':
            chord_name = f"{root_note}m"
        else:
            chord_name = f"{root_note}{best_match}"

        # Confiança baseada no score (normalizado)
        confidence = min(1.0, max(0.0, (best_score + 1) / 2))

        return chord_name, confidence

    def analyze_stems(self, stems_paths: Dict[str, str], sr: int = 22050) -> Dict:
        """
        Analisa múltiplos stems e combina os resultados
        Útil para análise mais precisa usando stems separados do Spleeter

        Args:
            stems_paths: Dicionário com tipo de stem e caminho do arquivo
                        Ex: {'vocals': 'path/vocals.mp3', 'other': 'path/other.mp3'}
            sr: Taxa de amostragem

        Returns:
            Dicionário com acordes combinados
        """
        # Prioriza o stem 'other' (harmonia) para detecção de acordes
        priority_order = ['other', 'bass', 'vocals', 'drums']

        for stem_type in priority_order:
            if stem_type in stems_paths:
                result = self.analyze_audio_file(stems_paths[stem_type], sr)
                if result.get('events'):
                    result['primary_stem'] = stem_type
                    return result

        # Fallback: analisa o primeiro stem disponível
        if stems_paths:
            first_stem = list(stems_paths.keys())[0]
            result = self.analyze_audio_file(stems_paths[first_stem], sr)
            result['primary_stem'] = first_stem
            return result

        return {
            'duration': 0.0,
            'events': [],
            'error': 'Nenhum stem disponível'
        }

    def save_to_json(self, chord_data: Dict, output_path: str) -> bool:
        """
        Salva os dados de acordes em arquivo JSON

        Args:
            chord_data: Dados de acordes retornados por analyze_audio_file
            output_path: Caminho do arquivo JSON de saída

        Returns:
            True se salvou com sucesso, False caso contrário
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(chord_data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Erro ao salvar JSON: {str(e)}")
            return False


def analyze_upload_stems(processed_dir: str, output_filename: str = 'chords.json') -> Optional[str]:
    """
    Função auxiliar para analisar stems de um upload processado

    Args:
        processed_dir: Diretório com os stems processados (ex: /processed/upload_123/)
        output_filename: Nome do arquivo JSON de saída

    Returns:
        Caminho completo do arquivo JSON gerado ou None em caso de erro
    """
    import os

    # Constrói caminhos dos stems
    stems_paths = {}
    for stem_type in ['vocals', 'drums', 'bass', 'other']:
        stem_path = os.path.join(processed_dir, f'{stem_type}.mp3')
        if os.path.exists(stem_path):
            stems_paths[stem_type] = stem_path

    if not stems_paths:
        print(f"Nenhum stem encontrado em {processed_dir}")
        return None

    # Analisa os stems
    analyzer = ChordAnalyzer(hop_length=512, frame_size=2048)
    chord_data = analyzer.analyze_stems(stems_paths)

    # Salva o resultado
    output_path = os.path.join(processed_dir, output_filename)
    if analyzer.save_to_json(chord_data, output_path):
        print(f"Acordes salvos em: {output_path}")
        return output_path

    return None


if __name__ == '__main__':
    """
    Permite execução standalone para testes:
    python3 chord_analyzer.py /path/to/processed/upload_123/
    """
    import sys

    if len(sys.argv) < 2:
        print("Uso: python3 chord_analyzer.py <diretório_processado>")
        print("Exemplo: python3 chord_analyzer.py ./processed/upload_123/")
        sys.exit(1)

    processed_dir = sys.argv[1]
    result = analyze_upload_stems(processed_dir)

    if result:
        print(f"\n✓ Análise concluída com sucesso!")
        print(f"Arquivo gerado: {result}")
    else:
        print("\n✗ Falha na análise")
        sys.exit(1)
