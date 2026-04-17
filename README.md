# W Wrap Column Changer（1行文字数を変更）

紙の原稿執筆・編集向けに、全角換算W単位で `editor.wordWrapColumn` を即時設定・解除するCursor拡張機能です。

簡単な操作で「1行17W」「1行20W」「1行33W」など、1行の文字数を好きな値に切り替えられます。

## 特徴

- **W単位で指定**：全角1文字＝1W、半角1文字＝0.5W として扱う直感的な単位
- **Quick Pickでプリセット選択**：設定画面で登録した最大5つのカスタムプリセットを素早く選択
- **ステータスバーから1クリック操作**：現在の設定値が常に見え、クリックで即変更可能
- **ruler縦線で視覚フィードバック**：指定位置に縦線が表示され、折り返し位置が一目でわかる
- **`.txt` / `.md` 限定**：テキスト・Markdownファイルでのみ動作する最小構成
- **Character Count 拡張機能と連携**：設定値を共有でき、別途設定する手間が不要

## 使い方

### 起動方法

以下のいずれかの方法でコマンドを実行できます：

1. **ショートカットキー**：
   - Mac: `Cmd+Option+Shift+L`
   - Windows/Linux: `Ctrl+Alt+Shift+L`
2. **コマンドパレット**：`W Wrap Column: 設定`
3. **ステータスバークリック**：画面下部の「Wrap: XXW」または「Wrap: off」をクリック

### 操作フロー

1. 起動するとQuick Pickが表示される
2. 以下のいずれかを選択：
   - 登録済みプリセット（例：`17W` / `20W` など）：即設定
   - `解除（0）`：折り返し設定を解除

プリセットが未登録の場合は、設定画面を開くガイドメッセージが表示されます。

### 動作内容

- **設定時**：
  - `editor.wordWrap` = `"wordWrapColumn"`
  - `editor.wordWrapColumn` = 選択W値 × fullwidthRatio
  - `editor.rulers` = `[選択W値 × fullwidthRatio]`
  - ステータスバーに `Wrap: XXW` と表示
- **解除時**：
  - `editor.wordWrap` = `"on"`
  - `editor.wordWrapColumn` = 未設定（デフォルトに戻る）
  - `editor.rulers` = `[]`
  - ステータスバーに `Wrap: off` と表示

すべての設定はGlobal（ユーザー設定）に適用されます。

## 設定項目

### `cursorWrapChanger.fullwidthRatio`

全角1文字を半角何文字分として扱うかの比率。

| 項目 | 値 |
|---|---|
| 型 | number |
| デフォルト | 2.0 |
| 範囲 | 1.0〜3.0 |

フォントによって全角の描画幅が半角の2倍にならない場合、この値で調整します。例えばヒラギノ明朝 ProNでは `1.66` 程度が適切です。

ただし、ちゃんと文字数を数えたい場合は、IPA明朝またはIPAゴシックなど、プロポーショナルではないフォントを使うべきでしょう。

IPA明朝／IPAゴシックであれば、fullwidth Ratioは「2」に設定します。

### `cursorWrapChanger.preset1` 〜 `preset5`

Quick Pickに表示するプリセットW値（5スロット）。

| 項目 | 値 |
|---|---|
| 型 | number |
| デフォルト | 0（未設定） |
| 範囲 | 0〜999 |

0のスロットはQuick Pickに表示されません。使う値だけ設定してください。

## Character Count 拡張機能との連携

[Character Count（cursor-character-count）](https://github.com/)拡張機能がインストールされている場合、設定値を自動的に流用できます。

**優先順位：**

1. `cursorWrapChanger.preset1`〜`preset5` に1つでも有効値（1以上）があれば、そちらを使用
2. すべて未設定（0）の場合のみ、`characterCount.charsPerLine1`〜`charsPerLine5` をフォールバックとして参照

Character Count 拡張機能で文字数設定を済ませていれば、Wrap Changer 側で改めて設定する必要はありません。

## 対象ファイル

- `.txt`
- `.md`

上記以外のファイルを開いているときは、ステータスバーは非表示になり、ショートカットキーも動作しません。

## インストール

`.vsix` ファイルをCursor／VSCodeにインストールしてください。

```bash
npm install
npm run compile
npx @vscode/vsce package --allow-missing-repository --skip-license
```

生成された `cursor-wrap-changer-1.0.0.vsix` をCursorの拡張機能ビューから「VSIXからインストール」でインストールできます。

## ライセンス

MIT
