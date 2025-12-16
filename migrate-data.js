#!/usr/bin/env node
/**
 * Script de Migração de Dados
 *
 * Este script migra os dados existentes da estrutura antiga para a nova estrutura configurável:
 *
 * Estrutura antiga:
 * - uploads/               -> arquivos originais
 * - processed/             -> arquivos processados
 * - data/uploads.db        -> banco de dados
 *
 * Estrutura nova (configurável via .env):
 * - DATA_DIR/uploads/      -> arquivos originais
 * - DATA_DIR/processed/    -> arquivos processados
 * - DB_PATH                -> banco de dados (separado, configurável)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db, dbOperations } = require('./database');

console.log('='.repeat(80));
console.log('Script de Migração de Dados');
console.log('='.repeat(80));
console.log();

// Configurações
const OLD_UPLOADS_DIR = path.join(__dirname, 'uploads');
const OLD_PROCESSED_DIR = path.join(__dirname, 'processed');
const OLD_DB_PATH = path.join(__dirname, 'data', 'uploads.db');

const DATA_DIR = process.env.DATA_DIR
    ? (path.isAbsolute(process.env.DATA_DIR)
        ? process.env.DATA_DIR
        : path.join(__dirname, process.env.DATA_DIR))
    : path.join(__dirname, 'data');

const NEW_UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const NEW_PROCESSED_DIR = path.join(DATA_DIR, 'processed');

const NEW_DB_PATH = process.env.DB_PATH
    ? (path.isAbsolute(process.env.DB_PATH)
        ? process.env.DB_PATH
        : path.join(__dirname, process.env.DB_PATH))
    : path.join(__dirname, 'data', 'database', 'uploads.db');

console.log('Configuração de Migração:');
console.log('-'.repeat(80));
console.log('Origem:');
console.log(`  Uploads:    ${OLD_UPLOADS_DIR}`);
console.log(`  Processed:  ${OLD_PROCESSED_DIR}`);
console.log(`  Database:   ${OLD_DB_PATH}`);
console.log();
console.log('Destino:');
console.log(`  Uploads:    ${NEW_UPLOADS_DIR}`);
console.log(`  Processed:  ${NEW_PROCESSED_DIR}`);
console.log(`  Database:   ${NEW_DB_PATH}`);
console.log('='.repeat(80));
console.log();

// Função para copiar diretório recursivamente
function copyDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`⚠️  Diretório de origem não existe: ${src}`);
        return 0;
    }

    // Cria diretório de destino
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    let count = 0;
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            count += copyDir(srcPath, destPath);
        } else {
            // Verifica se o arquivo já existe no destino
            if (fs.existsSync(destPath)) {
                console.log(`  ⏭️  Arquivo já existe: ${entry.name}`);
            } else {
                fs.copyFileSync(srcPath, destPath);
                console.log(`  ✓ Copiado: ${entry.name}`);
                count++;
            }
        }
    }

    return count;
}

// Função para atualizar caminhos no banco de dados
function updateDatabasePaths(callback) {
    console.log();
    console.log('Atualizando caminhos no banco de dados...');
    console.log('-'.repeat(80));

    dbOperations.getAllUploads((err, uploads) => {
        if (err) {
            console.error('❌ Erro ao buscar uploads:', err.message);
            return callback(err);
        }

        if (uploads.length === 0) {
            console.log('Nenhum upload encontrado no banco de dados.');
            return callback(null);
        }

        let updated = 0;
        let errors = 0;

        uploads.forEach((upload, index) => {
            // Atualiza file_path
            let newFilePath = upload.file_path;
            if (newFilePath && newFilePath.includes('/uploads/')) {
                const filename = path.basename(newFilePath);
                newFilePath = path.join(NEW_UPLOADS_DIR, filename);
            }

            // Atualiza processed_path
            let newProcessedPath = upload.processed_path;
            if (newProcessedPath) {
                // Remove barra inicial se existir
                newProcessedPath = newProcessedPath.replace(/^\//, '');
                // Atualiza para o novo caminho relativo
                const uploadFolder = path.basename(newProcessedPath);
                newProcessedPath = `/processed/${uploadFolder}`;
            }

            // Atualiza no banco
            const sql = `
                UPDATE uploads
                SET file_path = ?, processed_path = ?
                WHERE id = ?
            `;

            db.run(sql, [newFilePath, newProcessedPath, upload.id], (err) => {
                if (err) {
                    console.error(`  ❌ Erro ao atualizar upload ID ${upload.id}:`, err.message);
                    errors++;
                } else {
                    console.log(`  ✓ Upload ID ${upload.id} atualizado`);
                    updated++;
                }

                // Quando terminar todos
                if (index === uploads.length - 1) {
                    console.log('-'.repeat(80));
                    console.log(`Atualizados: ${updated} | Erros: ${errors}`);
                    callback(null);
                }
            });
        });
    });
}

// Executa a migração
console.log('Iniciando migração...');
console.log();

// 1. Migra uploads
console.log('1. Migrando uploads...');
console.log('-'.repeat(80));
const uploadsCopied = copyDir(OLD_UPLOADS_DIR, NEW_UPLOADS_DIR);
console.log('-'.repeat(80));
console.log(`Total de arquivos copiados: ${uploadsCopied}`);

console.log();

// 2. Migra processed
console.log('2. Migrando arquivos processados...');
console.log('-'.repeat(80));
const processedCopied = copyDir(OLD_PROCESSED_DIR, NEW_PROCESSED_DIR);
console.log('-'.repeat(80));
console.log(`Total de arquivos copiados: ${processedCopied}`);

// 3. Atualiza banco de dados
updateDatabasePaths((err) => {
    if (err) {
        console.error('❌ Erro ao atualizar banco de dados');
        process.exit(1);
    }

    console.log();
    console.log('='.repeat(80));
    console.log('✅ Migração concluída com sucesso!');
    console.log('='.repeat(80));
    console.log();
    console.log('Próximos passos:');
    console.log('1. Verifique se tudo está funcionando corretamente');
    console.log('2. Se tudo estiver OK, você pode deletar as pastas antigas:');
    console.log(`   - ${OLD_UPLOADS_DIR}`);
    console.log(`   - ${OLD_PROCESSED_DIR}`);
    console.log();
    console.log('IMPORTANTE: Faça backup antes de deletar!');
    console.log('='.repeat(80));

    db.close();
    process.exit(0);
});
