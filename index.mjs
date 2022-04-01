#! /usr/bin/env node

import {promises as fs} from 'fs';
import path from 'path';
import meow from 'meow';
import chalk from 'chalk';
import prompts from 'prompts';
import copyDir from 'copy-dir';
import {spawn} from 'child_process';
import {promisify} from 'util';
import {fileURLToPath} from 'node:url';

const cli = meow(`
  Usage

    $ npm init @soliantconsulting/react-app [app-name|-v|--version|-h|--help]
`, {
        booleanDefault: undefined,
        flags: {
            help: {
                type: 'boolean',
                alias: 'h',
            },
            version: {
                type: 'boolean',
                alias: 'v',
            },
        },
        importMeta: import.meta,
    },
);

const runCommand = async (cwd, command, args) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {cwd, stdio: 'inherit'});

        child.on('close', code => {
            if (code !== 0) {
                reject({command: `${command} ${args.join(' ')}`});
                return;
            }

            resolve();
        });
    });
};

const createRoot = async (root) => {
    try {
        await fs.stat(root);
        console.error(chalk.red('Directory already exists!'));
        process.exit(1);
    } catch {
        // No-op
    }

    await fs.mkdir(root, {recursive: true});
    await runCommand(root, 'git', ['init', '.']);
};

const asyncCopyDir = promisify(copyDir);

const extractTemplate = async (root, config) => {
    await asyncCopyDir(path.join(path.dirname(fileURLToPath(import.meta.url)), 'template'), root, {
        filter: (stat, filePath, filename) => {
            if (stat === 'directory' && (filename === 'node_modules') || filename === 'frameworks') {
                return false;
            }

            if (!config.useCdk && stat === 'directory' && filename === 'cdk') {
                return false;
            }

            if (!config.useSsm) {
                if (stat === 'file' && filename === 'ssm-config.json.dist') {
                    return false;
                }

                if (stat === 'file' && filePath.endsWith('util/config.ts')) {
                    return false;
                }
            }

            return true;
        },
        mode: true,
    });

    await asyncCopyDir(path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        'template',
        'frameworks',
        config.uiFramework
    ), path.join(root, 'src'), {mode: true});

    await fs.rename(path.join(root, '.gitignore.dist'), path.join(root, '.gitignore'));

    if (config.useCdk) {
        await fs.rename(path.join(root, 'cdk', '.npmignore.dist'), path.join(root, 'cdk', '.npmignore'));
        await fs.rename(path.join(root, 'cdk', '.gitignore.dist'), path.join(root, 'cdk', '.gitignore'));
    }
};

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const escapeReplacement = (string) => {
    return string.replace(/\$/g, '$$$$');
};

const replaceInFile = async (filename, tokens) => {
    let contents = await fs.readFile(filename, 'utf-8');

    for (const [token, value] of Object.entries(tokens)) {
        contents = contents.replace(new RegExp(escapeRegExp(token), 'g'), escapeReplacement(value));
    }

    await fs.writeFile(filename, contents);
};

const toggleBlock = async (filename, block, enabled) => {
    let contents = await fs.readFile(filename, 'utf-8');

    contents = contents.replace(
        new RegExp(`/\\* block:start:${block} \\*/(.*?)/\\* block:end:${block} \\*/`, 'gs'),
        (match, content) => enabled ? content : '',
    );

    await fs.writeFile(filename, contents);
};

const performReplacements = async (root, config) => {
    await replaceInFile(path.join(root, 'package.json'), {
        '~~name~~': config.appName,
        '~~description~~': config.description,
    });
    await replaceInFile(path.join(root, 'README.md'), {
        '{{ description }}': config.description,
    });
    await toggleBlock(path.join(root, 'README.md'), 'cdk', config.useCdk);
    await replaceInFile(path.join(root, 'index.html'), {
        '{{ description }}': config.description,
    });

    if (config.useCdk) {
        await replaceInFile(path.join(root, 'cdk', 'bin', 'cdk.ts'), {
            '{{ name }}': config.appName,
        });
        await replaceInFile(path.join(root, 'cdk', 'lib', 'cicd-stack.ts'), {
            '{{ name }}': config.appName,
        });
    } else {
        await replaceInFile(path.join(root, '.eslintignore'), {
            '/cdk\n': ''
        });
    }

    await toggleBlock(path.join(root, 'vite.config.ts'), 'bootstrap', config.uiFramework === 'bootstrap');
};

(async () => {
    let [appName] = cli.input;

    const config = await prompts([
        {
            type: 'text',
            name: 'appName',
            message: 'App Name?',
            initial: appName,
        },
        {
            type: 'text',
            name: 'description',
            message: 'Description?',
        },
        {
            type: 'toggle',
            name: 'useCdk',
            message: 'Use CDK?',
            initial: true,
        },
        {
            type: 'select',
            name: 'uiFramework',
            message: 'UI Framework?',
            choices: [
                {title: 'MUI', value: 'mui'},
                {title: 'Bootstrap', value: 'bootstrap'},
                {title: 'None', value: 'none'},
            ],
            initial: 0,
        },
    ]);

    console.log();
    console.log(chalk.blue('Create project…'));
    const root = path.resolve(config.appName);
    await createRoot(root);
    await extractTemplate(root, config);
    await performReplacements(root, config);

    console.log();
    console.log(chalk.blue('Install root packages…'));
    await runCommand(root, 'npm', ['install']);

    if (config.uiFramework !== 'none') {
        console.log();
        console.log(chalk.blue(`Install ${config.uiFramework} packages…`));
    }

    switch (config.uiFramework) {
        case 'mui':
            await runCommand(root, 'npm', [
                'install',
                '@mui/material',
                '@mui/icons-material',
                '@emotion/react',
                '@emotion/styled',
                '@fontsource/roboto'
            ]);
            break;

        case 'bootstrap':
            await runCommand(root, 'npm', [
                'install',
                'react-bootstrap',
                'react-bootstrap-icons',
                'bootstrap',
            ]);
            await runCommand(root, 'npm', [
                'install',
                '-D',
                'sass',
            ]);
            break;
    }

    if (config.useCdk) {
        console.log();
        console.log(chalk.blue('Install CDK packages…'));
        await runCommand(path.join(root, 'cdk'), 'npm', ['install']);
    } else {
        await replaceInFile(path.join(root, '.eslintignore'), {'/cdk\n': ''});
    }

    console.log();
    console.log(chalk.blue('Creating setup commit…'));
    await runCommand(root, 'git', ['add', '-A']);
    await runCommand(root, 'git', ['commit', '-am', 'feat: project setup']);

    console.log();
    console.log(chalk.green('Setup complete!'));

    if (config.useCdk) {
        console.log();
        console.log(chalk.yellow('CDK stack will required manual configuration.'));
        console.log(chalk.yellow('Check for @todo tags in the following files:'));
        console.log(chalk.yellow('  - cdk/bin/cdk.ts'));
        console.log(chalk.yellow('  - cdk/lib/cicd-stack.ts'));
        console.log(chalk.yellow('  - cdk/lib/cloudfront-stack.ts'));
    }
})();
