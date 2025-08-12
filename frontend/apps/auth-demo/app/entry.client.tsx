import { StrictMode, startTransition } from 'react';

import { createI18nClient } from '@gc-fwcs/i18n/client';
import type { i18n } from 'i18next';
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { HydratedRouter } from 'react-router/dom';

function hydrateDocument(i18n: i18n): void {
   hydrateRoot(
      document,
      <StrictMode>
         <I18nextProvider i18n={i18n}>
            <HydratedRouter />
         </I18nextProvider>
      </StrictMode>,
   );
}

startTransition(() => {
   void createI18nClient({ defaultNS: ['common', 'layout'] }).then(hydrateDocument);
});
