// ESLint flat configuration (ESLint 9+), equivalent to the former .eslintrc.js.
import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import { withVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import prettierConfig from "@vue/eslint-config-prettier";

const production = process.env.NODE_ENV === "production";

export default withVueTs(
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },
  js.configs.recommended,
  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-console": production ? "warn" : "off",
      "no-debugger": production ? "error" : "off",
      "vue/multi-word-component-names": "off",
      // Vuetify data-table slot names contain dots (e.g. #item.username)
      "vue/valid-v-slot": ["error", { allowModifiers: true }],
    },
  },
  // Last, so that it overrides formatting rules of the configs above.
  prettierConfig,
);
