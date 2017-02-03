# uiflow

マークダウン風のテキストからUI Flowsのグラフを生成するコンパイラ

## UI Flowsとは？

Webサイトやスマホアプリなどのユーザーインタフェースを設計する際に、より簡単な表現で全体の流れを記述する次のような図のことです。

![simple.png](https://qiita-image-store.s3.amazonaws.com/0/35671/83a65590-8ea7-a124-0a86-ca9cb967402b.png "simple.png")

具体的なUI設計に触れず、

* ユーザーが見るもの
* ユーザーがする行動

に注目することでシンプルにUIの必要条件、あるいは骨子を記述することができます。

``uiflow``コンパイラは、次のような簡潔な表現でこのような図を作図することができます。

```markdown:sample.txt
[最初に]
ユーザーが見るものを書きます。
--
ユーザーがする行動を書きます。

[次に]
ユーザーが見るもの
--
ユーザーがすること１
==> その結果１
ユーザーがすること２
==> その結果２

[その結果１]
結果

[その結果２]
結果
```

## インストール方法

グラフの生成には[Graphviz](http://www.graphviz.org/)を用います。brewなどを通じてinstallしておいてください。


```
brew install graphviz
npm install -g uiflow
```

## コマンドの使い方

### シンプルな使い方

```bash:
uiflow -i myapp.txt -o myapp.png -f png  
```

myapp.txtをpng形式で、myapp.pngに変換する。

### svgで出力

```bash:
uiflow -i myapp.txt -f svg
```
myapp.txtをsvg形式で、標準出力に表示する。

## uiflow形式の文法

### 基本ブロック

```markdown:基本ブロック
[ページ名]
# コメント
表示要素1
表示要素2
表示要素3
--
行動要素1
===> 遷移先ページ1名
行動要素2
===> 遷移先ページ2名
```


![base.png](https://qiita-image-store.s3.amazonaws.com/0/35671/f2b4855d-a53c-5414-50f1-de4f07bc2f16.png "base.png")

### 基本ブロックをつなげる


```markdown:基本ブロック
[ページ名]
表示要素1
--
行動要素1

[ページ名2]
表示要素
--
行動要素

[ページ名3]
表示要素
--
行動要素
```
行動要素の``==>``を省略すると次の基本ブロックに自動的につながります。

![base.png](https://qiita-image-store.s3.amazonaws.com/0/35671/01f02911-6738-549f-dd93-b829887843fb.png "base.png")


### 遷移に名前をつける
``=={hogehoge}=>``と表記して、遷移に名前をつけることができます。

```
[最初に]
ユーザーが見るものを書きます。
--
ユーザーがする行動を書きます。

[次に]
ユーザーが見るもの
--
ユーザーがすること１
=={遷移アクション名}=> その結果１
ユーザーがすること２
=={API名など}=> その結果２

[その結果１]
結果

[その結果２]
結果

```
![simple-graph.png](https://qiita-image-store.s3.amazonaws.com/0/35671/eff43bff-b436-c9e5-815e-559143cec750.png "simple-graph.png")


### 少し複雑な例

```markdown:complex

#
# 少し複雑な例
#
[初回通知]
通知の確認ダイアログ
--
OK

[国選択]
リージョンの選択
デフォルトで日本
OKボタン
--
OK

[はじめよう]
ヒント情報
はじめるボタン
--
ヒントをスワイプ
==> はじめよう
LINEQを始める

[非ログインメイン画面]
ログインすると全ての機能を使えますアラート
フィード
通知アイコン
検索アイコン
ホーム
分野
Qボタン
ランキング
マイページ(N)
------
アラートをタップ
==> 利用規約
分野をタップ
==> 分野
Qボタンをタップ
==> ログイン確認
ランキングをタップ
==> ランキング


[利用規約]
利用規約の表示

[分野]
分野詳細

[ランキング]
ランキング詳細

```
![base.png](https://qiita-image-store.s3.amazonaws.com/0/35671/5f26cd34-39bf-4dd3-c2b9-2ac892abbdd8.png "base.png")


## uiflowをライブラリとして使う

次のように使うことができます。

```javascript:sampleusage
var uiflow = require("uiflow");

// dot形式で書き出す
var dot = uiflow.compile("[テスト]\nユーザーが見るもの\nユーザがすること\n");

// パースされたAST表現をjsonで書き出す
var json = uiflow.json("[テスト]\nユーザーが見るもの\nユーザがすること\n");

// graphvizをつかって、svgに変換したものを標準出力に渡す。
uiflow.build("ソースコード","svg")
	.pipe(process.stdout);
```

## SEE ALSO

* [画面遷移に疑問を感じたあなたにオススメするUI Flowsというツール](http://www.standardinc.jp/reflection/article/ui-flows/)
* [A shorthand for designing UI flows](https://signalvnoise.com/posts/1926-a-shorthand-for-designing-ui-flows)




