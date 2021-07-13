import * as child_process from "child_process";
import * as path from "path";

import * as fs from "fs-extra";
import { TextDocument } from "vscode";
import { workspace } from "vscode";
import { window } from "vscode";
import { ProgressIndicator } from "./ProgressIndicator";
import { OutputInfoCollector } from "./extension";
let  LPG_GENERATION = "lgp.generation";
const isWindows: boolean = process.platform.indexOf("win") === 0;
const isMac: boolean = process.platform.indexOf("darwin") === 0;
const isLinux: boolean = process.platform.indexOf("linux") === 0;
const expandHomeDir = require("expand-home-dir");
/**
 * Options used by the parser files generation.
 */
 export interface GenerationOptions {
    // The folder in which to run the generation process. Should be an absolute path for predictable results.
    // Used internally only.
    baseDir?: string;

    // Search path for the ANTLR tool.
    includeDir?: string;

    // The folder where to place generated files in (relative to baseDir or absolute) (default: grammar dir),
    outputDir?: string;

    // Package or namespace name for generated files (default: none).
    package?: string;

    // The target language for the generated files. (default: what's given in the grammar or Java).
    language?: string;

    // Generate visitor files if set (default: false).
    visitor?: string;


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
        if (workspace.getConfiguration(LPG_GENERATION).mode === "none") {
            return;
        }
        const grammarFileName = document.uri.fsPath;
    
        const externalMode = workspace.getConfiguration(LPG_GENERATION).mode === "external";
         
        progress.startAnimation();
        const basePath = path.dirname(document.fileName);
       

        // In internal mode we generate files with the default target language into our .antlr folder.
        // In external mode the files are generated into the given output folder (or the folder where the
        // main grammar is). In this case we have to move the interpreter data to our .antlr folder.
        let outputDir = path.join(basePath, ".lpg");
        if (externalMode) {
            outputDir = workspace.getConfiguration(LPG_GENERATION).outputDir as string;
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

        const options: GenerationOptions = {
            baseDir: basePath,
            includeDir: workspace.getConfiguration(LPG_GENERATION).includeDir as string,
            outputDir,
            language : workspace.getConfiguration(LPG_GENERATION).language as string,
            package : workspace.getConfiguration(LPG_GENERATION).package as string,    
            visitor : workspace.getConfiguration(LPG_GENERATION).visitor as string,
            alternativeExe: workspace.getConfiguration(LPG_GENERATION).alternativeExe as string,
            additionalParameters: workspace.getConfiguration(LPG_GENERATION).additionalParameters as string,
        };

        const result = generate(grammarFileName, options);
        result.then((out_strings: string[]) => {
            for (const str of out_strings) {
                outputChannel.appendLine(str)   
            }
            progress.stopAnimation();
        }).catch((reason) => {
            progress.stopAnimation();
            outputChannel.appendLine(reason);
            outputChannel.show(true);
        });
    }
    
    function generate(fileName : string,options: GenerationOptions): Promise<string[]> 
 {
    return new Promise<string[]>((resolve, reject) => {
       
        let  cmd_string : string;
        if (options.alternativeExe) {
            cmd_string= (options.alternativeExe);
        } else {
            if (isWindows) {
                cmd_string=(path.join(__dirname,
                    "../lpg/lpg.exe"));
            } else {
                cmd_string= (path.join(__dirname,
                    "../lpg/lpg"));
            }
        }
        if (! fs.pathExistsSync(cmd_string) ){
            reject(cmd_string + " didn't exist.")
            return
        }
        const parameters = [];
        if (options.language) {
            parameters.push("-programming_language=" + options.language);
        }

        if (options.includeDir) {
            parameters.push("-include-directory=" + options.includeDir);
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
