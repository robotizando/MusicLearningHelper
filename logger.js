const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: 'info',  // Níveis: error, warn, info, http, verbose, debug, silly
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
    ),
    transports: [
        new transports.Console(),
        // Se quiser salvar em arquivo depois:
        // new transports.File({ filename: 'logs/combined.log' })
    ],
});

module.exports = logger;

