# Prismaの使い方

#ディレクトリ移動
`cd next`

#node_modulesインストール
`npm ci`

#初期マイグレーション
`npx prisma migrate dev --name init`

#db変更時のマイグレーション
{name} は任意の名前
`npx prisma migrate dev --name {name}`

#client生成
`npx prisma generate`

#データシード
seed.tsを実行
1~9番のスクリーンの座席をdb登録
`npx prisma db seed`

