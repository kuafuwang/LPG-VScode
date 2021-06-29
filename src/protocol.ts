'use strict';
import {
    CodeActionParams,
    Command,
    ExecuteCommandParams,
    FormattingOptions,
    Location,
    MessageType,
    NotificationType,
    RequestType,
    SymbolInformation,
    TextDocumentIdentifier,
    TextDocumentPositionParams,
    WorkspaceEdit,
    WorkspaceSymbolParams,
} from 'vscode-languageclient';


export interface StatusReport {
	message: string;
	type: string;
}

export interface ProgressReport {
	id: string;
	task: string;
	subTask: string;
	status: string;
	workDone: number;
	totalWork: number;
	complete: boolean;
}
export interface ReferenceNodeInfo {
    rules: Array<string>;
    terminal: Array<string>;

}
export interface ActionableMessage {
	severity: MessageType;
	message: string;
	data?: any;
	commands?: Command[];
}

export interface ActionableMessage {
	severity: MessageType;
	message: string;
	data?: any;
	commands?: Command[];
}
export interface RefactorWorkspaceEdit {
    edit: WorkspaceEdit;
    command?: Command;
    errorMessage?: string;
}

export namespace StatusNotification {
	export const type = new NotificationType<StatusReport >('language/status');
}

export namespace ProgressReportNotification {
	export const type = new NotificationType<ProgressReport >('language/progressReport');
}
export namespace ActionableNotification {
    export const type = new NotificationType<ActionableMessage>('language/actionableNotification');
}

export namespace GetNonEmptyRefactorRequest {
    export const type = new RequestType<TextDocumentPositionParams, RefactorWorkspaceEdit, void>('lpg/MakeNonEmpty');
}

export namespace GetMakeEmptyRefactorRequest {
    export const type = new RequestType<TextDocumentPositionParams, RefactorWorkspaceEdit, void>('lpg/makeEmpty');
}
export namespace GetMakeLeftRecursiveRefactorRequest {
    export const type = new RequestType<TextDocumentPositionParams, RefactorWorkspaceEdit, void>('lpg/MakeLeftRecursive');
}
export namespace GetInlineNonTerminalRefactorRequest {
    export const type = new RequestType<TextDocumentPositionParams, RefactorWorkspaceEdit, void>('lpg/inlineNonTerminal');
}