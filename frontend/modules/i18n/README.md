# I18n Routing Module

This module provides internationalized (i18n) routing capabilities for React Router applications, allowing you to create language-specific routes with seamless language switching.

## Key Components

### 1. i18nRoute Function

The `i18nRoute` function creates route configurations for multiple languages. It generates both English and French versions of a route automatically.

```typescript
i18nRoute(enPath: string, frPath: string, file: string, children?: RouteConfigEntry[])
```

Example:

```typescript
...i18nRoute("products", "produits", "routes/products/index.tsx")
```

This creates two routes:

- English: `/products` with ID `products-en`
- French: `/produits` with ID `products-fr`

### 2. I18nLink Component

A React component that renders internationalized links, automatically handling language-specific routes.

```tsx
<I18nLink to="products">Our Products</I18nLink>
```

Features:

- Automatically uses the current language context when no `lang` prop is provided
- Supports explicit language override: `<I18nLink to="products" lang="fr">`
- Handles route parameters
- Falls back to regular links for external URLs (e.g., `<I18nLink to="https://example.com">`)

### 3. I18nRoutesProvider Component

A context provider component that makes route configurations available throughout the application.

```tsx
<I18nRoutesProvider routes={routes}>
   <App />
</I18nRoutesProvider>
```

## Usage

### 1. Route Configuration

In your `routes.ts` file:

```typescript
import { i18nRoute } from '@gc-fwcs/i18n/routing';

const routes = [
   // Regular routes
   index('routes/_index.tsx'),

   // i18n routes
   layout('routes/shop/_layout.tsx', [
      ...i18nRoute('products', 'produits', 'routes/shop/products.tsx'),
      ...i18nRoute('products/categories', 'produits/categories', 'routes/shop/categories.tsx'),
   ]),
];
```

### 2. Using I18nLink in Components

```tsx
import { I18nLink } from '@gc-fwcs/i18n/routing';

function Navigation() {
   return (
      <nav>
         {/* Uses current language */}
         <I18nLink to="products">Products</I18nLink>

         {/* Explicitly set language */}
         <I18nLink to="products" lang="fr">
            Produits
         </I18nLink>

         {/* With route parameters */}
         <I18nLink to="products/category" params={{ id: 'electronics' }}>
            Electronics
         </I18nLink>
      </nav>
   );
}
```

## Implementation Details

### Route IDs

The system uses a consistent ID scheme for language-specific routes:

- English routes: `{path}-en`
- French routes: `{path}-fr`

This allows the `I18nLink` component to find the corresponding route in different languages.

### Hooks and Utilities

The module provides several hooks and utilities:

#### Client-Side Hooks

- `useRoutes()`: Access all route configurations
- `useRouteById(id)`: Find a specific route by ID
- `useCurrentLanguage()`: Get the current language based on the route

#### Server-Side Utilities

- `getRouteLanguage(resource, routes, fallback?)`: Extract language from a route

   - `resource`: Request, URL, or string path
   - `routes`: Array of route configurations
   - `fallback`: Whether to fallback to 'en' (true) or throw error (false)

- `getAltLanguage(language)`: Get alternate language ('en' → 'fr' or 'fr' → 'en')

Example server-side usage:

```typescript
import { getRouteLanguage } from '@gc-fwcs/i18n/routing';

export async function loader({ request, routes }) {
   const lang = getRouteLanguage(request, routes);
   // Use language for i18n setup
}
```
