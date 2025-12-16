require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');

// Configura caminho do banco de dados a partir da variável de ambiente
// Se não estiver definida, usa o caminho padrão
const dbPath = process.env.DB_PATH
    ? (path.isAbsolute(process.env.DB_PATH)
        ? process.env.DB_PATH
        : path.join(__dirname, process.env.DB_PATH))
    : path.join(__dirname, 'data', 'uploads.db');

// Cria conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Erro ao conectar ao banco de dados: ' + err.message);
    } else {
        logger.info('Conectado ao banco de dados SQLite em ' + dbPath);
    }
});

// Cria tabelas se não existirem
db.serialize(() => {
    // Tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            logger.error('Erro ao criar tabela users: ' + err.message);
        } else {
            logger.info('Tabela users verificada/criada com sucesso');
        }
    });

    // Tabela de uploads
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
            song_name TEXT,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            logger.error('Erro ao criar tabela uploads: ' + err.message);
        } else {
            logger.info('Tabela uploads verificada/criada com sucesso');
        }
    });
});

// Funções auxiliares para manipular o banco de dados
const dbOperations = {
    // ========== OPERAÇÕES DE USUÁRIOS ==========

    // Inserir novo usuário
    insertUser: (data, callback) => {
        const sql = `
            INSERT INTO users (username, password, full_name, email, is_admin)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.run(sql, [
            data.username,
            data.password,
            data.full_name,
            data.email,
            data.is_admin || 0
        ], function(err) {
            if (callback) {
                callback(err, this ? this.lastID : null);
            }
        });
    },

    // Buscar usuário por username
    getUserByUsername: (username, callback) => {
        const sql = `SELECT * FROM users WHERE username = ?`;
        db.get(sql, [username], callback);
    },

    // Buscar usuário por ID
    getUserById: (id, callback) => {
        const sql = `SELECT * FROM users WHERE id = ?`;
        db.get(sql, [id], callback);
    },

    // Listar todos os usuários
    getAllUsers: (callback) => {
        const sql = `
            SELECT id, username, full_name, email, is_admin, created_at
            FROM users
            ORDER BY created_at DESC
        `;
        db.all(sql, [], callback);
    },

    // Atualizar usuário
    updateUser: (id, data, callback) => {
        const sql = `
            UPDATE users
            SET full_name = ?, email = ?, is_admin = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        db.run(sql, [data.full_name, data.email, data.is_admin, id], callback);
    },

    // Atualizar senha do usuário
    updateUserPassword: (id, hashedPassword, callback) => {
        const sql = `
            UPDATE users
            SET password = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        db.run(sql, [hashedPassword, id], callback);
    },

    // Deletar usuário
    deleteUser: (id, callback) => {
        const sql = `DELETE FROM users WHERE id = ?`;
        db.run(sql, [id], callback);
    },

    // ========== OPERAÇÕES DE UPLOADS ==========

    // Inserir novo upload
    insertUpload: (data, callback) => {
        const sql = `
            INSERT INTO uploads (original_filename, saved_filename, file_path, file_size, artist, song_name, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(sql, [
            data.original_filename,
            data.saved_filename,
            data.file_path,
            data.file_size,
            data.artist || 'Desconhecido',
            data.song_name || data.original_filename.replace(/\.[^/.]+$/, ''),
            data.user_id
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

    // Listar uploads de um usuário específico
    getUploadsByUserId: (userId, callback) => {
        const sql = `
            SELECT * FROM uploads
            WHERE user_id = ?
            ORDER BY upload_date DESC
        `;
        db.all(sql, [userId], callback);
    },

    // Listar todos os uploads com informações do usuário (para admin)
    getAllUploadsWithUserInfo: (callback) => {
        const sql = `
            SELECT
                uploads.*,
                users.username,
                users.full_name
            FROM uploads
            LEFT JOIN users ON uploads.user_id = users.id
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
