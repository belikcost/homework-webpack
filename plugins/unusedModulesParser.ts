import { Compilation, Compiler, Module } from "webpack";
import path from "path";
import { glob } from "glob";
import * as fs from "fs";


interface Options {
    dir: string,
    exceptions?: string[]
    extensions?: string[],
    outputFile?: string,
}

class UnusedModulesParser {
    options: Options;
    used: string[];
    exist: string[];

    static initialOptions = {
        outputFile: 'unused',
        extensions: ['.*']
    };

    constructor(options: Options) {
        this.options = {
            ...UnusedModulesParser.initialOptions,
            ...options,
        };
        this.used = [];
        this.exist = []
    }

    useFinishModules(compilation: Compilation): Promise<Iterable<Module>> {
        return new Promise(resolve => {
            compilation.hooks.finishModules.tap(UnusedModulesParser.name, (modules) => {
                resolve(modules);
            });
        });
    }

    useThisCompilation(compiler: Compiler): Promise<Compilation> {
        return new Promise(resolve => {
            compiler.hooks.thisCompilation.tap(UnusedModulesParser.name, (compilation) => {
                resolve(compilation);
            });
        })
    }

    getFilesByExt(dir: string, extensions: string[], exceptions?: string[]): Promise<string[]> {
        return new Promise(resolve => {
            const ignorePattern = `${dir}/**/@(*${exceptions.join('|*')})`;
            const matchPattern = `${dir}/**/@(*${extensions.join('|*')})`;

            glob(matchPattern, { ignore: ignorePattern }, (err, files) => {
                resolve(files);
            });
        });
    }

    async getUsed(compiler: Compiler) {
        const result: string[] = [];

        await this.useThisCompilation(compiler).then(async compilation => {
            await this.useFinishModules(compilation).then((modules) => {
                new Set(modules).forEach((module: Module & { resource: string }) => {
                    const path = module.resource;
                    if (path) {
                        result.push(path);
                    }
                });
            })
        });

        return result;
    }

    getExist(): Promise<string[]> {
        return new Promise(resolve => {
            const { dir, extensions, exceptions } = this.options;

            this.getFilesByExt(dir, extensions, exceptions).then(files => {
                const filesWithAbsPath = files.map(file => path.resolve(file));
                resolve(filesWithAbsPath);
            });
        })
    }

    getUnused() {
        return [...this.exist].filter(path => {
            if (this.used.indexOf(path) === -1) {
                return path;
            }
        });
    }

    async apply(compiler: Compiler) {
        await this.getUsed(compiler).then(result => {
            this.used = result;
        });
        await this.getExist().then(result => {
            this.exist = result;
        });

        const unused = this.getUnused();
        const data = JSON.stringify(unused);
        fs.writeFile(this.options.outputFile, data, null, () => {
        });
    }
}

export default UnusedModulesParser;