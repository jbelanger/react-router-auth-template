import { getLogger } from '@gc-fwcs/logger';
import { expressServer } from './.server/configuration/dependencies';

const PORT = process.env.PORT ?? '5173';

const log = getLogger('server');
log.info('Starting server...');

log.info('Server initialization complete');
expressServer.listen(PORT, () => log.info(`Listening on http://localhost:${PORT}/`));
