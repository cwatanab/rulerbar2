# Ruler Bar 2

Ruler Bar 2 is a Thunderbird 150-compatible WebExtension remake of the legacy Ruler Bar add-on.

It shows a ruler in the message compose window, highlights the current caret position, and marks the configured plain-text wrap column.

## Notes

- Original add-on: [Ruler Bar](https://github.com/piroor/rulerbar) by YUKI "Piro" Hiroshi
- Thunderbird 150 remake: cwatanab
- This version uses a Manifest V3 WebExtension with a Thunderbird Experiment API.
- Legacy XUL overlay files, `install.rdf`, and `chrome.manifest` are not used.

## Accuracy

The current caret position and the configured wrap column are highlighted on the ruler. The displayed position is generally close when composing plain-text messages with a monospace font. It can differ from the actual visual position when a long English word or URI crosses the wrap column, when using a proportional font, or when composing HTML messages.

## Build

Create an installable XPI from the repository root:

```powershell
Compress-Archive -Force -Path manifest.json,icon.png,api,options,_locales -DestinationPath dist\ruler_bar_tb150.zip
Copy-Item -Force dist\ruler_bar_tb150.zip dist\ruler_bar_tb150.xpi
```

The generated files in `dist/` are ignored by Git.

## License

This project is distributed under the same tri-license as the original [Ruler Bar](https://github.com/piroor/rulerbar):

MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later

## 日本語

Ruler Bar 2 は、従来の Thunderbird アドオン「Ruler Bar」を Thunderbird 150 向けに作り直した WebExtension 版です。

メール作成ウィンドウにルーラーを表示し、現在のカーソル位置と、設定されているプレーンテキストの折り返し桁を強調表示します。

## メモ

- 元アドオン: YUKI "Piro" Hiroshi 氏による [Ruler Bar](https://github.com/piroor/rulerbar)
- Thunderbird 150 向けリメイク: cwatanab
- この版は Manifest V3 WebExtension と Thunderbird Experiment API を使用しています。
- 旧 XUL overlay ファイル、`install.rdf`、`chrome.manifest` は使用していません。

## 表示精度について

現在のカーソル位置と、設定されている折り返し位置をルーラー上で強調表示します。プレーンテキストメールを等幅フォントで作成している場合は、おおむね実際の位置に近い表示になります。ただし、折り返し位置に長い英単語や URI がある場合、プロポーショナルフォントを使用している場合、または HTML メールを作成している場合は、表示位置が実際の見た目とずれることがあります。

## ビルド

リポジトリのルートで以下を実行すると、インストール可能な XPI を作成できます。

```powershell
Compress-Archive -Force -Path manifest.json,icon.png,api,options,_locales -DestinationPath dist\ruler_bar_tb150.zip
Copy-Item -Force dist\ruler_bar_tb150.zip dist\ruler_bar_tb150.xpi
```

生成される `dist/` 以下のファイルは Git の管理対象外です。

## ライセンス

このプロジェクトは、元アドオン [Ruler Bar](https://github.com/piroor/rulerbar) と同じ tri-license で配布します。

MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later
