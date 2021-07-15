import * as child_process from "child_process";
import * as path from "path";

import * as fs from "fs-extra";
import { TextDocument } from "vscode";
import { workspace } from "vscode";
import { window } from "vscode";
import { ProgressIndicator } from "./ProgressIndicator";
import { OutputInfoCollector } from "./extension";
import { Constant } from "./commands";
import { isLinux, isWindows } from "./Utils";
import glob = require("glob");


const expandHomeDir = require("expand-home-dir");
/**
 * Options used by the parser files generation.
 */

 export interface GenerationOptions {
 
    // The folder in which to run the generation process. Should be an absolute path for predictable results.
    // Used internally only.
    baseDir?: string;

    // Search template  path for the LPG tool.
    template_search_directory?: string;

    // Search inlcude  path for the LPG tool.
    include_search_directory?: string;

    // The folder where to place generated files in (relative to baseDir or absolute) (default: grammar dir),
    outputDir?: string;

    // Package or namespace name for generated files (default: none).
    package?: string;

    // The target language for the generated files. (default: what's given in the grammar or Java).
    language?: string;

    // Generate visitor files if set (default: false).
    visitor?: string;

    trace?: string;
    quiet?: boolean;
    verbose?: boolean;

    // Use this jar for work instead of the built-in one(s).
    alternativeExe?: string;



    // Any additional parameter you want to send to LPG for generation (e.g. "-lalr=3").
    additionalParameters?: string;
}
// iterate through symbolic links until file is found
async function findLinkedFile(file: string): Promise<string> {
    if (!await fs.pathExists(file) || !(await fs.lstat(file)).isSymbolicLink()) {
        return file;
    }
    return await findLinkedFile(await fs.readlink(file));
}
async function fromEnv(name: string): Promise<string[]> {
    const ret: string[] = [];
    if (process.env[name]) {
        const dir = expandHomeDir(process.env[name]);
        if (dir) {
            ret.push(dir);
        }
    }
    return ret;
}

export function GetGenerationOptions(basePath: string | undefined, outputDir : string | undefined):GenerationOptions
{
    const config = workspace.getConfiguration(Constant.LPG_GENERATION);
    const options: GenerationOptions = {
        baseDir: basePath,
        include_search_directory: config.include_search_directory as string,
        outputDir,
        language : config.language as string,
        package : config.package as string,    
        visitor : config.visitor as string,
        trace: config.trace as string,
        quiet: config.quiet as boolean,
        verbose: config.verbose as boolean,
        alternativeExe: config.alternativeExe as string,
        additionalParameters: config.additionalParameters as string,
    };
    return options;
}
    /**
     * For certain services we have to (re)generate files from grammars in the background:
     * - syntactic + semantic grammar analysis by the ANTLR tool
     * - generate interpreter data (for debugging + ATN views)
     *
     * @param document For which to generate the data.
     */
   export  function regenerateParser(document: TextDocument,
        progress : ProgressIndicator,
        outputChannel:OutputInfoCollector): void 
        {
        const config = workspace.getConfiguration(Constant.LPG_GENERATION);
        if (config.mode === "none") {
            return;
        }

        const grammarFileName = document.uri.fsPath;
    
        const externalMode = config.mode === "external";
         
        progress.startAnimation();
        const basePath = path.dirname(document.fileName);
    

        // In internal mode we generate files with the default target language into our .antlr folder.
        // In external mode the files are generated into the given output folder (or the folder where the
        // main grammar is). In this case we have to move the interpreter data to our .antlr folder.
        let outputDir = path.join(basePath, ".lpg");
        if (externalMode) {
            outputDir = config.outputDir as string;
            if (!outputDir) {
                outputDir = basePath;
            } else {
                if (!path.isAbsolute(outputDir)) {
                    outputDir = path.join(basePath, outputDir);
                }
            }
        }

        try {
            fs.ensureDirSync(outputDir);
        } catch (error) {
            progress.stopAnimation();
            void window.showErrorMessage("Cannot create output folder: " + (error as string));

            return;
        }
      
        const options= GetGenerationOptions(basePath,outputDir);
        
        const result = generate(grammarFileName, options);
        result.then((out_strings: string[]) => {
            for (const str of out_strings) {
                outputChannel.appendLine(str)   
            }
            progress.stopAnimation();
            window.showInformationMessage("Generate parser for " + grammarFileName + " has done.")
        }).catch((reason) => {
            progress.stopAnimation();
            outputChannel.appendLine(reason);
            outputChannel.show(true);
            window.showInformationMessage("Generate parser for " + grammarFileName + " failed, reson :"+ reason);
        });
    }
    
    export function get_server_path(): string[]
    {
        let exeHome: string ;
        if (isWindows) {
            exeHome = path.resolve(__dirname, '../server/win');
        
        } else if(isLinux) {
            exeHome =   path.resolve(__dirname, '../server/linux');
        }
        else{
            exeHome =  path.resolve(__dirname, '../server/mac');
        }
        
        const launchersFound: Array<string> = glob.sync('**/LPG-language-server*', 
        { cwd: exeHome });
        if (launchersFound.length) {
            return [(path.resolve(exeHome, launchersFound[0])),exeHome] ;
        } else {
            return  ["",exeHome] ;
        }
    }
    function get_lpg_generator_path(): string | undefined
    {
        let serverHome: string ;
        if (isWindows) {
            serverHome = path.resolve(__dirname, '../lpg/win');
        
        } else if(isLinux) {
            serverHome =   path.resolve(__dirname, '../lpg/linux');
        }
        else{
            serverHome =  path.resolve(__dirname, '../lpg/mac');
        }
        
        const launchersFound: Array<string> = glob.sync('**/lpg-v*', 
        { cwd: serverHome });
        if (launchersFound.length) {
            return  (path.resolve(serverHome, launchersFound[0]));
        } else {
            return  null;
        }
    }
    function generate(fileName : string,options: GenerationOptions): Promise<string[]> 
 {
    return new Promise<string[]>((resolve, reject) => {
       
        let  cmd_string : string;
        if (options.alternativeExe) {
            cmd_string= (options.alternativeExe);
        } else {
            cmd_string = get_lpg_generator_path();
        }
        if (! fs.pathExistsSync(cmd_string) ){
            reject(cmd_string + " didn't exist.")
            return
        }
        const parameters = [];
        if (options.language) {
            parameters.push("-programming_language=" + options.language);
        }
        if (options.quiet) {
            parameters.push("-quiet");
        }
        if (options.package) {
            parameters.push("-package="+ options.package);
        }
        if (options.verbose) {
            parameters.push("-verbose");
        }
        if (options.visitor) {
            parameters.push("-visitor=" + options.visitor);
        }
        if (options.trace) {
            parameters.push("-trace=" + options.trace);
        } 

        if (options.include_search_directory) {
            parameters.push("-include-directory=" + options.include_search_directory);
        }

        if (options.outputDir) {
            parameters.push("-out_directory=" +options.outputDir);
        
        }

        if (options.additionalParameters) {
            parameters.push(options.additionalParameters);
        }

        
      
        parameters.push(fileName);

        const spawnOptions = { cwd: options.baseDir ? options.baseDir : undefined };
        const lpg_process = child_process.spawn(cmd_string, parameters, spawnOptions);

        const outputList: string[] = [];
        lpg_process.stderr.on("data", (data) => {
            let text = data.toString() as string;
            if (text.startsWith("Picked up _JAVA_OPTIONS:")) {
                const endOfInfo = text.indexOf("\n");
                if (endOfInfo === -1) {
                    text = "";
                } else {
                    text = text.substr(endOfInfo + 1, text.length);
                }
            }
            if (text.length > 0) {
                outputList.push(text);
            }
        });
        lpg_process.stdout.on("data",(data)=>{
            let text = data.toString() as string;
            outputList.push(text);
        })
        lpg_process.on("close", (code) => {
            resolve(outputList); // Treat this as non-grammar output (e.g. Java exception).
        });
    });
}
