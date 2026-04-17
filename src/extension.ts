import * as vscode from 'vscode';

const COMMAND_ID = 'wrapColumn.set';
const PRESET_KEYS = ['preset1', 'preset2', 'preset3', 'preset4', 'preset5'] as const;
const CC_KEYS = ['charsPerLine1', 'charsPerLine2', 'charsPerLine3', 'charsPerLine4', 'charsPerLine5'] as const;
const SUPPORTED_EXTENSIONS = ['.txt', '.md'];
const STATUS_BAR_PRIORITY = 100;
const DEFAULT_FULLWIDTH_RATIO = 2.0;

function getFullwidthRatio(): number {
    const config = vscode.workspace.getConfiguration('cursorWrapChanger');
    const value = config.get<number>('fullwidthRatio', DEFAULT_FULLWIDTH_RATIO);
    if (typeof value !== 'number' || !isFinite(value) || value <= 0) {
        return DEFAULT_FULLWIDTH_RATIO;
    }
    return value;
}

function readSlots(section: string, keys: readonly string[]): number[] {
    const config = vscode.workspace.getConfiguration(section);
    const values: number[] = [];
    for (const key of keys) {
        const v = config.get<number>(key, 0);
        if (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 999) {
            values.push(v);
        }
    }
    return values;
}

function getPresets(): number[] {
    const own = readSlots('cursorWrapChanger', PRESET_KEYS);
    if (own.length > 0) {
        return own;
    }
    return readSlots('characterCount', CC_KEYS);
}

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext): void {
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        STATUS_BAR_PRIORITY
    );
    statusBarItem.command = COMMAND_ID;
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_ID, runWrapColumnSet)
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => updateStatusBar())
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (
                e.affectsConfiguration('editor.wordWrap') ||
                e.affectsConfiguration('editor.wordWrapColumn') ||
                e.affectsConfiguration('cursorWrapChanger.fullwidthRatio')
            ) {
                updateStatusBar();
            }
        })
    );

    updateStatusBar();
}

export function deactivate(): void {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

async function runWrapColumnSet(): Promise<void> {
    const presets = getPresets();

    if (presets.length === 0) {
        const action = await vscode.window.showInformationMessage(
            'プリセットが未設定です。設定画面を開きますか？',
            '設定を開く'
        );
        if (action === '設定を開く') {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'cursorWrapChanger.preset1'
            );
        }
        return;
    }

    const picked = await showPresetQuickPick(presets);
    if (picked === undefined) {
        return;
    }

    await applyWrapValue(picked);
}

interface PresetQuickPickItem extends vscode.QuickPickItem {
    value: number;
}

async function showPresetQuickPick(presets: number[]): Promise<number | undefined> {
    const items: PresetQuickPickItem[] = [
        ...presets.map((w) => ({
            label: `${w}W`,
            value: w,
        })),
        {
            label: '解除（0）',
            value: 0,
        },
    ];

    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'プリセットを選択（全角換算W単位）',
    });

    return picked?.value;
}

async function applyWrapValue(w: number): Promise<void> {
    const editorConfig = vscode.workspace.getConfiguration('editor');

    if (w === 0) {
        await editorConfig.update(
            'wordWrap',
            'on',
            vscode.ConfigurationTarget.Global
        );
        await editorConfig.update(
            'wordWrapColumn',
            undefined,
            vscode.ConfigurationTarget.Global
        );
        await editorConfig.update(
            'rulers',
            [],
            vscode.ConfigurationTarget.Global
        );
    } else {
        const ratio = getFullwidthRatio();
        const column = Math.round(w * ratio);
        await editorConfig.update(
            'wordWrap',
            'wordWrapColumn',
            vscode.ConfigurationTarget.Global
        );
        await editorConfig.update(
            'wordWrapColumn',
            column,
            vscode.ConfigurationTarget.Global
        );
        await editorConfig.update(
            'rulers',
            [column],
            vscode.ConfigurationTarget.Global
        );
    }

    updateStatusBar();
}

function updateStatusBar(): void {
    if (!statusBarItem) {
        return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || !isSupportedFile(editor.document)) {
        statusBarItem.hide();
        return;
    }

    const editorConfig = vscode.workspace.getConfiguration('editor');
    const wordWrap = editorConfig.get<string>('wordWrap');
    const wordWrapColumn = editorConfig.get<number>('wordWrapColumn');

    if (
        wordWrap === 'wordWrapColumn' &&
        typeof wordWrapColumn === 'number' &&
        wordWrapColumn > 0
    ) {
        const ratio = getFullwidthRatio();
        const w = Math.round(wordWrapColumn / ratio);
        statusBarItem.text = `Wrap: ${w}W`;
    } else {
        statusBarItem.text = 'Wrap: off';
    }

    statusBarItem.tooltip = 'クリックでラップ幅を設定';
    statusBarItem.show();
}

function isSupportedFile(document: vscode.TextDocument): boolean {
    const fileName = document.fileName;
    return SUPPORTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}
