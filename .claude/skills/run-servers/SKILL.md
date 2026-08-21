---
name: run-servers
description: バックエンド(Spring Boot)・フロントエンド(Vite)のローカル開発サーバーを起動する。ポート競合時は代替ポートへフォールバックせず、占有プロセスを停止して指定ポートで起動する。
---

# ローカルサーバー起動手順

## 前提: ポート競合時のルール(必ず守る)

このプロジェクトのサーバーは **アプリ側で指定された(または各ツールの既定の)ポート番号で起動すること** を前提にしている。

- バックエンド(Spring Boot): 既定ポート `8080`(`backend/src/main/resources/application.yml` に `server.port` の指定なし)
- フロントエンド(Vite): 既定ポート `5173`(`frontend/vite.config.ts` にポート指定なし)

起動しようとしたポートが既に使用中の場合、**別のポートへ自動フォールバックさせたまま起動してはならない**。フロントエンドがバックエンドのURL(既定ポート)にAPIリクエストを送る構成になっており、片方だけ別ポートで動くと通信が成立せず正しく動作しないため。

対応手順:

1. 対象ポートを使っているプロセスを確認する
   ```bash
   lsof -ti:<port> -sTCP:LISTEN
   ```
2. そのプロセスを停止する
   ```bash
   lsof -ti:<port> -sTCP:LISTEN | xargs -r kill
   ```
3. 指定ポート(既定ポート)で改めて起動する

`npm run dev -- --port <別番号>` のように別ポートを明示的に指定して起動することはしない。

## バックエンド起動(ポート8080)

```bash
cd /Users/ogawahiroki/CursorProjects/Murmur/backend
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
./gradlew bootRun > /tmp/backend-dev.log 2>&1 &
disown
```

起動確認:
```bash
i=0; until curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1 || [ $i -ge 60 ]; do sleep 1; i=$((i+1)); done
cat /tmp/backend-dev.log
```
(Spring Bootの起動には数十秒かかる場合がある)

停止:
```bash
lsof -ti:8080 -sTCP:LISTEN | xargs -r kill
```

## フロントエンド起動(ポート5173)

```bash
cd /Users/ogawahiroki/CursorProjects/Murmur/frontend
lsof -ti:5173 -sTCP:LISTEN | xargs -r kill
npm run dev > /tmp/vite-dev.log 2>&1 &
disown
```

起動確認:
```bash
i=0; until curl -sf http://localhost:5173 >/dev/null || [ $i -ge 30 ]; do sleep 1; i=$((i+1)); done
cat /tmp/vite-dev.log
```

ブラウザで開く:
```bash
open http://localhost:5173/
```

停止:
```bash
lsof -ti:5173 -sTCP:LISTEN | xargs -r kill
```

## 両方同時に起動する場合

バックエンド→フロントエンドの順で起動し、それぞれ起動確認(curlでの疎通確認)をしてから次に進む。
