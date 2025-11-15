const js = require("@eslint/js");
const reactPlugin = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [
  {
    ignores: ["dist/**"],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
globals: {
  window: "readonly",
  document: "readonly",
  console: "readonly",
  fetch: "readonly",
  localStorage: "readonly",
  alert: "readonly",
  confirm: "readonly",
},

    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      // Base JS rules
      ...js.configs.recommended.rules,
      // React recommended
      ...reactPlugin.configs.recommended.rules,
      // React hooks recommended
      ...reactHooks.configs.recommended.rules,

      // Vite/React 17+ doesn't need React in scope
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
