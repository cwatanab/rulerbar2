# Ruler Bar

> [!IMPORTANT]
> Ruler Bar は現在 **addons.thunderbird.net (ATN) には公開していません**。
> 本アドオンは [Thunderbird Experiment API](https://developer.thunderbird.net/add-ons/mailextensions/experiments)
> をルーラーの UI 注入に使用しており、ATN では Experiment API を利用する新規
> アドオンの受付を停止しているためです。代わりに、本リポジトリの
> [GitHub Releases](../../releases) から直接配布しています。

Ruler Bar は、従来の Thunderbird アドオン「Ruler Bar」を作り直した WebExtension 版です。

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

- manifest では Thunderbird 128 から 200.* までを許可しています。
- プレーンテキストメールを等幅フォントで作成する場合に、もっとも安定した表示になります。
- HTML メールやプロポーショナルフォントでも目安として表示できますが、実際の描画位置と完全には一致しない場合があります。

## 配布

Ruler Bar は現在 **addons.thunderbird.net (ATN) には公開していません**。
本アドオンは [Thunderbird Experiment API](https://developer.thunderbird.net/add-ons/mailextensions/experiments)
をルーラーの UI 注入に使用しており、ATN では Experiment API を利用する新規
アドオンの受付を停止しているためです。代わりに、本リポジトリの
[GitHub Releases](../../releases) から直接配布しています。

### GitHub Release からインストールする手順

1. このリポジトリの [Releases ページ](../../releases) を開きます。
2. 最新の `ruler_bar-v<version>.xpi` (または `ruler_bar-v<version>.zip`)
   をダウンロードします。
3. Thunderbird のアドオンマネージャ (`≡` メニュー → **アドオンとテーマ**) を
   開きます。
4. 歯車アイコンから **ファイルからアドオンをインストール…** を選択します。
5. ダウンロードした XPI/ZIP を選び、サードパーティ製アドオンのインストール
   確認に同意します。
6. 開いている作成ウィンドウがあれば再起動し、ルーラーを再接続します。

### リリースの作成

リリースはアドオンのバージョン (`v0.7.0` など) でタグ付けし、`npm run build` で
生成された XPI/ZIP をアタッチします。タグ・タイトル・本文は次の形式に揃えて
います。

- **タグ**: `manifest.json` のバージョンと一致する `v<version>` (例: `v0.7.0`)。
- **タイトル**: `Ruler Bar <version>`。
- **本文**: ユーザー視点の変更点を箇条書きし、前のタグとの差分リンク
  (例: `…compare/v0.6.13...v0.7.0`) を貼ります。

バージョンをバンプしてマージした後、次のようにリリースを作成します。

```powershell
npm run build
git tag v0.7.1
git push origin v0.7.1
gh release create v0.7.1 dist/ruler_bar-v0.7.1.xpi dist/ruler_bar-v0.7.1.zip `
  --title "Ruler Bar 0.7.1" `
  --notes-file - <<'EOF'
変更点の全一覧はコミット履歴を参照してください。

- 前のリリース: https://github.com/cwatanab/rulerbar/releases/tag/v0.7.0
- 差分: https://github.com/cwatanab/rulerbar/compare/v0.7.0...v0.7.1
EOF
```

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

## メモ

- 元アドオン: YUKI "Piro" Hiroshi 氏による [Ruler Bar](https://github.com/piroor/rulerbar)
- WebExtension 版リメイク: cwatanab
- この版は Manifest V3 WebExtension と Thunderbird Experiment API を使用しています。
- 旧 XUL overlay ファイル、`install.rdf`、`chrome.manifest` は使用していません。
- ATN が Experiment API を利用する新規アドオンを受付けていないため、Ruler Bar
  は ATN には公開していません。インストール手順は [配布](#配布) セクションを
  参照してください。

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
Compress-Archive -Force -Path manifest.json,icon.png,api,options,_locales -DestinationPath dist\ruler_bar-v0.7.1.zip
Copy-Item -Force dist\ruler_bar-v0.7.1.zip dist\ruler_bar-v0.7.1.xpi
```

生成される `dist/` 以下のファイルは Git の管理対象外です。

## ライセンス

このプロジェクトは、元アドオン [Ruler Bar](https://github.com/piroor/rulerbar) と同じ tri-license で配布します。

MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later
