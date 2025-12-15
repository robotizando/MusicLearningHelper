const bcrypt = require('bcryptjs');
const { dbOperations } = require('./database');
const logger = require('./logger');

// Middleware para verificar se usuário está autenticado
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Middleware para verificar se usuário é admin
function requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.isAdmin) {
        return next();
    }
    res.status(403).send(`
        <html>
            <head>
                <link href="/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Acesso Negado!</h4>
                    <p>Você precisa ser administrador para acessar esta página.</p>
                    <a href="/" class="btn btn-primary">Voltar para home</a>
                </div>
            </body>
        </html>
    `);
}

// Criar usuário administrador padrão se não existir
function createDefaultAdmin(callback) {
    const defaultAdmin = {
        username: 'admin',
        password: 'admin123',
        full_name: 'Administrador',
        email: 'admin@musichelper.local',
        is_admin: 1
    };

    dbOperations.getUserByUsername(defaultAdmin.username, (err, user) => {
        if (err) {
            logger.error('Erro ao verificar usuário admin: ' + err.message);
            return callback(err);
        }

        if (user) {
            logger.info('Usuário admin já existe');
            return callback(null);
        }

        // Hash da senha
        bcrypt.hash(defaultAdmin.password, 10, (err, hashedPassword) => {
            if (err) {
                logger.error('Erro ao criar hash da senha: ' + err.message);
                return callback(err);
            }

            defaultAdmin.password = hashedPassword;

            dbOperations.insertUser(defaultAdmin, (err, userId) => {
                if (err) {
                    logger.error('Erro ao criar usuário admin: ' + err.message);
                    return callback(err);
                }

                logger.info(`Usuário admin criado com sucesso! ID: ${userId}`);
                logger.info('Credenciais padrão - username: admin, password: admin123');
                callback(null);
            });
        });
    });
}

module.exports = {
    requireAuth,
    requireAdmin,
    createDefaultAdmin
};
