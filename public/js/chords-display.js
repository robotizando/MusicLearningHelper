/**
 * Chords Display Component - JavaScript
 * Sistema de exibição de acordes sincronizados com o TrackSwitch player
 *
 * Depende de: jQuery 3.2.1+
 */

(function($) {
    'use strict';

    /**
     * Plugin jQuery para exibição de acordes
     */
    $.fn.chordsDisplay = function(options) {
        const settings = $.extend({
            uploadId: null,              // ID do upload para buscar acordes
            apiEndpoint: '/api/chords',  // Endpoint da API
            updateInterval: 100,         // Intervalo de atualização em ms
            autoCollapse: false,         // Colapsar automaticamente
            showTimeline: true,          // Mostrar timeline de acordes
            showConfidence: true,        // Mostrar indicador de confiança
            onChordChange: null,         // Callback quando acorde muda
            onLoad: null,                // Callback quando acordes carregam
            onError: null                // Callback em caso de erro
        }, options);

        return this.each(function() {
            const $container = $(this);
            const chordDisplay = new ChordsDisplayManager($container, settings);
            chordDisplay.init();

            // Salva a instância no elemento para acesso posterior
            $container.data('chordsDisplayManager', chordDisplay);
        });
    };

    /**
     * Gerenciador do display de acordes
     */
    class ChordsDisplayManager {
        constructor($container, settings) {
            this.$container = $container;
            this.settings = settings;
            this.chordsData = null;
            this.currentChordIndex = -1;
            this.updateTimer = null;
            this.collapsed = settings.autoCollapse;
        }

        /**
         * Inicializa o componente
         */
        init() {
            this.buildHTML();
            this.loadChords();
            this.setupEventListeners();
        }

        /**
         * Constrói a estrutura HTML
         */
        buildHTML() {
            const html = `
                <div id="chords-container" class="loading">
                    <h3>Acordes</h3>
                    <div class="chords-controls">
                        <button id="chords-regenerate" title="Regenerar acordes">
                            <i class="fa fa-refresh"></i>
                        </button>
                        <button id="chords-toggle" title="Mostrar/Ocultar">
                            <i class="fa fa-chevron-up"></i>
                        </button>
                    </div>

                    <div id="chords-display">
                        <div class="chord-card previous">
                            <div class="chord-label">Anterior</div>
                            <div class="chord-name">-</div>
                            ${this.settings.showConfidence ? '<div class="chord-confidence">-</div>' : ''}
                        </div>

                        <div class="chord-card current">
                            <div class="chord-label">Atual</div>
                            <div class="chord-name">-</div>
                            ${this.settings.showConfidence ? `
                                <div class="chord-confidence">
                                    <div class="chord-confidence-bar">
                                        <div class="chord-confidence-fill" style="width: 0%"></div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <div class="chord-card next">
                            <div class="chord-label">Próximo</div>
                            <div class="chord-name">-</div>
                            ${this.settings.showConfidence ? '<div class="chord-confidence">-</div>' : ''}
                        </div>
                    </div>

                    ${this.settings.showTimeline ? `
                        <div id="chords-timeline">
                            <div id="chords-timeline-progress"></div>
                        </div>
                    ` : ''}
                </div>

                <!-- Modal de Regeneração -->
                <div id="chords-regenerate-modal">
                    <div class="chords-modal-content">
                        <h3><i class="fa fa-refresh"></i> Regenerar Acordes</h3>
                        <p>Escolha qual stem usar para analisar os acordes:</p>

                        <div class="regenerate-status">
                            <span class="spinner"></span>
                            <span class="status-text">Processando...</span>
                        </div>

                        <div class="stem-selector">
                            <div class="stem-option selected" data-stem="other">
                                <input type="radio" name="stem" id="stem-other" value="other" checked>
                                <label for="stem-other">
                                    Outros
                                    <div class="stem-option-desc">Harmonia (Recomendado)</div>
                                </label>
                            </div>
                            <div class="stem-option" data-stem="bass">
                                <input type="radio" name="stem" id="stem-bass" value="bass">
                                <label for="stem-bass">
                                    Baixo
                                    <div class="stem-option-desc">Linha de baixo</div>
                                </label>
                            </div>
                            <div class="stem-option" data-stem="vocals">
                                <input type="radio" name="stem" id="stem-vocals" value="vocals">
                                <label for="stem-vocals">
                                    Vocais
                                    <div class="stem-option-desc">Voz principal</div>
                                </label>
                            </div>
                            <div class="stem-option" data-stem="all">
                                <input type="radio" name="stem" id="stem-all" value="all">
                                <label for="stem-all">
                                    Todos
                                    <div class="stem-option-desc">Mix combinado</div>
                                </label>
                            </div>
                        </div>

                        <div class="modal-buttons">
                            <button class="btn-cancel">Cancelar</button>
                            <button class="btn-regenerate">Regenerar</button>
                        </div>
                    </div>
                </div>
            `;

            this.$container.html(html);
            this.$chordsContainer = this.$container.find('#chords-container');
            this.$timeline = this.$container.find('#chords-timeline');
            this.$timelineProgress = this.$container.find('#chords-timeline-progress');
            this.$modal = this.$container.find('#chords-regenerate-modal');
        }

        /**
         * Carrega os dados de acordes da API
         */
        loadChords() {
            if (!this.settings.uploadId) {
                this.handleError('ID do upload não fornecido');
                return;
            }

            const url = `${this.settings.apiEndpoint}/${this.settings.uploadId}`;

            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                success: (data) => this.handleChordsLoaded(data),
                error: (xhr, status, error) => this.handleError(error)
            });
        }

        /**
         * Processa os dados de acordes carregados
         */
        handleChordsLoaded(data) {
            this.$chordsContainer.removeClass('loading');

            if (data.error || !data.events || data.events.length === 0) {
                this.$chordsContainer.addClass('no-chords');
                this.updateChordDisplay({
                    previous: null,
                    current: { chord: 'Sem dados', confidence: 0 },
                    next: null
                });

                if (this.settings.onError) {
                    this.settings.onError(data.error || 'Nenhum acorde detectado');
                }
                return;
            }

            this.chordsData = data;
            this.buildTimeline();
            this.updateChordDisplay({
                previous: null,
                current: data.events[0],
                next: data.events.length > 1 ? data.events[1] : null
            });

            if (this.settings.onLoad) {
                this.settings.onLoad(data);
            }

            console.log(`Acordes carregados: ${data.events.length} eventos`);
        }

        /**
         * Constrói a timeline de acordes
         */
        buildTimeline() {
            if (!this.settings.showTimeline || !this.chordsData) return;

            this.$timeline.empty();
            this.$timeline.append('<div id="chords-timeline-progress"></div>');
            this.$timelineProgress = this.$timeline.find('#chords-timeline-progress');

            const duration = this.chordsData.duration || 180;
            const events = this.chordsData.events;

            events.forEach((event, index) => {
                const positionPercent = (event.time / duration) * 100;

                const $marker = $(`
                    <div class="chord-marker" data-index="${index}" data-time="${event.time}" style="left: ${positionPercent}%">
                        <div class="chord-marker-label">${event.chord}</div>
                        <div class="chord-marker-time">${this.formatTime(event.time)}</div>
                    </div>
                `);

                this.$timeline.append($marker);
            });
        }

        /**
         * Configura event listeners
         */
        setupEventListeners() {
            // Toggle collapse
            this.$container.on('click', '#chords-toggle', () => {
                this.toggleCollapse();
            });

            // Botão regenerar
            this.$container.on('click', '#chords-regenerate', () => {
                this.showRegenerateModal();
            });

            // Seleção de stem no modal
            this.$container.on('click', '.stem-option', (e) => {
                const $option = $(e.currentTarget);
                this.$container.find('.stem-option').removeClass('selected');
                $option.addClass('selected');
                $option.find('input[type="radio"]').prop('checked', true);
            });

            // Botão cancelar modal
            this.$container.on('click', '.btn-cancel', () => {
                this.hideRegenerateModal();
            });

            // Fechar modal ao clicar fora
            this.$modal.on('click', (e) => {
                if ($(e.target).is('#chords-regenerate-modal')) {
                    this.hideRegenerateModal();
                }
            });

            // Botão regenerar do modal
            this.$container.on('click', '.btn-regenerate', () => {
                const selectedStem = this.$container.find('input[name="stem"]:checked').val();
                this.regenerateChords(selectedStem);
            });

            // Click na timeline para navegar
            this.$container.on('click', '.chord-marker', (e) => {
                const time = parseFloat($(e.currentTarget).data('time'));
                this.seekToTime(time);
            });

            // Click na área da timeline (fora dos marcadores)
            this.$timeline.on('click', (e) => {
                if ($(e.target).hasClass('chord-marker') || $(e.target).parent().hasClass('chord-marker')) {
                    return;
                }

                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = clickX / rect.width;
                const time = percent * (this.chordsData?.duration || 180);
                this.seekToTime(time);
            });
        }

        /**
         * Conecta ao player TrackSwitch
         */
        connectToPlayer(player) {
            if (!player) {
                console.warn('Player TrackSwitch não encontrado');
                return;
            }

            this.player = player;
            console.log('Player conectado:', player);
            console.log('Player.position:', player.position);
            console.log('Player.longestDuration:', player.longestDuration);
            console.log('Player.playing:', player.playing);

            // Inicia monitoramento de tempo
            this.startTimeUpdate();
        }

        /**
         * Inicia atualização periódica da posição
         */
        startTimeUpdate() {
            if (this.updateTimer) {
                clearInterval(this.updateTimer);
            }

            this.updateTimer = setInterval(() => {
                this.updateCurrentTime();
            }, this.settings.updateInterval);
        }

        /**
         * Para atualização periódica
         */
        stopTimeUpdate() {
            if (this.updateTimer) {
                clearInterval(this.updateTimer);
                this.updateTimer = null;
            }
        }

        /**
         * Atualiza posição atual baseado no player
         */
        updateCurrentTime() {
            if (!this.player) {
                if (!this._warnedNoPlayer) {
                    console.warn('updateCurrentTime: player não conectado');
                    this._warnedNoPlayer = true;
                }
                return;
            }

            if (!this.chordsData) {
                if (!this._warnedNoData) {
                    console.warn('updateCurrentTime: chordsData não carregado');
                    this._warnedNoData = true;
                }
                return;
            }

            // Obtém tempo atual do player (TrackSwitch expõe isso como propriedade)
            const currentTime = this.getCurrentPlayerTime();

            if (currentTime === null || currentTime === undefined) {
                if (!this._warnedNoTime) {
                    console.warn('updateCurrentTime: currentTime é null/undefined');
                    this._warnedNoTime = true;
                }
                return;
            }

            // Atualiza timeline progress
            const duration = this.chordsData.duration || 180;
            const progressPercent = Math.min(100, (currentTime / duration) * 100);
            this.$timelineProgress.css('width', `${progressPercent}%`);

            // Encontra acorde atual
            const chordIndex = this.findChordAtTime(currentTime);

            // Debug: mostra tempo atual (descomente para debug)
            if (typeof this._debugCounter === 'undefined') this._debugCounter = 0;
            if (++this._debugCounter % 10 === 0) { // Log a cada 1 segundo (10 * 100ms)
                console.log('Tempo atual:', currentTime.toFixed(2), 's', '| Acorde index:', chordIndex);
            }

            if (chordIndex !== this.currentChordIndex) {
                this.currentChordIndex = chordIndex;
                this.updateChordForIndex(chordIndex);
            }
        }

        /**
         * Obtém tempo atual do player TrackSwitch
         */
        getCurrentPlayerTime() {
            if (!this.player) return null;

            // TrackSwitch armazena a posição atual em this.position
            // Este valor é atualizado a cada 16ms pelo monitorPosition()

            // Método 1: Propriedade position (usado internamente pelo TrackSwitch)
            // Esta é a propriedade correta que é atualizada continuamente
            if (typeof this.player.position !== 'undefined' && this.player.position !== null) {
                return this.player.position;
            }

            // Método 2: Calcular baseado em audioContext (quando tocando)
            if (this.player.playing && this.player.audioContext && typeof this.player.startTime !== 'undefined') {
                const elapsed = this.player.audioContext.currentTime - this.player.startTime;
                return Math.max(0, elapsed);
            }

            // Método 3: Propriedade direta currentTime (se existir)
            if (typeof this.player.currentTime !== 'undefined') {
                return this.player.currentTime;
            }

            // Método 4: Fallback - parse do elemento de timing do DOM
            const $timing = $('.ts-timing .time');
            if ($timing.length) {
                const timeText = $timing.text(); // Formato: "00:00.000"
                const parts = timeText.split(':');
                if (parts.length === 2) {
                    const minutes = parseInt(parts[0]) || 0;
                    const seconds = parseFloat(parts[1]) || 0;
                    return minutes * 60 + seconds;
                }
            }

            return 0;
        }

        /**
         * Encontra índice do acorde no tempo especificado
         */
        findChordAtTime(time) {
            if (!this.chordsData || !this.chordsData.events.length) return -1;

            const events = this.chordsData.events;

            for (let i = events.length - 1; i >= 0; i--) {
                if (time >= events[i].time) {
                    return i;
                }
            }

            return 0;
        }

        /**
         * Atualiza display para o índice de acorde especificado
         */
        updateChordForIndex(index) {
            if (!this.chordsData || index < 0) return;

            const events = this.chordsData.events;
            const previous = index > 0 ? events[index - 1] : null;
            const current = events[index];
            const next = index < events.length - 1 ? events[index + 1] : null;

            this.updateChordDisplay({ previous, current, next });

            // Marca acorde ativo na timeline
            this.$timeline.find('.chord-marker').removeClass('active');
            this.$timeline.find(`.chord-marker[data-index="${index}"]`).addClass('active');

            // Callback
            if (this.settings.onChordChange && current) {
                this.settings.onChordChange(current);
            }
        }

        /**
         * Atualiza o display visual dos acordes
         */
        updateChordDisplay(chords) {
            // Acorde anterior
            const $previous = this.$container.find('.chord-card.previous');
            if (chords.previous) {
                $previous.find('.chord-name').text(chords.previous.chord);
                if (this.settings.showConfidence) {
                    $previous.find('.chord-confidence').text(`${(chords.previous.confidence * 100).toFixed(0)}%`);
                }
            } else {
                $previous.find('.chord-name').text('-');
            }

            // Acorde atual
            const $current = this.$container.find('.chord-card.current');
            if (chords.current) {
                $current.find('.chord-name').text(chords.current.chord);

                if (this.settings.showConfidence && chords.current.confidence) {
                    const confidencePercent = (chords.current.confidence * 100).toFixed(0);
                    $current.find('.chord-confidence-fill').css('width', `${confidencePercent}%`);
                }

                // Define tipo de acorde para estilo
                const chordType = this.detectChordType(chords.current.chord);
                $current.attr('data-chord-type', chordType);
            } else {
                $current.find('.chord-name').text('-');
            }

            // Próximo acorde
            const $next = this.$container.find('.chord-card.next');
            if (chords.next) {
                $next.find('.chord-name').text(chords.next.chord);
                if (this.settings.showConfidence) {
                    $next.find('.chord-confidence').text(`${(chords.next.confidence * 100).toFixed(0)}%`);
                }
            } else {
                $next.find('.chord-name').text('-');
            }
        }

        /**
         * Detecta tipo de acorde para estilização
         */
        detectChordType(chordName) {
            if (!chordName || chordName === '-') return 'unknown';

            if (chordName.includes('m') && !chordName.includes('maj')) return 'minor';
            if (chordName.includes('7') || chordName.includes('9')) return 'seventh';
            if (chordName.includes('dim')) return 'diminished';

            return 'major';
        }

        /**
         * Navega para tempo específico no player
         */
        seekToTime(time) {
            if (!this.player) {
                console.warn('Player não conectado');
                return;
            }

            // TrackSwitch pode ter método seek ou precisar manipular o audioContext
            if (typeof this.player.seek === 'function') {
                this.player.seek(time);
            } else if (this.player.audioContext) {
                // Implementação customizada de seek se necessário
                console.log(`Seek para: ${time}s`);
            }
        }

        /**
         * Toggle collapse/expand
         */
        toggleCollapse() {
            this.collapsed = !this.collapsed;

            if (this.collapsed) {
                this.$chordsContainer.addClass('collapsed');
                this.$container.find('#chords-toggle i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
                this.stopTimeUpdate();
            } else {
                this.$chordsContainer.removeClass('collapsed');
                this.$container.find('#chords-toggle i').removeClass('fa-chevron-down').addClass('fa-chevron-up');
                this.startTimeUpdate();
            }
        }

        /**
         * Mostra o modal de regeneração
         */
        showRegenerateModal() {
            this.$modal.addClass('active');
            // Reseta seleção para "other" (recomendado)
            this.$container.find('.stem-option').removeClass('selected');
            this.$container.find('.stem-option[data-stem="other"]').addClass('selected');
            this.$container.find('#stem-other').prop('checked', true);
        }

        /**
         * Oculta o modal de regeneração
         */
        hideRegenerateModal() {
            this.$modal.removeClass('active');
            this.$container.find('.regenerate-status').removeClass('active loading');
        }

        /**
         * Regenera acordes usando stem específico
         */
        regenerateChords(stem) {
            console.log('Regenerando acordes com stem:', stem);

            // Mostra status de loading
            const $status = this.$container.find('.regenerate-status');
            $status.addClass('active loading');
            $status.find('.status-text').text('Analisando acordes...');

            // Desabilita botão
            const $btnRegenerate = this.$container.find('.btn-regenerate');
            $btnRegenerate.prop('disabled', true);

            // Chama API para regenerar
            $.ajax({
                url: `/api/chords/${this.settings.uploadId}/regenerate`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ stem: stem }),
                success: (data) => {
                    console.log('Acordes regenerados com sucesso!');
                    $status.find('.status-text').text('Acordes atualizados!');
                    $status.removeClass('loading');

                    // Atualiza dados locais
                    this.chordsData = data;
                    this.currentChordIndex = -1;

                    // Reconstrói timeline
                    this.buildTimeline();

                    // Atualiza display
                    this.updateChordDisplay({
                        previous: null,
                        current: data.events[0] || { chord: 'Sem dados', confidence: 0 },
                        next: data.events.length > 1 ? data.events[1] : null
                    });

                    // Fecha modal após 1 segundo
                    setTimeout(() => {
                        this.hideRegenerateModal();
                        $btnRegenerate.prop('disabled', false);
                    }, 1000);
                },
                error: (xhr, status, error) => {
                    console.error('Erro ao regenerar acordes:', error);
                    $status.find('.status-text').text('Erro ao regenerar. Tente novamente.');
                    $status.removeClass('loading');
                    $btnRegenerate.prop('disabled', false);
                }
            });
        }

        /**
         * Formata tempo em mm:ss
         */
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        /**
         * Trata erros
         */
        handleError(error) {
            console.error('Erro ao carregar acordes:', error);
            this.$chordsContainer.removeClass('loading').addClass('no-chords');

            if (this.settings.onError) {
                this.settings.onError(error);
            }
        }

        /**
         * Destrói o componente
         */
        destroy() {
            this.stopTimeUpdate();
            this.$container.empty();
        }
    }

    // Expõe classe globalmente para uso direto
    window.ChordsDisplayManager = ChordsDisplayManager;

})(jQuery);
