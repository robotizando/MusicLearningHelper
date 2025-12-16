# Sistema de Acordes Sincronizados - MusicLearningHelper

## Visão Geral

Sistema integrado para análise, detecção e exibição de acordes musicais sincronizados com o player de áudio TrackSwitch. Utiliza análise espectral com Librosa para extrair acordes dos stems separados pelo Spleeter.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DO SISTEMA                             │
└─────────────────────────────────────────────────────────────────────┘

1. UPLOAD & PROCESSAMENTO
   Usuario → Upload MP3 → Spleeter (4 stems) → chord_analyzer.py
                              │                         │
                              ├─ vocals.mp3            │
                              ├─ drums.mp3             │
                              ├─ bass.mp3              │
                              ├─ other.mp3             │
                              └─ *.png (waveforms)     │
                                                       ↓
                                              chords.json
                                                       │
                                                       ↓
                                         /processed/upload_{id}/

2. SERVIR DADOS
   Player Request → GET /api/chords/{uploadId} → chords.json
                                                       │
                                                       ↓
                                              {
                                                duration: 180.5,
                                                events: [
                                                  {time: 0.0, chord: "Am", confidence: 0.85},
                                                  {time: 2.3, chord: "G", confidence: 0.78}
                                                ]
                                              }

3. EXIBIÇÃO
   chords-display.js → Poll player.position → Atualiza display
                              │                       │
                              ↓                       ↓
                    Acorde Atual                Timeline
                    Anterior/Próximo            Marcadores
                    Confiança                   Progresso
```

## Componentes

### 1. Backend (Python)

#### chord_analyzer.py
Módulo principal para análise de acordes usando Librosa.

**Principais funcionalidades:**
- Análise espectral com Chromagram (CQT)
- Detecção de acordes por template matching
- Suporte para 10 tipos de acordes (maior, menor, 7ª, etc.)
- Análise de múltiplos stems com priorização

**Uso:**
```python
from chord_analyzer import ChordAnalyzer

# Análise de um arquivo
analyzer = ChordAnalyzer(hop_length=512, frame_size=2048)
chord_data = analyzer.analyze_audio_file('audio.mp3')

# Análise de stems (melhor resultado)
stems_paths = {
    'vocals': 'path/vocals.mp3',
    'other': 'path/other.mp3',
    'bass': 'path/bass.mp3'
}
chord_data = analyzer.analyze_stems(stems_paths)

# Salvar resultado
analyzer.save_to_json(chord_data, 'chords.json')
```

**Função auxiliar:**
```bash
# Análise standalone
python3 chord_analyzer.py /path/to/processed/upload_123/
```

#### process_audio.py (integração)
Modificado para executar análise de acordes após separação de stems.

**Novo fluxo:**
1. Spleeter separa stems → WAV
2. Gera waveforms → PNG
3. Converte para MP3
4. **NOVO:** Analisa acordes → `chords.json`
5. Atualiza status no banco

**Código adicionado (linhas 179-193):**
```python
# Análise de acordes
print("\nAnalisando acordes...")
try:
    from chord_analyzer import ChordAnalyzer
    analyzer = ChordAnalyzer(hop_length=512, frame_size=2048)
    chord_data = analyzer.analyze_stems(stems_paths)

    chords_file = os.path.join(output_dir, 'chords.json')
    analyzer.save_to_json(chord_data, chords_file)
    print(f"Acordes salvos em: {chords_file}")
except Exception as e:
    print(f"Aviso: Não foi possível analisar acordes: {e}")
    # Não falha o processamento se análise falhar
```

### 2. Backend (Node.js)

#### server.js - Endpoint de API
**Rota:** `GET /api/chords/:uploadId`

**Funcionalidades:**
- Autenticação obrigatória
- Verifica permissões (usuário ou admin)
- Serve arquivo `chords.json` do upload
- Retorna estrutura vazia se não existir

**Exemplo de uso:**
```javascript
// Request
GET /api/chords/123

// Response (success)
{
  "duration": 180.5,
  "events": [
    {"time": 0.0, "chord": "Am", "confidence": 0.85},
    {"time": 2.3, "chord": "G", "confidence": 0.78},
    ...
  ],
  "sample_rate": 22050,
  "hop_length": 512
}

// Response (sem acordes)
{
  "duration": 0,
  "events": [],
  "error": "Análise de acordes não disponível"
}
```

### 3. Frontend

#### chords-display.css
Estilos para o componente visual de acordes.

**Principais elementos:**
- `#chords-container`: Container principal com gradiente
- `.chord-card`: Cards para acordes (anterior, atual, próximo)
- `#chords-timeline`: Linha do tempo com marcadores
- `.chord-marker`: Marcadores clicáveis de acordes
- Estados: loading, collapsed, no-chords
- Responsivo (mobile-first)

**Variáveis de cor por tipo:**
- Major: Verde (#4CAF50)
- Minor: Azul (#2196F3)
- Seventh: Laranja (#FF9800)
- Diminished: Vermelho (#F44336)

#### chords-display.js
Plugin jQuery para sincronização e exibição de acordes.

**API do Plugin:**
```javascript
$('#container').chordsDisplay({
    uploadId: 123,                     // ID do upload
    apiEndpoint: '/api/chords',        // Endpoint da API
    updateInterval: 100,               // Intervalo de atualização (ms)
    autoCollapse: false,               // Colapsar ao iniciar
    showTimeline: true,                // Mostrar timeline
    showConfidence: true,              // Mostrar confiança
    onLoad: function(data) {},         // Callback ao carregar
    onChordChange: function(chord) {}, // Callback ao mudar acorde
    onError: function(error) {}        // Callback de erro
});
```

**Principais métodos:**
- `loadChords()`: Carrega dados via AJAX
- `connectToPlayer(player)`: Conecta ao TrackSwitch
- `updateCurrentTime()`: Sincroniza com player
- `seekToTime(time)`: Navega para tempo específico
- `toggleCollapse()`: Expande/colapsa display

**Integração com TrackSwitch:**
```javascript
// Obtém tempo atual do player
getCurrentPlayerTime() {
    // Prioriza: player.position > player.currentTime > audioContext
    return this.player.position || 0;
}
```

#### player-upload.html (template)
Template modificado para incluir componente de acordes.

**Adições:**
1. CSS: `<link rel="stylesheet" href="/css/chords-display.css" />`
2. JS: `<script src="/js/chords-display.js"></script>`
3. Container: `<div id="chords-display-container"></div>`
4. Inicialização: jQuery plugin + conexão ao player

**Código de inicialização:**
```javascript
// Inicializa display de acordes
$('#chords-display-container').chordsDisplay({
    uploadId: {{ID}},
    onLoad: function(data) {
        // Conecta ao player após carregar
        if (player && chordsDisplayInstance) {
            chordsDisplayInstance.connectToPlayer(player);
        }
    }
});

// Obtém referência à instância
chordsDisplayInstance = $('#chords-display-container')
    .data('chordsDisplayManager');
```

## Estrutura de Arquivos

```
MusicLearningHelper/
├── chord_analyzer.py              # Módulo de análise de acordes
├── process_audio.py               # Integração com Spleeter
├── server.js                      # Endpoint API
│
├── public/
│   ├── css/
│   │   └── chords-display.css    # Estilos do componente
│   └── js/
│       └── chords-display.js     # Plugin jQuery
│
├── templates/
│   └── player-upload.html        # Template modificado
│
└── processed/
    └── upload_{id}/
        ├── vocals.mp3
        ├── drums.mp3
        ├── bass.mp3
        ├── other.mp3
        ├── *.png                 # Waveforms
        └── chords.json           # ← NOVO: Dados de acordes
```

## Formato do chords.json

```json
{
  "duration": 180.5,
  "events": [
    {
      "time": 0.0,
      "chord": "Am",
      "confidence": 0.85
    },
    {
      "time": 2.3,
      "chord": "G",
      "confidence": 0.78
    },
    {
      "time": 5.1,
      "chord": "F",
      "confidence": 0.92
    }
  ],
  "sample_rate": 22050,
  "hop_length": 512,
  "primary_stem": "other"
}
```

**Campos:**
- `duration`: Duração total da música em segundos
- `events`: Array de eventos de acordes
  - `time`: Timestamp do acorde em segundos
  - `chord`: Nome do acorde (ex: "Am", "G7", "Cmaj7")
  - `confidence`: Confiança da detecção (0.0 a 1.0)
- `sample_rate`: Taxa de amostragem usada
- `hop_length`: Salto entre frames
- `primary_stem`: Stem usado para análise (other, bass, vocals, drums)

## Tipos de Acordes Detectados

O sistema detecta 10 tipos de acordes:

| Tipo | Notação | Intervalos | Exemplo |
|------|---------|------------|---------|
| Maior | - | 0, 4, 7 | C, G, Am |
| Menor | m | 0, 3, 7 | Cm, Dm |
| Diminuto | dim | 0, 3, 6 | Cdim |
| Aumentado | aug | 0, 4, 8 | Caug |
| Dominante 7ª | 7 | 0, 4, 7, 10 | C7, G7 |
| Maior 7ª | maj7 | 0, 4, 7, 11 | Cmaj7 |
| Menor 7ª | min7 | 0, 3, 7, 10 | Cm7 |
| Meio-dim. | m7b5 | 0, 3, 6, 10 | Cm7b5 |
| Suspenso 2ª | sus2 | 0, 2, 7 | Csus2 |
| Suspenso 4ª | sus4 | 0, 5, 7 | Csus4 |

## Algoritmo de Detecção

### 1. Extração do Chromagram
```python
chroma = librosa.feature.chroma_cqt(
    y=audio,
    sr=sample_rate,
    hop_length=512,
    n_chroma=12
)
```

### 2. Segmentação Temporal
- Divide em segmentos de ~2 segundos
- Calcula média do chromagram por segmento
- Normaliza valores (0 a 1)

### 3. Template Matching
Para cada segmento:
1. Identifica nota fundamental (maior intensidade)
2. Compara com templates de acordes rotacionados
3. Calcula correlação com cada template
4. Seleciona acorde com maior score

### 4. Filtragem
- Remove acordes com confiança < 30%
- Remove repetições consecutivas
- Gera timestamps finais

## Performance

### Tempos de Processamento

**Para uma música de 3 minutos:**
- Spleeter (separação): ~30-60s
- Geração de waveforms: ~5-10s
- Conversão MP3: ~5-10s
- **Análise de acordes: ~10-15s**
- **Total: ~50-95s**

### Otimizações

1. **Análise em background**: Não bloqueia processamento principal
2. **Cache de resultados**: `chords.json` persistido em disco
3. **Update interval ajustável**: 100ms por padrão (10 FPS)
4. **Análise priorizada**: Usa stem 'other' (harmonia) primeiro

## Troubleshooting

### Acordes não aparecem
1. Verifique se `chords.json` existe em `/processed/upload_{id}/`
2. Verifique console do navegador para erros AJAX
3. Verifique logs do servidor para erros no endpoint
4. Teste acesso direto: `GET /api/chords/{id}`

### Acordes desincronizados
1. Verifique se `player.position` está sendo atualizado
2. Ajuste `updateInterval` (diminuir para mais precisão)
3. Verifique console: deve mostrar "Acorde atual: ..." periodicamente

### Detecção imprecisa
1. Músicas com harmonia complexa podem ter menor precisão
2. Instrumentos muito distorcidos afetam detecção
3. Ajuste confiança mínima no código (atualmente 0.3)
4. Use stem 'other' ou 'bass' para melhor resultado

### Erro ao processar
```
Aviso: Não foi possível analisar acordes: ...
```
- Processamento continua normalmente (acordes são opcionais)
- Verifique se Librosa está instalado: `pip install librosa`
- Verifique logs completos em `process_audio.py`

## Melhorias Futuras

### Curto Prazo
- [ ] Suporte para inversões de acordes (C/E, G/B)
- [ ] Detecção de tonalidade da música
- [ ] Exportar acordes como PDF/TXT

### Médio Prazo
- [ ] Machine Learning para detecção (modelo treinado)
- [ ] Suporte para acordes estendidos (9ª, 11ª, 13ª)
- [ ] Editor manual de acordes
- [ ] Sincronização com letra da música

### Longo Prazo
- [ ] Análise de progressão harmônica
- [ ] Sugestões de simplificação (substituições)
- [ ] Transposição automática de tom
- [ ] Geração de tablatura para violão

## Dependências

### Python
```
librosa==0.10.0          # Análise de áudio
numpy>=1.21.0            # Operações numéricas
soundfile==0.12.1        # Leitura de áudio
```

### JavaScript
```
jQuery 3.2.1+            # Manipulação DOM
TrackSwitch.js           # Player multitrack
```

### CSS
```
Font Awesome 4.7         # Ícones
```

## Licença

Este sistema é parte do MusicLearningHelper e segue a mesma licença do projeto principal.

## Contribuindo

Para contribuir com melhorias no sistema de acordes:

1. **Algoritmo de detecção**: Modifique `chord_analyzer.py`
2. **Interface visual**: Edite `chords-display.css`
3. **Funcionalidades JS**: Atualize `chords-display.js`
4. **Integração**: Ajuste `process_audio.py` e `server.js`

## Suporte

Para dúvidas ou problemas:
1. Verifique este documento
2. Consulte logs do servidor e console do navegador
3. Teste com música simples (acordes claros)
4. Reporte issues com exemplos específicos
