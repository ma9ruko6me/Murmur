---
name: quality-review
description: バックエンド(Spring Boot)・フロントエンド(Vite/React)の品質チェックと、実装とドキュメント(要件定義書・基本設計書)の整合性確認を行う。lint/静的解析の実行方法と、ドキュメント突き合わせの観点をまとめる。
---

# 品質レビュー手順

コード品質チェックとドキュメント整合性チェックを、機械的に検出できるものと設計判断が絡むものに分けて実施する。

## 方針

- lint/静的解析ツールで検出できる違反は、import順序や空白・命名規則などの機械的に安全なものに限りその場で修正してよい
- トランザクション境界・例外設計・エンティティの可変性など設計判断が絡む指摘は、自動修正せず一覧化してユーザーに報告する
- 実装とドキュメントが食い違う場合は、実装を正としてドキュメント側を修正する（逆に実装をドキュメントへ合わせる判断が必要な場合はユーザーに確認する）

## フロントエンド品質チェック(`frontend/`)

```bash
cd /Users/ogawahiroki/CursorProjects/Murmur/frontend
npm run lint          # ESLint (typescript-eslint / react-hooks / react-refresh)
npx tsc -b --dry       # 型チェック(ビルドは行わずエラーのみ確認)
npx prettier --check . # フォーマット確認。eslint-plugin-prettierは未導入の場合 npm run lint では検知できない点に注意
```

確認観点:
- ESLintはエラー0件が前提。warningもできる限り解消する
- 画像プレビュー・アップロード処理(最大4枚)や階層コメント表示など、状態管理が複雑になりやすい箇所で`any`の混入がないか個別に確認する
- Prettierの`--check`が失敗する場合、`--write`での一括整形は差分が大きくなるためユーザーに確認してから実施する

## バックエンド品質チェック(`backend/`)

Checkstyle等の静的解析ツールを導入した場合、以下のように実行する(未導入の場合はこの節は該当なし)。

```bash
cd /Users/ogawahiroki/CursorProjects/Murmur/backend
./gradlew checkstyleMain checkstyleTest
```

テスト実行:
```bash
./gradlew test
```

確認観点:
- 投稿の作成・削除に伴うコメント・いいね・画像(post_images)の扱いなど、複数テーブルにまたがる操作を行うServiceメソッドに`@Transactional`が付与されているか
- 例外ハンドラ(`GlobalExceptionHandler`)が構造化されたレスポンスを返しているか、catch-allが存在するか
- 認証(JWT)まわりで、パスワードや発行済みトークンが平文でログ出力されていないか
- コメントの自己参照(`parent_comment_id`)を辿る処理で、循環参照や過度な再帰によるパフォーマンス劣化がないか
- エンティティのフィールドが不用意に外部から変更可能になっていないか(setter乱用)
- 新規ロジックに対応するテスト(可能であればモックを使った単体テストも)があるか

## ドキュメント整合性チェック

`docs/requirements.md`(要件定義書)・`docs/basic-design.md`(基本設計書)を、以下の観点で実装と突き合わせる。

| 観点 | ドキュメント側 | 実装側 |
|------|----------------|--------|
| データ項目・カラム | 要件定義書6章のER図、基本設計書3章のDB物理設計(users/posts/post_images/comments/likes/follows) | `backend/src/main/java/.../{user,post,comment,like}/*.java`、`backend/src/main/resources/db/migration/*.sql` |
| API仕様 | 基本設計書4章のエンドポイント一覧 | 各`*Controller.java`、DTO(`*Request.java`/`*Response.java`) |
| 画面構成・画面遷移 | 要件定義書5章 | `frontend/src/App.tsx`、`frontend/src/components/*.tsx` |
| 機能一覧 | 要件定義書3章(◎/○/△) | フロントエンド実装全体・バックエンドの各ドメインパッケージ |
| コメントの階層構造 | 要件定義書3.5節、基本設計書3.1節のER図(COMMENTの自己参照) | `Comment.java`のエンティティ定義、`CommentThread.tsx`の表示ロジック |
| 検索機能 | 要件定義書3.7節、基本設計書4章の`/users/search`・`/comments/search` | `UserSearchController`/`CommentSearchController`等 |

相違を見つけたら、該当するドキュメント箇所を実装に合わせて修正する。ドキュメント内の目次アンカー(`#見出し`)が実際の見出しと一致しているかも合わせて確認する。

インフラ構成(`docs/infrastructure.md`)は未作成のため、作成後はTerraform等のチェック項目をこのskillに追記する。
