# OHMS UI - React + TypeScript + Vite

This is the frontend UI for the OHMS (Open Human-Machine System) project, built with React, TypeScript, and Vite. The application is designed to be deployed on the Internet Computer (ICP) as a decentralized frontend.

## Features

- 🚀 **React 19** with TypeScript
- ⚡ **Vite** for fast development and building
- 🌐 **Internet Computer** deployment ready
- 🎨 **Tailwind CSS** for styling
- 🔗 **DFX** integration for ICP deployment
- 🎯 **Particle effects** with tsparticles

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Internet Computer Deployment

For detailed ICP deployment instructions, see [README-ICP.md](./README-ICP.md).

**Quick deployment:**
```bash
# Install dfx (if not already installed)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Deploy to local network
dfx start --clean
npm run dfx:build
dfx deploy --network local

# Deploy to IC mainnet
dfx deploy --network ic
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run dfx:start` - Start local dfx replica
- `npm run dfx:deploy:local` - Deploy to local network
- `npm run dfx:deploy:ic` - Deploy to IC mainnet
- `npm run dfx:build` - Build and prepare for dfx deployment

## Plugins

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
