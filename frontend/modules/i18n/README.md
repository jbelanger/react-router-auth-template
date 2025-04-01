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

-  English: `/products` with ID `products-en`
-  French: `/produits` with ID `products-fr`

### 2. I18nLink Component

A React component that renders internationalized links, automatically handling language-specific routes.

```tsx
<I18nLink to="products">Our Products</I18nLink>
```

Features:

-  Automatically uses the current language context
-  Supports explicit language override: `<I18nLink to="products" lang="fr">`
-  Handles route parameters
-  Falls back to regular links for external URLs

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

-  English routes: `{path}-en`
-  French routes: `{path}-fr`

This allows the `I18nLink` component to find the corresponding route in different languages.

### Utility Hooks

The module provides several utility hooks:

-  `useRoutes()`: Access all route configurations
-  `useRouteById(id)`: Find a specific route by ID
-  `useI18nNamespaces()`: Get i18n namespaces from current route matches

### Server-Side Support

For server-side route lookups in loaders and actions, use the utility functions directly:

-  `findRouteById(routes, id)`
-  `findRouteByPathname(routes, pathname)`
