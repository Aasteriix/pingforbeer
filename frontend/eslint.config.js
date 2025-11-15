// frontend/eslint.config.js
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";



export default [
  {
    files: ["src/**/*.{js,jsx}"],
    ignores: ["dist/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        alert: "readonly",
        confirm: "readonly",
        console: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
   rules: {
  // base JS rules
  ...js.configs.recommended.rules,
  // React rules
  ...react.configs.recommended.rules,
  // React hooks rules
  ...reactHooks.configs.recommended.rules,

  // We don't use PropTypes in this project
  "react/prop-types": "off",

  // New JSX transform: no need for `import React` in scope
  "react/react-in-jsx-scope": "off",

  // For now, don’t be strict about deps in useEffect
  "react-hooks/exhaustive-deps": "off",
},

  },
];
