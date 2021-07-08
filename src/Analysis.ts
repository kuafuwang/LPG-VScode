'use strict';

import { existsSync } from 'fs';
import * as path from 'path';
import { commands, ExtensionContext, Position, QuickPickItem, TextDocument, TextEditor, TextEditorEdit, Uri, window, workspace } from 'vscode';
import { FormattingOptions,  WorkspaceEdit, CreateFile, RenameFile, DeleteFile, TextDocumentEdit, CodeActionParams, SymbolInformation, TextDocumentPositionParams, TextDocumentIdentifier } from 'vscode-languageclient';
import { Commands, Commands as javaCommands } from './commands';
import {   CallGraphRequest, GetInlineNonTerminalRefactorRequest, GetMakeEmptyRefactorRequest, GetMakeLeftRecursiveRefactorRequest, GetNonEmptyRefactorRequest, RefactorWorkspaceEdit, RRD_AllRules_Request, RRD_SingleRule_Request} from './protocol';
import { LanguageClient } from 'vscode-languageclient/node';
import { getTextDocumentPositionParams } from './Utils';
import { LpgRailroadDiagramProvider } from './RailroadDiagramProvider';
import { LpgCallGraphProvider } from './CallGraphProvider';
export function registerCommands(languageClient: LanguageClient, context: ExtensionContext) {
    registerAnalysisCommand(languageClient, context);
}
function registerAnalysisCommand(languageClient: LanguageClient, context: ExtensionContext): void {
      // The call graph command.
   const callGraphProvider = new LpgCallGraphProvider(languageClient,context);
   context.subscriptions.push(commands.registerTextEditorCommand(Commands.LPG_CALL_GRAPH,
	   async (textEditor: TextEditor, edit: TextEditorEdit) => {
		const  result   = await   languageClient.sendRequest(
			CallGraphRequest.type, getTextDocumentPositionParams(languageClient));
			if (result.errorMessage) {
				window.showErrorMessage(result.errorMessage);
				return;
			}
		   callGraphProvider.graph = result.infos;
		   callGraphProvider.showWebview(textEditor, {
			   title: "Call Graph: " + path.basename(textEditor.document.fileName),
		   });
	   }),
   );
   const diagramProvider = new LpgRailroadDiagramProvider(languageClient,context);

   // The single RRD diagram command.
   context.subscriptions.push(commands.registerTextEditorCommand(Commands.LPG_RRD_SINGLE_RULE,
	async  (textEditor: TextEditor, edit: TextEditorEdit) => {

		const  result   = await   languageClient.sendRequest(RRD_SingleRule_Request.type, 
			getTextDocumentPositionParams(languageClient) );
		if (result.errorMessage) {
			window.showErrorMessage(result.errorMessage);
			return;
		}
		diagramProvider.symbols = result.infos;
		diagramProvider.showWebview(textEditor, {
			   title: "RRD: " + path.basename(textEditor.document.fileName),
			   fullList: false,
		   });
	   }),
   );

   // The full RRD diagram command.
   context.subscriptions.push(commands.registerTextEditorCommand(Commands.LPG_RRD_ALL_RULE,
   async  (textEditor: TextEditor, edit: TextEditorEdit) => {
	const textDocument : TextDocumentIdentifier = {
		uri : window.activeTextEditor.document.uri.toString()
	};
	const  result   = await   languageClient.sendRequest(RRD_AllRules_Request.type, textDocument );
    if (result.errorMessage) {
        window.showErrorMessage(result.errorMessage);
        return;
    }
	diagramProvider.symbols = result.infos;
	diagramProvider.showWebview(textEditor, {
			   title: "RRD: " + path.basename(textEditor.document.fileName),
			   fullList: true,
		   });
	   }),

   );
}