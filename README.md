# 所属していたサークル用のLineBot

## 概要
開発者が所属していたサークルの人数が多く、LINEでのグループ管理、メンバー管理が大変だったため、LINEBotで管理しようと考え開発しました。

## 使用技術
GAS

## 主な機能
### ・登録機能 - [Main.gs/register()](https://github.com/soyashimada/LineBot-for-D-mc/blob/main/Main.gs) 
サークル員がLineBotに所定の書式で登録情報を送ったら、DB用のスプシに登録情報を記録し管理する機能です。

### ・特定の登録者にメッセージ送信する機能 - [Sub1.gs/pushMessageFromForm()](https://github.com/soyashimada/LineBot-for-D-mc/blob/main/Sub1.gs)
名前、送信したい人のリスト、送信内容を回答するフォームの内容から、送信者を登録者の中から判別して、送信内容をLineBotが送信する機能です。
フォーム回答から、一度回答者に確認メッセージがBotから送られ、OKを押すと送信されます。送信者の名前が登録者にいないなどの結果も、回答者に送ります。

### ・名簿からLine名リストに変化する機能 - [Sub1.gs/pushConfirmAction()](https://github.com/soyashimada/LineBot-for-D-mc/blob/main/Sub1.gs)
名前、変換してほしい人のリストを回答するフォームがあり、その回答の変換者を登録者リストから参照し、LINE名に変換、送信する機能です。
まとめてメンションしたい場合に使う機能です。

### ・登録者のプロフィール画像を調べる機能 - [Sub1.gs/searchUserPicture()](https://github.com/soyashimada/LineBot-for-D-mc/blob/main/Sub1.gs)
Botに検索したい人の名前を入力することで、その人のプロフィール画像を送信する機能です。LINE名が一致するひとが複数いる場合、調べたい人の画像で判断することができます。

