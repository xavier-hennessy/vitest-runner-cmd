import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const runVitest = vscode.commands.registerCommand(
        'vitest-runner-cmd.runVitest',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found.');
                return;
            }

            const document = editor.document;
            const filePath = document.fileName;
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found.');
                return;
            }

            const testName = findTestName(editor);
            const command = buildVitestCommand(filePath, testName);

            // Find existing terminal or create a new one
            let terminal = vscode.window.terminals.find(t => t.name === 'Vitest');
            if (!terminal) {
                terminal = vscode.window.createTerminal('Vitest');
            }
            terminal.show();
            terminal.sendText(command);
        }
    );

    context.subscriptions.push(runVitest);
}

export function deactivate() {}

function findTestName(editor: vscode.TextEditor): string | undefined {
    const { selection, document } = editor;

    if (!selection.isEmpty) {
        return document.getText(selection);
    }

    const selectedLine = selection.active.line + 1;
    const lines = document.getText().split('\n');
    for (let i = selectedLine - 1; i >= 0; i--) {
        if (/^\s*(describe|test)\s*\(/.test(lines[i])) {
            const match = lines[i].match(/['"`](.*?)['"`]/);
            if (match) {
                return match[1];
            }
        }
    }

    return undefined;
}

function buildVitestCommand(filePath: string, testName?: string): string {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const normalizedPath = path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
    const baseCommand = `npx vitest run ${normalizedPath}`;
    return testName ? `${baseCommand} -t '${testName}'` : baseCommand;
}