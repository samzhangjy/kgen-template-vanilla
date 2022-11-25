import { createFromTemplate, getPrompt, loadJSONConfig, mergeConfig } from '@kgen/core';
import * as url from 'url';
import * as path from 'path';

const eslintPackageJSONVanilla = {
  devDependencies: {
    eslint: '^7.32.0 || ^8.2.0',
    'eslint-config-airbnb-base': '^15.0.0',
    'eslint-config-airbnb-typescript': '^17.0.0',
    'eslint-plugin-import': '^2.25.2',
  },
};

const eslintPackageJSONTypeScript = {
  devDependencies: {
    ...eslintPackageJSONVanilla.devDependencies,
    '@typescript-eslint/eslint-plugin': '^5.42.0',
    '@typescript-eslint/parser': '^5.42.0',
  },
};

const prettierPackageJSON = {
  devDependencies: {
    'eslint-plugin-prettier': '^4.2.1',
    'eslint-config-prettier': '^8.5.0',
    prettier: '^2.7.1',
  },
};

const eslintWithPrettier = {
  extends: ['plugin:prettier/recommended'],
};

const generateVanilla = async () => {
  // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
  const __filename = url.fileURLToPath(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
  const __dirname = path.dirname(__filename);

  const answers = await getPrompt([
    {
      name: 'name',
      message: 'Project name?',
      type: 'text',
      validate: (answer) => (answer ? true : 'Please enter a valid name'),
    },
    {
      name: 'useTypescript',
      message: 'Use TypeScript for type-checking?',
      type: 'toggle',
      active: 'Yes',
      inactive: 'No',
      initial: false,
    },
    {
      name: 'useESLint',
      message: 'Use ESLint for code quality?',
      type: 'toggle',
      active: 'Yes',
      inactive: 'No',
      initial: true,
    },
    {
      name: 'usePrettier',
      message: 'Use Prettier for code style?',
      type: 'toggle',
      active: 'Yes',
      inactive: 'No',
      initial: true,
    },
  ]);

  const TEMPLATE_PATH = path.join(__dirname, '../template');
  let packageJSON = loadJSONConfig(
    path.join(TEMPLATE_PATH, answers.useTypescript ? 'package-ts.json' : 'package.json'),
  );
  let eslintConfig = loadJSONConfig(
    path.join(TEMPLATE_PATH, answers.useTypescript ? '.eslintrc-ts.json' : '.eslintrc.json'),
  );

  packageJSON.name = answers.name;

  if (answers.useESLint) {
    packageJSON = mergeConfig(
      packageJSON,
      answers.useTypescript ? eslintPackageJSONTypeScript : eslintPackageJSONVanilla,
    );
  }

  if (answers.usePrettier) {
    packageJSON = mergeConfig(packageJSON, prettierPackageJSON);
    eslintConfig = mergeConfig(eslintConfig, eslintWithPrettier);
  }

  createFromTemplate(answers.name, {
    template: TEMPLATE_PATH,
    ignore: [
      'package-ts.json',
      '.eslintrc-ts.json',
      ...(answers.useTypescript ? ['**/*.js'] : ['**/*.ts', 'tsconfig.json']),
      ...(!answers.useESLint ? ['.eslintrc.json', '.prettierrc.json'] : []),
    ],
    overrides: {
      'package.json': packageJSON,
      ...(answers.useESLint
        ? {
            '.eslintrc.json': eslintConfig,
          }
        : {}),
    },
  });
};

export default generateVanilla;
