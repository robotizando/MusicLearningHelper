const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const util = require('util');
const multer = require('multer');
const { exec } = require('child_process');
const { dbOperations } = require('./database');


const app = express();
const PORT = process.env.PORT || 3000;  // Lightsail define PORT automaticamente, localmente fica 3000

// Middleware para parsing de body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração do multer para upload de áudio
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        // Garante que a pasta existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Gera nome único: timestamp + nome original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Aceita apenas arquivos de áudio
        const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav', 'audio/mp4'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de áudio são permitidos!'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // Limite de 50MB
    }
});

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    logger.info('Recebida requisição para /home.html');
    const templatePath = path.join(__dirname, 'templates', 'home.html');
    const termosPath = path.join(__dirname, 'templates', 'termos-uso.html');


    fs.readFile(termosPath, 'utf8', (err, termosHTML) => {

        if (err) {
            console.error('Erro ao ler template:', err);
            return res.status(500).send('Erro ao carregar o template');
        }
    

        // Lê o template
        fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
            
            if (err) {
                console.error('Erro ao ler template:', err);
                return res.status(500).send('Erro ao carregar o template');
            }

            // Substitui o marcador pelo HTML gerado
            const finalHtml = templateHtml.replace('{{TERMOS}}', termosHTML);

            res.send(finalHtml);
        });

    });

});




app.get('/multitrack-list', (req, res) => {
    logger.info('Recebida requisição para /multitrack-list');

    const jsonPath = path.join(__dirname, 'data', 'multitrack-musicas.json');
    const templatePath = path.join(__dirname, 'templates', 'multitrack-list.html');

    logger.info('Banco de dados ' + jsonPath + " aberto");


    // Lê o JSON
    fs.readFile(jsonPath, 'utf8', (err, jsonData) => {

        if (err) {
            console.error('Erro ao ler JSON:', err);
            return res.status(500).send('Erro ao ler dados');
        }

        const musicas = JSON.parse(jsonData);

        // Gera o HTML da tabela
        const linhas = musicas.map(m => `

          <div class="col-md-6">
              <a href="multitrack/${m.id}/">
              <div class="ticketBox" data-ticket-price="50000">
                  <div class="inactiveStatus"></div>
                    <div class="row">
                        <div class="col-xs-6">
                          <div class="ticket-name">
                                    ${m.nome}<span>${m.artista}</span>
                          </div>
                        </div>
                            
                        <div class="col-xs-6">
                            <img src="${m.url}/cover.jpeg" height="64px" width="64px">
                        </div>
                    </div>
                </div>
                </a>
          </div>
        `).join('\n');

        // Lê o template
        fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
            if (err) {
                console.error('Erro ao ler template:', err);
                return res.status(500).send('Erro ao carregar o template');
            }

            // Substitui o marcador pelo HTML gerado
            const finalHtml = templateHtml.replace('{{MUSICAS}}', linhas);
            res.send(finalHtml);
        });
    });
});


app.get('/multitrack/:multitrackId', (req, res) => {

    const multitrackId = req.params.multitrackId;
    const jsonPath = path.join(__dirname, 'data', 'multitrack-musicas.json');
    const templatePath = path.join(__dirname, 'templates', 'multitrack-musica.html');

    logger.info(`Requisição para /multitrack/${multitrackId}`);

    fs.readFile(jsonPath, 'utf8', (err, jsonData) => {

        if (err) {
            logger.error('Erro ao ler JSON: ' + err.message);
            return res.status(500).send('Erro ao ler dados');
        }

        logger.info('Musica Id: ' + multitrackId);

        const multitrack_list = JSON.parse(jsonData);
        
        const multitrack = multitrack_list.find(m => m.id == multitrackId);
        
        logger.info('Multitrack ' + multitrack.nome + " path=" + multitrack.url);

        if (!multitrack) {
            logger.warn(`Música '${multitrackId}' não encontrada`);
            return res.status(404).send('Música não encontrada');
        }

        fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
            if (err) {
                logger.error('Erro ao ler template: ' + err.message);
                return res.status(500).send('Erro ao carregar o template');
            }

            const finalHtml = templateHtml
                .replaceAll('{{URL}}', multitrack.url)
                .replaceAll('{{NOME}}', multitrack.nome)
                .replaceAll('{{ARTISTA}}', multitrack.artista);

            res.send(finalHtml);
        });
    });
});




app.get('/cifras', (req, res) => {
    logger.info('Recebida requisição para /cifras');

    const jsonPath = path.join(__dirname, 'data', 'cifras.json');
    const templatePath = path.join(__dirname, 'templates', 'cifras.html');

    logger.info('Banco de dados ' + jsonPath + " aberto");


    // Lê o JSON
    fs.readFile(jsonPath, 'utf8', (err, jsonData) => {

        if (err) {
            console.error('Erro ao ler JSON:', err);
            return res.status(500).send('Erro ao ler dados');
        }

        const cifras = JSON.parse(jsonData);

        // Gera o HTML da tabela
        const linhas = cifras.map(c => `

          <div class="col-md-6">
              <a href="cifras/${c.id}/">
              <div class="ticketBox" data-ticket-price="50000">
                  <div class="inactiveStatus"></div>
                    <div class="row">
                        <div class="col-xs-6">
                          <div class="ticket-name">
                                    ${c.nome}<span>${c.artista}</span>
                          </div>
                        </div>
                            
                        <div class="col-xs-6">
                            <img src="${c.url}/cover.jpeg" height="64px" width="64px">
                        </div>
                    </div>
                </div>
                </a>
          </div>
        `).join('\n');

        // Lê o template
        fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
            if (err) {
                console.error('Erro ao ler template:', err);
                return res.status(500).send('Erro ao carregar o template');
            }

            // Substitui o marcador pelo HTML gerado
            const finalHtml = templateHtml.replace('{{MUSICAS}}', linhas);
            res.send(finalHtml);
        });
    });
});

app.get('/cifras/:cifraId', (req, res) => {

    const cifraId = req.params.cifraId;
    const jsonPath = path.join(__dirname, 'data', 'cifras.json');
    const templatePath = path.join(__dirname, 'templates', 'cifra-musica.html');
    const termosPath = path.join(__dirname, 'templates', 'termos-uso.html');

    logger.info(`Requisição para /cifras/${cifraId}`);

    fs.readFile(jsonPath, 'utf8', (err, jsonData) => {

        if (err) {
            logger.error('Erro ao ler JSON: ' + err.message);
            return res.status(500).send('Erro ao ler dados');
        }

        logger.info('Cifra Id: ' + cifraId);

        const cifras_list = JSON.parse(jsonData);
        
        const cifra = cifras_list.find(c => c.id == cifraId);
        
        logger.info('Cifra ' + cifra.nome + " path=" + cifra.url);

        if (!cifra) {
            logger.warn(`Cifra '${cifraId}' não encontrada`);
            return res.status(404).send('Cifra não encontrada');
        }

        fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
            if (err) {
                logger.error('Erro ao ler template: ' + err.message);
                return res.status(500).send('Erro ao carregar o template');
            }

            const finalHtml = templateHtml
                .replaceAll('{{URL}}', cifra.url)
                .replaceAll('{{NOME}}', cifra.nome)
                .replaceAll('{{ARTISTA}}', cifra.artista)
                .replaceAll('{{imagemCifra}}', cifra.imagemCifra);

            res.send(finalHtml);
        });
    });
});

// Rota GET para exibir página de upload
app.get('/upload', (req, res) => {
    logger.info('Recebida requisição para /upload');
    const templatePath = path.join(__dirname, 'templates', 'upload.html');

    fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
        if (err) {
            logger.error('Erro ao ler template: ' + err.message);
            return res.status(500).send('Erro ao carregar o template');
        }

        res.send(templateHtml);
    });
});

// Rota POST para processar upload de áudio
app.post('/upload', upload.single('audioFile'), (req, res) => {
    logger.info('Recebida requisição POST para /upload');

    if (!req.file) {
        logger.warn('Nenhum arquivo foi enviado');
        return res.status(400).send(`
            <html>
                <head>
                    <link href="/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body class="container mt-5">
                    <div class="alert alert-danger">
                        <h4>Erro!</h4>
                        <p>Nenhum arquivo foi enviado.</p>
                        <a href="/upload" class="btn btn-primary">Tentar novamente</a>
                    </div>
                </body>
            </html>
        `);
    }

    // Salva no banco de dados
    const uploadData = {
        original_filename: req.file.originalname,
        saved_filename: req.file.filename,
        file_path: req.file.path,
        file_size: req.file.size,
        artist: req.body.artist || 'Desconhecido',
        song_name: req.body.song_name || req.file.originalname.replace(/\.[^/.]+$/, '')
    };

    dbOperations.insertUpload(uploadData, (err, uploadId) => {
        if (err) {
            logger.error('Erro ao salvar no banco de dados: ' + err.message);
            return res.status(500).send('Erro ao processar upload');
        }

        logger.info(`Arquivo ${req.file.filename} salvo com sucesso. ID: ${uploadId}`);

        // Inicia processamento da música em background
        const pythonScript = path.join(__dirname, 'process_audio.py');
        const pythonPath = path.join(__dirname, 'venv', 'bin', 'python3');
        const command = `"${pythonPath}" "${pythonScript}" "${req.file.path}" ${uploadId}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Erro ao processar áudio: ${error.message}`);
                dbOperations.updateProcessingStatus(uploadId, 'error', null, () => {});
            } else {
                logger.info(`Processamento iniciado para upload ID ${uploadId}`);
            }
        });

        res.send(`
            <html>
                <head>
                    <link href="/css/bootstrap.min.css" rel="stylesheet">
                    <link href="/css/custom.css" rel="stylesheet">
                </head>
                <body class="container mt-5">
                    <div class="alert alert-success">
                        <h4>Upload realizado com sucesso!</h4>
                        <p><strong>Nome do arquivo:</strong> ${req.file.originalname}</p>
                        <p><strong>Tamanho:</strong> ${(req.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Salvo como:</strong> ${req.file.filename}</p>
                        <p><strong>Status:</strong> Processamento iniciado</p>
                    </div>
                    <a href="/upload" class="btn btn-primary">Enviar outro arquivo</a>
                    <a href="/" class="btn btn-secondary">Voltar para home</a>
                </body>
            </html>
        `);
    });
});

// Rota para listar todos os uploads
app.get('/my-uploads', (req, res) => {
    logger.info('Recebida requisição para /my-uploads');

    dbOperations.getAllUploads((err, uploads) => {
        if (err) {
            logger.error('Erro ao buscar uploads: ' + err.message);
            return res.status(500).send('Erro ao buscar uploads');
        }

        const templatePath = path.join(__dirname, 'templates', 'my-uploads.html');

        const linhas = uploads.map(u => {
            const statusBadge = u.processing_status === 'completed' ? 'success' :
                               u.processing_status === 'processing' ? 'warning' :
                               u.processing_status === 'error' ? 'danger' : 'secondary';

            const statusText = u.processing_status === 'completed' ? 'Processado' :
                              u.processing_status === 'processing' ? 'Processando' :
                              u.processing_status === 'error' ? 'Erro' : 'Pendente';

            const playLink = u.processing_status === 'completed' ?
                `<a href="/player/${u.id}?autoplay=true" class="btn btn-sm btn-success" style="margin: 2px;">
                    <i class="fa fa-play"></i> Tocar
                </a>` :
                '';

            return `
                <div class="col-md-6" style="margin-bottom: 15px;">
                    <div class="ticketBox">
                        <div class="row">
                            <div class="col-xs-7">
                                <div class="ticket-name">
                                    ${u.song_name}<span>${u.artist}</span>
                                </div>
                                <small class="text-muted">${new Date(u.upload_date).toLocaleDateString('pt-BR')}</small>
                            </div>
                            <div class="col-xs-5 text-right">
                                <span class="badge badge-${statusBadge}">${statusText}</span>
                                <br>
                                <div style="margin-top: 5px;">
                                    ${playLink}
                                    <a href="/edit/${u.id}" class="btn btn-sm btn-warning" style="margin: 2px;">
                                        <i class="fa fa-edit"></i> Editar
                                    </a>
                                    <form action="/delete/${u.id}" method="POST" style="display: inline;"
                                          onsubmit="return confirm('Tem certeza que deseja deletar esta música?');">
                                        <button type="submit" class="btn btn-sm btn-danger" style="margin: 2px;">
                                            <i class="fa fa-trash"></i> Deletar
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('\n');

        fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
            if (err) {
                logger.error('Erro ao ler template: ' + err.message);
                return res.status(500).send('Erro ao carregar template');
            }

            const finalHtml = templateHtml.replace('{{UPLOADS}}', linhas);
            res.send(finalHtml);
        });
    });
});

// Rota para player de música processada
app.get('/player/:uploadId', (req, res) => {
    const uploadId = req.params.uploadId;
    logger.info(`Requisição para /player/${uploadId}`);

    dbOperations.getUploadById(uploadId, (err, upload) => {
        if (err || !upload) {
            logger.error('Upload não encontrado: ' + uploadId);
            return res.status(404).send('Upload não encontrado');
        }

        if (upload.processing_status !== 'completed') {
            return res.status(400).send('Música ainda não foi processada');
        }

        const templatePath = path.join(__dirname, 'templates', 'player-upload.html');
        const autoplay = req.query.autoplay === 'true' ? 'true' : 'false';

        fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
            if (err) {
                logger.error('Erro ao ler template: ' + err.message);
                return res.status(500).send('Erro ao carregar template');
            }

            const finalHtml = templateHtml
                .replaceAll('{{URL}}', upload.processed_path)
                .replaceAll('{{NOME}}', upload.song_name)
                .replaceAll('{{ARTISTA}}', upload.artist)
                .replaceAll('{{ID}}', upload.id)
                .replaceAll('{{AUTOPLAY}}', autoplay);

            res.send(finalHtml);
        });
    });
});

// Rota para editar música (GET)
app.get('/edit/:uploadId', (req, res) => {
    const uploadId = req.params.uploadId;
    logger.info(`Requisição para /edit/${uploadId}`);

    dbOperations.getUploadById(uploadId, (err, upload) => {
        if (err || !upload) {
            logger.error('Upload não encontrado: ' + uploadId);
            return res.status(404).send('Upload não encontrado');
        }

        const templatePath = path.join(__dirname, 'templates', 'edit-upload.html');

        fs.readFile(templatePath, 'utf8', (err, templateHtml) => {
            if (err) {
                logger.error('Erro ao ler template: ' + err.message);
                return res.status(500).send('Erro ao carregar template');
            }

            const finalHtml = templateHtml
                .replaceAll('{{ID}}', upload.id)
                .replaceAll('{{NOME}}', upload.song_name)
                .replaceAll('{{ARTISTA}}', upload.artist)
                .replaceAll('{{FILENAME}}', upload.original_filename);

            res.send(finalHtml);
        });
    });
});

// Rota para atualizar música (POST)
app.post('/update/:uploadId', (req, res) => {
    const uploadId = req.params.uploadId;
    const { song_name, artist } = req.body;

    logger.info(`Atualizando upload ${uploadId}: ${song_name} - ${artist}`);

    const sql = `UPDATE uploads SET song_name = ?, artist = ? WHERE id = ?`;

    const db = require('./database').db;
    db.run(sql, [song_name, artist, uploadId], function(err) {
        if (err) {
            logger.error('Erro ao atualizar: ' + err.message);
            return res.status(500).send('Erro ao atualizar');
        }

        logger.info(`Upload ${uploadId} atualizado com sucesso`);
        res.redirect('/my-uploads');
    });
});

// Rota para deletar música (POST)
app.post('/delete/:uploadId', (req, res) => {
    const uploadId = req.params.uploadId;

    logger.info(`Deletando upload ${uploadId}`);

    dbOperations.getUploadById(uploadId, (err, upload) => {
        if (err || !upload) {
            return res.status(404).send('Upload não encontrado');
        }

        // Deleta arquivos
        try {
            if (fs.existsSync(upload.file_path)) {
                fs.unlinkSync(upload.file_path);
            }
            if (upload.processed_path) {
                const processedDir = path.join(__dirname, upload.processed_path.replace(/^\//, ''));
                if (fs.existsSync(processedDir)) {
                    fs.rmSync(processedDir, { recursive: true, force: true });
                }
            }
        } catch (error) {
            logger.error('Erro ao deletar arquivos: ' + error.message);
        }

        // Deleta do banco
        dbOperations.deleteUpload(uploadId, (err) => {
            if (err) {
                logger.error('Erro ao deletar do banco: ' + err.message);
                return res.status(500).send('Erro ao deletar');
            }

            logger.info(`Upload ${uploadId} deletado com sucesso`);
            res.redirect('/my-uploads');
        });
    });
});

// Servir arquivos processados
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// Start do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});