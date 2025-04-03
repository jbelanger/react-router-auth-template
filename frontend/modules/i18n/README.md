# i18n Module Documentation

This module helps you build websites that work in both English and French. It has two main parts that work together:

## 1. Translation Module (`src/i18n`)

This part handles all the text translation needs:

- **Works everywhere**:
  - In the browser: Detects user's language and loads the right translations
  - On the server: Loads translations from files and works with server rendering

- **What it does**:
  - Shows content in English or French
  - Loads translations as needed
  - Makes sure translations are correct (with TypeScript)
  - Figures out which language to use
  - Works with server-side rendering

[Full Translation Guide →](src/i18n/README.md)

## 2. URL Management (`src/routing`)

This part handles website addresses (URLs) in both languages:

- **Main Tools**:
  - `i18nRoute`: Turns `/products` into both `/products` (English) and `/produits` (French)
  - `I18nLink`: Creates links that switch between languages automatically
  - `I18nRoutesProvider`: Makes language tools available throughout your app

- **What it does**:
  - Creates matching URLs in both languages (e.g., `/about` and `/a-propos`)
  - Switches URLs when changing languages
  - Handles URL parameters in both languages
  - Makes sure all URLs are valid

For example, it lets you create pages that are available at both:
- English: `www.example.com/products/chairs`
- French: `www.example.com/produits/chaises`

[Full URL Management Guide →](src/routing/README.md)
