const { defineConfig } = require("@vue/cli-service");

// Default of src/config.ts, also needed by public/index.html.
process.env.VUE_APP_DTOOL_LOOKUP_SERVER_URL ||= "http://localhost:5000";
module.exports = defineConfig({
  transpileDependencies: true,
});
