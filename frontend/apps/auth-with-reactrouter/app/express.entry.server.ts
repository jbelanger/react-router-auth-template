import { getLogger } from '@gc-fwcs/logger';
import { createExpressServer } from '~/.server/configuration/dependencies';

const PORT = process.env.PORT ?? '5173';

const log = getLogger('server');
log.info('Starting server...');

const app = await createExpressServer();

log.info('Server initialization complete');
app.listen(PORT, () => log.info(`Listening on http://localhost:${PORT}/`));