# I18n Module

This module provides internationalization (i18n) capabilities for React applications using i18next, with specific implementations for both client and server environments.

## Key Components

### 1. Core Configuration (`i18n.ts`)

The core module provides default configurations and utilities:

```typescript
export const i18nDefaults = {
   supportedLngs: ['en', 'fr'],
   fallbackLng: 'en',
   defaultNS: 'translation',
   interpolation: { escapeValue: false },
   preload: ['en', 'fr'],
   react: { useSuspense: false },
};
```

### 2. Client-Side Setup (`i18next.client.ts`)

The client implementation:
- Uses browser language detection
- Loads translations via HTTP backend
- Detects language from HTML tag
- Supports dynamic namespace loading

```typescript
const i18n = await createI18nClient({
   // Optional custom config
   debug: true,
   defaultNS: 'common'
});
```

### 3. Server-Side Setup (`i18next.server.ts`)

The server implementation:
- Uses filesystem backend for loading translations
- Supports route-based namespaces
- Provides utilities for fixed translations
- Integrates with Remix for SSR

```typescript
const i18n = await createI18nServer(
   routerContext,
   'en', // Initial language
   { /* Optional custom config */ }
);
```

## Usage

### 1. Initialize in Entry Points

Client-side initialization (`entry.client.tsx`):
```typescript
import { createI18nClient } from '@gc-fwcs/i18n/client';
import { I18nextProvider } from 'react-i18next';

startTransition(() => {
   void createI18nClient({
      defaultNS: ['common', 'layout'], // Set default namespaces
   }).then((i18n) => {
      hydrateRoot(
         document,
         <StrictMode>
            <I18nextProvider i18n={i18n}>
               <HydratedRouter />
            </I18nextProvider>
         </StrictMode>,
      );
   });
});
```

Server-side initialization (`entry.server.tsx`):
```typescript
import { getRouteLanguage } from '@gc-fwcs/i18n/routing';
import { createI18nServer } from '@gc-fwcs/i18n/server';

export default async function handleRequest(
   request: Request,
   responseStatusCode: number,
   responseHeaders: Headers,
   routerContext: EntryContext,
) {
   // Get language from current route
   const lng = getRouteLanguage(request, routes);
   
   // Create server-side i18n instance
   const i18n = await createI18nServer(
      routerContext,
      lng,
      { defaultNS: ['common', 'layout'] }
   );

   // Use in your server-side rendering
   renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
         <ServerRouter context={routerContext} url={request.url} />
      </I18nextProvider>,
      // ... rest of stream config
   );
}
```

### 2. Translation Files

Place your translation files in the `public/locales` directory:

```
public/
  locales/
    en/
      translation.json
      common.json
    fr/
      translation.json
      common.json
```

### 3. Using Translations

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
   const { t } = useTranslation();
   return <h1>{t('welcome.title')}</h1>;
}
```

### 4. Server-Side Translation

```typescript
import { getFixedT } from './i18next.server';

export async function loader() {
   const t = await getFixedT('en', 'translation');
   return json({ title: t('welcome.title') });
}
```

## Implementation Details

### Language Detection

Client-side:
- Uses HTML lang attribute detection
- No browser caching to ensure server-side language is respected
- Falls back to 'en' if no language is detected

Server-side:
- Supports language detection from request
- Configurable fallback language
- Route-based namespace loading

### Namespace Management

The module includes utilities for managing translation namespaces:

- `addDefaultNamespaces`: Ensures required namespaces are loaded
- Route-based namespace detection through Remix integration
- Support for multiple namespaces per route

### Type Safety

The module provides TypeScript types for:
- Configuration options
- Language codes
- Translation keys
- Namespace definitions

## Integration with Routing

This module works seamlessly with the i18n routing module to provide a complete internationalization solution. The server-side implementation automatically detects route namespaces and loads the appropriate translations.

See the [routing module documentation](../routing/README.md) for more details on route-based language handling.