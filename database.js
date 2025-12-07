const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');

const dbPath = path.join(__dirname, 'data', 'uploads.db');

// Cria conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Erro ao conectar ao banco de dados: ' + err.message);
    } else {
        logger.info('Conectado ao banco de dados SQLite em ' + dbPath);
    }
});

// Cria tabela de uploads se não existir
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_filename TEXT NOT NULL,
            saved_filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            processing_status TEXT DEFAULT 'pending',
            processed_path TEXT,
            artist TEXT,
            song_name TEXT
        )
    `, (err) => {
        if (err) {
            logger.error('Erro ao criar tabela: ' + err.message);
        } else {
            logger.info('Tabela uploads verificada/criada com sucesso');
        }
    });
});

// Funções auxiliares para manipular o banco de dados
const dbOperations = {
    // Inserir novo upload
    insertUpload: (data, callback) => {
        const sql = `
            INSERT INTO uploads (original_filename, saved_filename, file_path, file_size, artist, song_name)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.run(sql, [
            data.original_filename,
            data.saved_filename,
            data.file_path,
            data.file_size,
            data.artist || 'Desconhecido',
            data.song_name || data.original_filename.replace(/\.[^/.]+$/, '')
        ], function(err) {
            if (callback) {
                callback(err, this ? this.lastID : null);
            }
        });
    },

    // Listar todos os uploads
    getAllUploads: (callback) => {
        const sql = `
            SELECT * FROM uploads
            ORDER BY upload_date DESC
        `;
        db.all(sql, [], callback);
    },

    // Buscar upload por ID
    getUploadById: (id, callback) => {
        const sql = `SELECT * FROM uploads WHERE id = ?`;
        db.get(sql, [id], callback);
    },

    // Atualizar status de processamento
    updateProcessingStatus: (id, status, processedPath, callback) => {
        const sql = `
            UPDATE uploads
            SET processing_status = ?, processed_path = ?
            WHERE id = ?
        `;
        db.run(sql, [status, processedPath, id], callback);
    },

    // Deletar upload
    deleteUpload: (id, callback) => {
        const sql = `DELETE FROM uploads WHERE id = ?`;
        db.run(sql, [id], callback);
    }
};

module.exports = {
    db,
    dbOperations
};
