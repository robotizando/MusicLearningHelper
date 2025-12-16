#!/usr/bin/env node
/**
 * Script de diagnóstico para verificar variáveis de ambiente
 * Use em produção para verificar se o .env está sendo carregado
 */

require('dotenv').config();
const path = require('path');

console.log('='.repeat(70));
console.log('DIAGNÓSTICO DE VARIÁVEIS DE AMBIENTE');
console.log('='.repeat(70));
console.log();

console.log('Diretório atual do script:', __dirname);
console.log();

// Verifica arquivo .env
const envPath = path.join(__dirname, '.env');
const fs = require('fs');
console.log('Arquivo .env existe?', fs.existsSync(envPath));
console.log('Caminho do .env:', envPath);
console.log();

// Mostra variáveis relevantes
console.log('Variáveis de Ambiente:');
console.log('-'.repeat(70));
console.log('DATA_DIR (raw)        :', process.env.DATA_DIR || 'NÃO DEFINIDA');
console.log('DB_PATH (raw)         :', process.env.DB_PATH || 'NÃO DEFINIDA');
console.log('PORT                  :', process.env.PORT || 'NÃO DEFINIDA');
console.log('SESSION_SECRET        :', process.env.SESSION_SECRET ? 'DEFINIDA' : 'NÃO DEFINIDA');
console.log();

// Calcula caminhos resolvidos (igual ao server.js)
const DATA_DIR = process.env.DATA_DIR
    ? (path.isAbsolute(process.env.DATA_DIR)
        ? process.env.DATA_DIR
        : path.join(__dirname, process.env.DATA_DIR))
    : path.join(__dirname, 'data');

const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');

const DB_PATH = process.env.DB_PATH
    ? (path.isAbsolute(process.env.DB_PATH)
        ? process.env.DB_PATH
        : path.join(__dirname, process.env.DB_PATH))
    : path.join(__dirname, 'data', 'database', 'uploads.db');

console.log('Caminhos Resolvidos (como o servidor vê):');
console.log('-'.repeat(70));
console.log('DATA_DIR (resolvido)  :', DATA_DIR);
console.log('UPLOADS_DIR           :', UPLOADS_DIR);
console.log('PROCESSED_DIR         :', PROCESSED_DIR);
console.log('DB_PATH (resolvido)   :', DB_PATH);
console.log();

// Verifica se os diretórios existem
console.log('Diretórios Existem?');
console.log('-'.repeat(70));
console.log('DATA_DIR              :', fs.existsSync(DATA_DIR) ? 'SIM' : 'NÃO');
console.log('UPLOADS_DIR           :', fs.existsSync(UPLOADS_DIR) ? 'SIM' : 'NÃO');
console.log('PROCESSED_DIR         :', fs.existsSync(PROCESSED_DIR) ? 'SIM' : 'NÃO');
console.log('DB_PATH (dir)         :', fs.existsSync(path.dirname(DB_PATH)) ? 'SIM' : 'NÃO');
console.log();

// Lista conteúdo se existirem
if (fs.existsSync(UPLOADS_DIR)) {
    const uploads = fs.readdirSync(UPLOADS_DIR);
    console.log(`UPLOADS_DIR contém ${uploads.length} arquivo(s)`);
}

if (fs.existsSync(PROCESSED_DIR)) {
    const processed = fs.readdirSync(PROCESSED_DIR);
    console.log(`PROCESSED_DIR contém ${processed.length} arquivo(s)`);
}

console.log();
console.log('='.repeat(70));
