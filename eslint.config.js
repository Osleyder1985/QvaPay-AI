export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.js", "**/*.ts"],
    rules: {
      "no-console": "error",
      "no-unused-vars": "off",
    },
  },
];
