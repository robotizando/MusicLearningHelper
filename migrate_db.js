require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configura caminho do banco de dados
const dbPath = process.env.DB_PATH
    ? (path.isAbsolute(process.env.DB_PATH)
        ? process.env.DB_PATH
        : path.join(__dirname, process.env.DB_PATH))
    : path.join(__dirname, 'data', 'uploads.db');

console.log(`Conectando ao banco de dados: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    // Verifica se a coluna user_id já existe
    db.all("PRAGMA table_info(uploads)", (err, columns) => {
        if (err) {
            console.error('Erro ao verificar estrutura da tabela:', err.message);
            db.close();
            process.exit(1);
        }

        const hasUserId = columns.some(col => col.name === 'user_id');

        if (hasUserId) {
            console.log('✓ A coluna user_id já existe na tabela uploads');
            db.close();
            return;
        }

        console.log('Adicionando coluna user_id à tabela uploads...');

        // Adiciona a coluna user_id
        db.run(`ALTER TABLE uploads ADD COLUMN user_id INTEGER`, (err) => {
            if (err) {
                console.error('Erro ao adicionar coluna user_id:', err.message);
                db.close();
                process.exit(1);
            }

            console.log('✓ Coluna user_id adicionada com sucesso!');

            // Verifica se existe algum usuário para atribuir os uploads órfãos
            db.get('SELECT id FROM users ORDER BY id ASC LIMIT 1', (err, user) => {
                if (err) {
                    console.error('Erro ao buscar usuário:', err.message);
                    db.close();
                    process.exit(1);
                }

                if (user) {
                    // Atribui todos os uploads sem user_id ao primeiro usuário
                    db.run(`UPDATE uploads SET user_id = ? WHERE user_id IS NULL`, [user.id], function(err) {
                        if (err) {
                            console.error('Erro ao atualizar uploads órfãos:', err.message);
                        } else if (this.changes > 0) {
                            console.log(`✓ ${this.changes} upload(s) órfão(s) foram atribuídos ao usuário ID ${user.id}`);
                        }

                        console.log('\n✓ Migração concluída com sucesso!');
                        db.close();
                    });
                } else {
                    console.log('⚠ Nenhum usuário encontrado. Uploads ficarão sem user_id até que sejam atribuídos.');
                    console.log('\n✓ Migração concluída com sucesso!');
                    db.close();
                }
            });
        });
    });
});
