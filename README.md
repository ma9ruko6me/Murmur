# Murmur

X（旧Twitter）のようなタイムライン形式の短文投稿SNS Webアプリケーション（仮称）。個人利用を前提としつつ、サインアップ機能により複数ユーザーが使う想定で開発している学習課題。

ログイン/サインアップ、フォロー、タイムライン、投稿（テキスト＋画像最大4枚、編集・削除）、コメント（返信可能な階層構造）、いいね、ユーザー・コメント検索の各機能を備える。X/Twitterと異なり、インプレッション数の表示やリツイート（リポスト）に相当する機能は用意しない。詳細な背景・機能要件は [docs/requirements.md](docs/requirements.md) を参照。

## ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [docs/requirements.md](docs/requirements.md) | 要件定義書。想定利用者、機能要件、画面一覧・画面遷移図、データ項目・ER図など |
| [docs/basic-design.md](docs/basic-design.md) | 基本設計書。技術スタック、アーキテクチャ方針、DB物理設計、API設計、ディレクトリ構成 |

## 技術スタック

| 領域 | 技術 |
|------|------|
| バックエンド | Java 25 (LTS) / Spring Boot 4.1.x / Gradle / Spring Data JPA / Flyway / Spring Security (JWT想定) |
| フロントエンド | React / Vite / TypeScript 6.x / Tailwind CSS v4 / TanStack Query |
| データベース | PostgreSQL（Docker Composeで起動想定） |
| 画像ストレージ | クラウドオブジェクトストレージ（S3のようなものを想定、具体プロバイダは未確定） |

選定理由の詳細は [docs/basic-design.md 1章](docs/basic-design.md#1-技術スタック) を参照。

## ディレクトリ構成（予定）

```
.
├── backend/    # Spring Boot（REST API）
├── frontend/   # React + Vite（画面）
└── docs/       # 要件定義書・基本設計書
```

`backend/`・`frontend/`は今後の実装フェーズで追加する。バックエンド・フロントエンドそれぞれの内部構成（案）は [docs/basic-design.md 5章](docs/basic-design.md#5-ディレクトリ構成案) を参照。

## 現在の状況

要件定義・基本設計フェーズ。実装（`backend/`・`frontend/`の作成）は未着手。セットアップ手順・API一覧は実装着手後に本READMEへ追記する。

## 開発ルール

Issue駆動・PRベースの開発フローに従う。詳細は [CLAUDE.md](CLAUDE.md) を参照。
