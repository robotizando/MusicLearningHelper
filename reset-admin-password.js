require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, dbOperations } = require('./database');
const logger = require('./logger');

// Nova senha do admin (você pode mudar aqui ou passar como argumento)
const NEW_PASSWORD = process.argv[2] || 'admin123';

console.log('='.repeat(60));
console.log('Script de Reset de Senha do Administrador');
console.log('='.repeat(60));

dbOperations.getUserByUsername('admin', (err, user) => {
    if (err) {
        console.error('❌ Erro ao buscar usuário admin:', err.message);
        process.exit(1);
    }

    if (!user) {
        console.error('❌ Usuário admin não encontrado no banco de dados!');
        console.log('\nCriando usuário admin...');

        const defaultAdmin = {
            username: 'admin',
            password: 'admin123',
            full_name: 'Administrador',
            email: 'admin@musichelper.local',
            is_admin: 1
        };

        bcrypt.hash(NEW_PASSWORD, 10, (err, hashedPassword) => {
            if (err) {
                console.error('❌ Erro ao criar hash da senha:', err.message);
                process.exit(1);
            }

            defaultAdmin.password = hashedPassword;

            dbOperations.insertUser(defaultAdmin, (err, userId) => {
                if (err) {
                    console.error('❌ Erro ao criar usuário admin:', err.message);
                    process.exit(1);
                }

                console.log('✅ Usuário admin criado com sucesso!');
                console.log(`   ID: ${userId}`);
                console.log(`   Username: admin`);
                console.log(`   Nova senha: ${NEW_PASSWORD}`);
                console.log('='.repeat(60));
                db.close();
                process.exit(0);
            });
        });
        return;
    }

    console.log(`✓ Usuário admin encontrado (ID: ${user.id})`);
    console.log(`✓ Nova senha será: ${NEW_PASSWORD}`);
    console.log('\nAtualizando senha...');

    // Gerar hash da nova senha
    bcrypt.hash(NEW_PASSWORD, 10, (err, hashedPassword) => {
        if (err) {
            console.error('❌ Erro ao criar hash da senha:', err.message);
            process.exit(1);
        }

        // Atualizar senha no banco de dados
        dbOperations.updateUserPassword(user.id, hashedPassword, (err) => {
            if (err) {
                console.error('❌ Erro ao atualizar senha:', err.message);
                process.exit(1);
            }

            console.log('\n✅ Senha do admin resetada com sucesso!');
            console.log('='.repeat(60));
            console.log('Credenciais de login:');
            console.log(`  Username: admin`);
            console.log(`  Password: ${NEW_PASSWORD}`);
            console.log('='.repeat(60));

            db.close();
            process.exit(0);
        });
    });
});
