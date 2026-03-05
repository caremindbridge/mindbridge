/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', '@mindbridge/eslint-config'],
  parserOptions: {
    project: true,
  },
};
