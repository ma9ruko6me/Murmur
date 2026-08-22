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

## ディレクトリ構成

```
.
├── backend/    # Spring Boot（REST API）
├── frontend/   # React + Vite（画面）
├── docs/       # 要件定義書・基本設計書
└── prototype/  # 画面確認用のHTML/CSS/JSプロトタイプ
```

バックエンド・フロントエンドそれぞれの内部構成（案）は [docs/basic-design.md 5章](docs/basic-design.md#5-ディレクトリ構成案) を参照。

## セットアップ

### 前提

- Java 25
- Node.js（npm）
- Docker（PostgreSQLをコンテナで起動するため）

### 1. データベースの起動

```bash
cd backend
docker compose up -d
```

`backend/compose.yaml` により、PostgreSQL 17 がポート `5432` で起動する（DB名・ユーザー名・パスワードはいずれも `murmur`、ローカル開発用のダミー値）。

### 2. バックエンドの起動（ポート8080）

```bash
cd backend
./gradlew bootRun
```

起動後、以下で疎通確認・API仕様確認ができる。

- ヘルスチェック: `http://localhost:8080/actuator/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

### 3. フロントエンドの起動（ポート5173）

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173/` にアクセスするとプレースホルダー画面が表示される。

> [!IMPORTANT]
> フロントエンドは `http://localhost:8080`（既定ポート）のバックエンドにAPIリクエストする構成のため、両方とも既定ポート（バックエンド`8080`／フロントエンド`5173`）で起動すること。ポート競合時に別ポートへフォールバックしたまま起動すると、通信が成立せず正しく動作しない。詳細は `.claude/skills/run-servers/SKILL.md` を参照。

## 現在の状況

環境構築フェーズ。`backend/`・`frontend/`のスキャフォールディングまで完了。サインアップ/ログイン等の機能実装はこれから着手する。

## 開発ルール

Issue駆動・PRベースの開発フローに従う。詳細は [CLAUDE.md](CLAUDE.md) を参照。
