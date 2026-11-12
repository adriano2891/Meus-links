import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'extension/**/*', 'public/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
