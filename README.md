# Ruler Bar 2

Ruler Bar 2 is a Thunderbird WebExtension remake of the legacy Ruler Bar add-on.

It adds a ruler to Thunderbird message compose windows so you can see the current caret position and the configured plain-text wrap column while writing. It is intended for users who compose fixed-width plain-text messages, align text by column, or want a visible guide for Thunderbird's wrap length setting.

## Features

- Shows a horizontal ruler in message compose windows.
- Highlights the current caret position.
- Marks Thunderbird's configured wrap column from `mailnews.wraplength`.
- Lets you drag the wrap marker to change the wrap column.
- Supports configurable tab width and non-ASCII character width for logical column counting.
- Can track the caret by its visual rectangle when Thunderbird exposes that information, with a logical-column fallback.
- Provides an options page for display, measurement, and advanced ruler settings.

## Compatibility

- The manifest currently allows Thunderbird 128 through 152.*.
- Plain-text composition with a monospace font gives the most predictable result.
- HTML composition and proportional fonts are supported as best-effort visual guides, but the ruler can differ from the exact rendered text position.

## Settings

| Setting | Default | Description |
| --- | ---: | --- |
| Track the caret by exact visual position | On | Uses the caret rectangle when available, then falls back to logical column counting. |
| Loop the cursor at the wrap column | On | Keeps the cursor indicator within the configured wrap width for wrapped plain-text composition. |
| Tab width | 8 columns | Counts tab characters as this many logical columns. |
| Non-ASCII width | 2 columns | Counts Japanese and other non-ASCII characters as this many logical columns. |
| Numbered mark interval | 20 columns | Shows numeric ruler labels at this interval. |
| Minor mark interval | 2 columns | Shows smaller tick marks at this interval. |
| Ruler scale | 100% | Adjusts the visual spacing of ruler marks. |
| Cursor opacity | 100% | Adjusts the current-position indicator visibility. |
| Maximum columns | 300 columns | Sets the minimum upper limit for generated ruler marks. |

## Accuracy and Limitations

The current caret position and the configured wrap column are highlighted on the ruler. The displayed position is generally close when composing plain-text messages with a monospace font. It can differ from the actual visual position when a long English word or URI crosses the wrap column, when using a proportional font, or when composing HTML messages.

The visual-position option improves the cursor marker when Thunderbird exposes a useful caret rectangle. If that information is unavailable, Ruler Bar 2 falls back to logical column counting with the configured tab and non-ASCII widths.

## Add-on Listing Copy

Short description:

> Adds a configurable ruler to Thunderbird compose windows, showing the caret position and wrap column.

Long description:

> Ruler Bar 2 adds a column ruler to Thunderbird message compose windows. It highlights the current caret position and the configured plain-text wrap column, making it easier to write fixed-width plain-text messages, check line length, and align text by column.
>
> The add-on includes settings for tab width, non-ASCII character width, ruler mark intervals, ruler scale, cursor opacity, and caret-position tracking. The wrap column marker can also be dragged directly in the compose window to update Thunderbird's wrap length setting.
>
> Ruler Bar 2 works best with plain-text messages and a monospace font. HTML messages, proportional fonts, and long unbroken words or URLs can still cause differences between the ruler and Thunderbird's exact rendered layout.

## Project Notes

- Original add-on: [Ruler Bar](https://github.com/piroor/rulerbar) by YUKI "Piro" Hiroshi
- WebExtension remake: cwatanab
- This version uses a Manifest V3 WebExtension with a Thunderbird Experiment API.
- Legacy XUL overlay files, `install.rdf`, and `chrome.manifest` are not used.

## Build

If Node.js and PowerShell 7 are available, run the smoke check. It validates the
extension metadata, locale coverage, option wiring, and creates the installable
XPI:

```powershell
npm run smoke
```

Create an installable XPI from the repository root:

```powershell
New-Item -ItemType Directory -Force dist | Out-Null
Compress-Archive -Force -Path manifest.json,icon.png,api,options,_locales -DestinationPath dist\ruler_bar_tb150.zip
Copy-Item -Force dist\ruler_bar_tb150.zip dist\ruler_bar_tb150.xpi
```

The generated files in `dist/` are ignored by Git.

## License

This project is distributed under the same tri-license as the original [Ruler Bar](https://github.com/piroor/rulerbar):

MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later

## 日本語

Ruler Bar 2 は、従来の Thunderbird アドオン「Ruler Bar」を作り直した WebExtension 版です。

Thunderbird のメール作成ウィンドウにルーラーを表示し、現在のカーソル位置と、設定されているプレーンテキストの折り返し桁を確認しながら文章を書けるようにします。固定幅のテキストメールを作成する場合、桁位置をそろえたい場合、または Thunderbird の折り返し設定を目で確認したい場合に役立ちます。

## 主な機能

- メール作成ウィンドウに横方向のルーラーを表示します。
- 現在のカーソル位置を強調表示します。
- Thunderbird の `mailnews.wraplength` で設定されている折り返し桁を表示します。
- 折り返し桁のマーカーをドラッグして、折り返し位置を変更できます。
- タブ幅と非 ASCII 文字幅を設定し、論理的な桁数計算に反映できます。
- Thunderbird からカーソル矩形を取得できる場合は見た目の位置で追跡し、取得できない場合は論理桁で補完します。
- 表示、文字幅の計算、詳細項目を調整できる設定ページを備えています。

## 対応バージョン

- manifest では Thunderbird 128 から 152.* までを許可しています。
- プレーンテキストメールを等幅フォントで作成する場合に、もっとも安定した表示になります。
- HTML メールやプロポーショナルフォントでも目安として表示できますが、実際の描画位置と完全には一致しない場合があります。

## 設定項目

| 設定 | 既定値 | 説明 |
| --- | ---: | --- |
| カーソル位置を見た目の位置で正確に追跡する | オン | 取得できる場合はカーソル矩形を使い、取得できない場合は論理桁で補完します。 |
| 折り返し桁でカーソル表示をループする | オン | 折り返し幅を超えたカーソル表示を、折り返し幅内に収めます。 |
| タブ幅 | 8 文字 | タブ文字を何文字分として数えるかを指定します。 |
| 非 ASCII 文字の幅 | 2 文字 | 日本語などの非 ASCII 文字を何文字分として数えるかを指定します。 |
| 文字数表示の間隔 | 20 文字 | 数字ラベルを表示する間隔を指定します。 |
| 小目盛りの間隔 | 2 文字 | 小さな目盛りを表示する間隔を指定します。 |
| 目盛りの拡大率 | 100% | ルーラーの目盛り間隔を見た目上で調整します。 |
| カーソルの透過率 | 100% | 現在位置インジケーターの見え方を調整します。 |
| 最大表示文字数 | 300 文字 | 生成する目盛りの上限を指定します。 |

## 表示精度と制限

現在のカーソル位置と、設定されている折り返し位置をルーラー上で強調表示します。プレーンテキストメールを等幅フォントで作成している場合は、おおむね実際の位置に近い表示になります。ただし、折り返し位置に長い英単語や URI がある場合、プロポーショナルフォントを使用している場合、または HTML メールを作成している場合は、表示位置が実際の見た目とずれることがあります。

見た目の位置で追跡する設定を有効にすると、Thunderbird から取得できるカーソル矩形を使ってカーソルマーカーを表示します。カーソル矩形を取得できない場合は、設定されたタブ幅と非 ASCII 文字幅にもとづく論理桁で表示します。

## アドオンページ掲載文

短い説明:

> Thunderbird のメール作成ウィンドウに、カーソル位置と折り返し桁を示す設定可能なルーラーを表示します。

長い説明:

> Ruler Bar 2 は、Thunderbird のメール作成ウィンドウに桁位置の目安となるルーラーを追加します。現在のカーソル位置と、プレーンテキストの折り返し桁をルーラー上に表示するため、固定幅のテキストメールを書いたり、行の長さを確認したり、桁位置をそろえたりしやすくなります。
>
> タブ幅、非 ASCII 文字幅、目盛りの間隔、目盛りの拡大率、カーソル表示の透過率、カーソル位置の追跡方法を設定できます。メール作成ウィンドウ上の折り返しマーカーをドラッグして、Thunderbird の折り返し桁を変更することもできます。
>
> プレーンテキストメールと等幅フォントでの利用に最適化しています。HTML メール、プロポーショナルフォント、長い英単語や URL を含む行では、ルーラー上の表示と Thunderbird の実際の描画位置がずれる場合があります。

## メモ

- 元アドオン: YUKI "Piro" Hiroshi 氏による [Ruler Bar](https://github.com/piroor/rulerbar)
- WebExtension 版リメイク: cwatanab
- この版は Manifest V3 WebExtension と Thunderbird Experiment API を使用しています。
- 旧 XUL overlay ファイル、`install.rdf`、`chrome.manifest` は使用していません。

## ビルド

Node.js と PowerShell 7 が利用できる場合は、次の smoke check を実行します。
拡張機能のメタデータ、ロケール、設定項目の対応を検証し、インストール可能な
XPI を作成します。

```powershell
npm run smoke
```

リポジトリのルートで以下を実行すると、インストール可能な XPI を作成できます。

```powershell
New-Item -ItemType Directory -Force dist | Out-Null
Compress-Archive -Force -Path manifest.json,icon.png,api,options,_locales -DestinationPath dist\ruler_bar_tb150.zip
Copy-Item -Force dist\ruler_bar_tb150.zip dist\ruler_bar_tb150.xpi
```

生成される `dist/` 以下のファイルは Git の管理対象外です。

## ライセンス

このプロジェクトは、元アドオン [Ruler Bar](https://github.com/piroor/rulerbar) と同じ tri-license で配布します。

MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later
