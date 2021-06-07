import * as vscode from 'vscode';
import * as net from 'net';
import * as path from 'path';

import *  as vscodelc  from 'vscode-languageclient/node';


import { ExtensionContext, languages, DocumentSymbolProvider, TextDocument, CancellationToken, SymbolInformation, DocumentSymbol, TextDocumentContentProvider, workspace, Uri, Event, HoverProvider, Position, Hover } from "vscode";
import { SymbolInformation as clientSymbolInformation, DocumentSymbol as clientDocumentSymbol,
       LanguageClientOptions, Position as LSPosition, Location as LSLocation, MessageType, TextDocumentPositionParams } from "vscode-languageclient";
/**
 * Method to get workspace configuration option
 * @param option name of the option (e.g. for antlr.path should be path)
 * @param defaultValue default value to return if option is not set
 */
function getConfig<T>(option: string, defaultValue?: any): T
{
    const config = vscode.workspace.getConfiguration('antlr');
    return config.get<T>(option, defaultValue);
}

var client: vscodelc.LanguageClient;

class FileStatus
{
    private statuses = new Map<string, any>();
    private readonly statusBarItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
        
    onFileUpdated(fileStatus: any)
    {
        const filePath = vscode.Uri.parse(fileStatus.uri);
        this.statuses.set(filePath.fsPath, fileStatus);
        this.updateStatus();
    }

    updateStatus()
    {
     
      //  const path = vscode.window.activeTextEditor.document.fileName;
      //  const status = this.statuses.get(path);
     //   if (!status)
     //   {
      //      this.statusBarItem.hide();
       //     return;
      //  }
       // this.statusBarItem.text = `antlr: ` + status.state;
       // this.statusBarItem.show();
    }

    clear()
    {
        this.statuses.clear();
        this.statusBarItem.hide();
    }

    dispose()
    {
        this.statusBarItem.dispose();
    }
}



export function activate(context: vscode.ExtensionContext)
{
/*
    var fn = __dirname + '/../Server/lpgServer.exe';
    let server: vscodelc.Executable =
    {
        command: fn,
        args: [],
        options: { shell: false, detached: false }
    };
*/
    let server = () => {
        const socket = net.connect(9333);
        const result: vscodelc.StreamInfo = {
            writer: socket,
            reader: socket
        };
        return Promise.resolve(result);
    };
    const serverOptions: vscodelc.ServerOptions = server;

    let clientOptions: vscodelc.LanguageClientOptions =
    {
        // Register the server for plain text documents
        documentSelector: [
            {scheme: 'file', language: 'lpg2'},
           
        ]
    };

    client = new vscodelc.LanguageClient('LPG Language Server', serverOptions, clientOptions);

    client.registerProposedFeatures();
    
    console.log('LPG Language Server is now active!');
    client.start();
}

export function deactivate(): Thenable<void> | undefined
{
    if (!client)
    {
        return undefined;
    }
    return client.stop();
}