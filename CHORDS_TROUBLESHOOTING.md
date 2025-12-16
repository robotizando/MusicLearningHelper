# Troubleshooting - Sistema de Acordes

## Problema: Acordes não sincronizam com a música

### Diagnóstico via Console do Navegador

Abra o console (F12) e procure por estas mensagens:

#### 1. Verificar se os acordes foram carregados
```
✓ Esperado: "Acordes carregados: X eventos"
✗ Se não aparecer: Problema no carregamento dos dados
```

**Solução se não carregar:**
- Verifique se o arquivo `chords.json` existe em `/processed/upload_{id}/`
- Teste acesso direto: `http://localhost:3000/api/chords/{id}`
- Verifique logs do servidor para erros

#### 2. Verificar conexão com o player
```
✓ Esperado: "✓ Display de acordes conectado ao player com sucesso!"
✗ Se aparecer: "Falha ao conectar acordes ao player após 20 tentativas"
```

**Solução se não conectar:**
- Recarregue a página (F5)
- Verifique se o TrackSwitch inicializou corretamente
- Procure erros JavaScript no console

#### 3. Verificar informações do player conectado
```
✓ Esperado:
  "Player conectado: Object { ... }"
  "Player.position: 0"
  "Player.longestDuration: 180.5"
  "Player.playing: false"
```

**Solução se valores estranhos:**
- Se `position` é undefined: Player não inicializou ainda
- Se `longestDuration` é 0: Áudio não carregou
- Aguarde alguns segundos e recarregue

#### 4. Verificar atualização de tempo
```
✓ Esperado (quando música toca):
  "Tempo atual: 1.23 s | Acorde index: 0"
  "Tempo atual: 2.45 s | Acorde index: 1"
  ... (a cada 1 segundo)
```

**Solução se não atualizar:**
- Clique em Play no player
- Se não aparecer nada: `player.position` não está sendo lido
- Verifique se há warnings no console

#### 5. Verificar mudança de acordes
```
✓ Esperado:
  "♫ Acorde atual: Am (85%)"
  "♫ Acorde atual: G (78%)"
```

**Solução se não aparecer:**
- Verifique se há eventos em `chords.json`
- Teste com música simples (acordes bem definidos)

## Comandos Úteis de Debug

Abra o console e digite:

### Ver dados de acordes carregados
```javascript
chordsDisplayInstance = $('#chords-display-container').data('chordsDisplayManager');
console.log(chordsDisplayInstance.chordsData);
```

### Ver posição atual do player
```javascript
player = $('.player').data('plugin_trackSwitch');
console.log('Position:', player.position);
console.log('Playing:', player.playing);
console.log('Duration:', player.longestDuration);
```

### Forçar atualização manual
```javascript
chordsDisplayInstance.updateCurrentTime();
```

### Ver acorde no tempo específico
```javascript
time = 10.5; // 10.5 segundos
index = chordsDisplayInstance.findChordAtTime(time);
console.log('Acorde em', time, 's:', chordsDisplayInstance.chordsData.events[index]);
```

## Problemas Comuns

### 1. "Acordes carregados: 0 eventos"

**Causa:** Música não tem harmonia clara ou análise falhou

**Soluções:**
- Teste com música diferente (pop/rock com acordes claros)
- Verifique se stems foram separados corretamente
- Reprocesse o upload: Delete e faça upload novamente

### 2. Acordes aparecem, mas não mudam

**Causa:** Player não está atualizando `position`

**Soluções:**
1. Verifique no console se aparece "Tempo atual: X.XX s"
2. Se não aparecer, o player não está conectado
3. Tente recarregar a página
4. Verifique se música está tocando (botão Play)

### 3. Acordes mudam muito rápido/lento

**Causa:** Dessincronia entre tempos

**Soluções:**
- Verifique se `player.position` aumenta normalmente
- Compare tempo no display do player com tempo no console
- Se diferente: bug no TrackSwitch, recarregue página

### 4. Timeline não atualiza

**Causa:** Barra de progresso não está sincronizando

**Soluções:**
- Verifique CSS: elemento `#chords-timeline-progress` deve existir
- Console: `$('#chords-timeline-progress').css('width')` deve mudar
- Se não muda: problema no `updateCurrentTime()`

### 5. Click na timeline não funciona

**Causa:** Event listener não foi registrado

**Soluções:**
- Verifique se elementos `.chord-marker` existem no DOM
- Console: `$('.chord-marker').length` deve ser > 0
- Se 0: acordes não foram renderizados na timeline

## Logs Detalhados

Para ativar logs mais detalhados, edite [chords-display.js](public/js/chords-display.js):

### Linha 296-298 - Log de tempo contínuo
```javascript
// ANTES (log a cada 1s)
if (++this._debugCounter % 10 === 0) {
    console.log('Tempo atual:', currentTime.toFixed(2), 's', '| Acorde index:', chordIndex);
}

// DEPOIS (log sempre)
console.log('Tempo atual:', currentTime.toFixed(2), 's', '| Acorde index:', chordIndex);
```

### Linha 298 - Log do getCurrentPlayerTime
```javascript
// ADICIONE no início do método
console.log('player.position:', this.player.position);
console.log('player.playing:', this.player.playing);
console.log('player.startTime:', this.player.startTime);
```

## Validação Passo a Passo

Execute este checklist em ordem:

### ✓ 1. Arquivo chords.json existe?
```bash
ls -la /home/phantor/Trabalhos-git/MusicLearningHelper/processed/upload_{ID}/chords.json
```

### ✓ 2. Arquivo é válido JSON?
```bash
cat processed/upload_{ID}/chords.json | python3 -m json.tool
```

### ✓ 3. Endpoint da API funciona?
```bash
# Abra no navegador (logado):
http://localhost:3000/api/chords/{ID}
```

### ✓ 4. JavaScript carregou sem erros?
- Abra console (F12) → Tab "Console"
- Não deve ter erros em vermelho
- Deve aparecer mensagens de inicialização

### ✓ 5. Player TrackSwitch funciona?
- Clique em Play
- Música deve tocar
- Tempo deve avançar no display

### ✓ 6. Componente de acordes aparece?
- Deve ver caixa roxa/gradient com "Acordes"
- Deve ter 3 cards: Anterior | Atual | Próximo
- Deve ter timeline embaixo

### ✓ 7. Sincronização funciona?
- Clique Play
- Aguarde 2-3 segundos
- Acorde deve mudar no display
- Barra de progresso deve mover

## Teste de Integração Manual

1. **Recarregue a página** (Ctrl+Shift+R)
2. **Abra o console** (F12)
3. **Aguarde carregamento** (5-10s)
4. **Verifique mensagens**:
   - "Inicializando componente de acordes..."
   - "Acordes carregados: X eventos"
   - "✓ Display de acordes conectado ao player com sucesso!"
5. **Clique Play** no player
6. **Observe console**: Deve aparecer "Tempo atual: X.XX s"
7. **Observe display**: Acorde deve mudar após alguns segundos

Se TODOS os passos funcionarem → Sistema OK! 🎉
Se algum falhar → Use as soluções acima

## Casos Extremos

### Música muito curta (< 30s)
- Poucos acordes detectados (normal)
- Timeline pode ficar vazia
- Solução: Use músicas > 1 minuto

### Música instrumental sem harmonia
- Detecção imprecisa
- Baixa confiança (< 50%)
- Solução: Normal, sistema faz "best guess"

### Música muito distorcida (heavy metal, etc)
- Acordes podem estar errados
- Sistema prioriza stem "other" (harmonia)
- Solução: Edição manual futura

### Player pausado/parado
- Acordes param de atualizar (correto)
- Mostram acorde da posição atual
- Solução: Normal, comportamento esperado

## Suporte

Se nenhuma solução funcionou:

1. **Colete informações:**
   - Print do console (F12)
   - ID do upload problemático
   - Mensagens de erro completas

2. **Verifique:**
   - Versão do navegador (Chrome/Firefox recomendados)
   - Se outros uploads funcionam
   - Se erro é específico de uma música

3. **Documente:**
   - Passos para reproduzir
   - Comportamento esperado vs. real
   - Logs relevantes

4. **Teste básico:**
   - Faça upload de música simples
   - Aguarde processamento
   - Teste no player
   - Documente resultado
