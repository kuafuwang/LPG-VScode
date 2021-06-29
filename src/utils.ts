'use strict';
import * as fs from "fs-extra";
import * as path from 'path';
import { workspace, WorkspaceConfiguration, TextDocument, ExtensionContext, Uri, window, Webview } from 'vscode';

export function getJavaConfiguration(): WorkspaceConfiguration {
	return workspace.getConfiguration('java');
}



export function deleteDirectory(dir : string) {
	if (fs.existsSync(dir)) {
		fs.readdirSync(dir).forEach((child) => {
			const entry = path.join(dir, child);
			if (fs.lstatSync(entry).isDirectory()) {
				deleteDirectory(entry);
			} else {
				fs.unlinkSync(entry);
			}
		});
		fs.rmdirSync(dir);
	}
}

export function getTimestamp(file :string) {
	if (!fs.existsSync(file)) {
		return -1;
	}
	const stat = fs.statSync(file);
	return stat.mtimeMs;
}

export function ensureExists(folder : string) {
	if (!fs.existsSync(folder)) {
		fs.mkdirSync(folder);
	}
}

export function getInclusionPatternsFromNegatedExclusion(): string[] {
	const config = getJavaConfiguration();
	const exclusions: string[] = config.get<string[]>("import.exclusions", []);
	const patterns: string[] = [];
	for (const exclusion of exclusions) {
		if (exclusion.startsWith("!")) {
			patterns.push(exclusion.substr(1));
		}
	}
	return patterns;
}

export function convertToGlob(filePatterns: string[], basePatterns?: string[]): string {
	if (!filePatterns || filePatterns.length === 0) {
		return "";
	}

	if (!basePatterns || basePatterns.length === 0) {
		return parseToStringGlob(filePatterns);
	}

	const patterns: string[] = [];
	for (const basePattern of basePatterns) {
		for (const filePattern of filePatterns) {
			patterns.push(path.join(basePattern, `/${filePattern}`).replace(/\\/g, "/"));
		}
	}
	return parseToStringGlob(patterns);
}

export function getExclusionBlob(): string {
	const config = getJavaConfiguration();
	const exclusions: string[] = config.get<string[]>("import.exclusions", []);
	const patterns: string[] = [];
	for (const exclusion of exclusions) {
		if (exclusion.startsWith("!")) {
			continue;
		}

		patterns.push(exclusion);
	}
	return parseToStringGlob(patterns);
}

function parseToStringGlob(patterns: string[]): string {
	if (!patterns || patterns.length === 0) {
		return "";
	}

	return `{${patterns.join(",")}}`;
}

export async function waitForDocumentChangesToEnd(document: TextDocument): Promise<void> {
	let version = document.version;
	return new Promise((resolve) => {
		const iv = setInterval(() => {
			if (document.version === version) {
				clearInterval(iv);
				resolve();
			}
			version = document.version;
		}, 400);
	});
}

export class Utils {

    /**
     * Asks the user for a file to store the given data in. Checks if the file already exists and ask for permission to
     * overwrite it, if so. Also copies a number extra files to the target folder.
     *
     * @param fileName A default file name the user can change, if wanted.
     * @param filters The file type filter as used in showSaveDialog.
     * @param data The data to write.
     * @param extraFiles Files to copy to the target folder (e.g. css).
     */
	 public static exportDataWithConfirmation(fileName: string, filters: { [name: string]: string[] }, data: string,
        extraFiles: string[]): void {
        void window.showSaveDialog({
            defaultUri: Uri.file(fileName),
            filters,
        }).then((uri: Uri | undefined) => {
            if (uri) {
                const value = uri.fsPath;
                fs.writeFile(value, data, (error) => {
                    if (error) {
                        void window.showErrorMessage("Could not write to file: " + value + ": " + error.message);
                    } else {
                        this.copyFilesIfNewer(extraFiles, path.dirname(value));
                        void window.showInformationMessage("Diagram successfully written to file '" + value + "'.");
                    }
                });
            }
        });
    }
    /**
     * Copies all given files to the specified target folder if they don't already exist there
     * or are older than the source files.
     *
     * @param files A list of paths for files to be copied.
     * @param targetPath The target path of the copy operation.
     */
	 public static copyFilesIfNewer(files: string[], targetPath: string): void {
        try {
            fs.ensureDirSync(targetPath);
        } catch (error) {
            void window.showErrorMessage("Could not create target folder '" + targetPath + "'. " + error);
        }

        for (const file of files) {
            try {
                let canCopy = true;
                const targetFile = path.join(targetPath, path.basename(file));
                if (fs.existsSync(targetFile)) {
                    const sourceStat = fs.statSync(file);
                    const targetStat = fs.statSync(targetFile);
                    canCopy = targetStat.mtime < sourceStat.mtime;
                }

                if (canCopy) {
                    void fs.copy(file, targetFile, { overwrite: true });
                }
            } catch (error) {
                void window.showErrorMessage("Could not copy file '" + file + "'. " + error);
            }
        }
    }

    /**
     * Returns the absolute path to a file located in our misc folder.
     *
     * @param file The base file name.
     * @param context The context of this extension to get its path regardless where it is installed.
     * @param webView When given format the path for use in this webview.
     * @returns The computed path.
     */
    public static getMiscPath(file: string, context: ExtensionContext, webView?: Webview): string {
        if (webView) {
            const uri = Uri.file(context.asAbsolutePath(path.join("misc", file)));

            return webView.asWebviewUri(uri).toString();
        }

        return context.asAbsolutePath(path.join("misc", file));
    }

    /**
     * Returns the absolute path to a file located in the node_modules folder.
     *
     * @param file The base file name.
     * @param context The context of this extension to get its path regardless where it is installed.
     *
     * @returns The computed path.
     */
    public static getNodeModulesPath(file: string, context: ExtensionContext): string {
        return Uri.file(context.asAbsolutePath(path.join("node_modules", file)))
            .with({ scheme: "vscode-resource" }).toString();
    }

    public static isAbsolute(p: string): boolean {
        return path.normalize(p + "/") === path.normalize(path.resolve(p) + "/");
    }

    public static deleteFolderRecursive(target: string): void {
        let files = [];
        if (fs.existsSync(target)) {
            files = fs.readdirSync(target);
            files.forEach((file) => {
                const curPath = path.join(target, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    Utils.deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(target);
        }
    }

}
