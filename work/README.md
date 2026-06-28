# Share Schedule — セットアップガイド

Slack × Google Calendar を組み合わせたコミュニケーションアプリ。

## 構成

```
work/
├── frontend/          # React 18 + TypeScript + Vite
├── backend/           # Go 1.22 + Fiber v2
├── firestore.rules    # Firestoreセキュリティルール
├── storage.rules      # Cloud Storageセキュリティルール
├── firestore.indexes.json
└── firebase.json      # Hosting / Emulator 設定
```

## 前提条件

- Node.js 20+
- Go 1.22+
- Firebase CLI (`npm i -g firebase-tools`)
- Firebase プロジェクト（Firestore / Auth / Storage / Hosting 有効化済み）

## 1. Firebase プロジェクト設定

```bash
firebase login
firebase use <your-project-id>
```

Firebaseコンソールで以下を有効化:
- Authentication → Google, メール/パスワード
- Firestore Database
- Storage
- Hosting

## 2. フロントエンド

```bash
cd frontend
cp .env.example .env
# .env の各値を Firebase コンソールから取得して設定
npm install
npm run dev   # http://localhost:5173
```

### 環境変数（frontend/.env）

| 変数 | 取得場所 |
|------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase コンソール → プロジェクト設定 → ウェブアプリ |
| `VITE_FIREBASE_VAPID_KEY` | Firebase コンソール → Cloud Messaging → ウェブプッシュ証明書 |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console → Maps JavaScript API |

## 3. バックエンド

```bash
cd backend
cp .env.example .env
# .env を編集

# Firebase サービスアカウントキーを取得
# Firebase コンソール → プロジェクト設定 → サービスアカウント → 新しい秘密鍵を生成
# ダウンロードしたファイルを backend/firebase-credentials.json として配置

go mod download
go run ./cmd/server   # http://localhost:8080
```

### 環境変数（backend/.env）

| 変数 | 説明 |
|------|------|
| `FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `FIREBASE_CREDENTIALS_FILE` | サービスアカウントキーのパス |
| `GEMINI_API_KEY` | Google AI Studio から取得 (無料枠あり) |
| `GOOGLE_MAPS_API_KEY` | Places API を有効化したキー |
| `SAFE_BROWSING_API_KEY` | Google Cloud Console → Safe Browsing API |
| `ALLOWED_ORIGINS` | CORS 許可オリジン（カンマ区切り） |

## 4. Firebase Emulator（ローカル開発）

```bash
# work/ ディレクトリで実行
firebase emulators:start
```

- Emulator UI: http://localhost:4000
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Storage: http://localhost:9199
- Hosting: http://localhost:5001

## 5. Firestoreルール / インデックスのデプロイ

```bash
# work/ ディレクトリで実行
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 6. 本番デプロイ（Google Cloud Run + Firebase Hosting）

### バックエンド（Cloud Run）

```bash
cd backend
gcloud builds submit --tag gcr.io/<project-id>/share-schedule-backend
gcloud run deploy share-schedule-backend \
  --image gcr.io/<project-id>/share-schedule-backend \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=<project-id>,GEMINI_API_KEY=<key>,...
```

### フロントエンド（Firebase Hosting）

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## 主な機能

- **コミュニティカレンダー** — メンバーの予定を○/△/×で表示（匿名集計）
- **チャンネルチャット** — リアルタイムメッセージ、Markdown、絵文字リアクション
- **スケジュール自然言語入力** — Gemini 1.5 Flash で「明日の14時にミーティング」を自動解析
- **音声入力** — Web Speech API (日本語)
- **Google カレンダー同期** — OAuth2 トークンで一括インポート
- **iCal インポート** — .ics ファイルの読み込み
- **場所共有** — Google Places API でチャット内に地図リンク
- **プッシュ通知** — FCM、チャンネルごとのミュート・時間帯設定
- **ファイル共有** — 画像10MB、その他50MBまで、危険ファイル警告付き

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React 18, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query |
| カレンダーUI | FullCalendar v6 |
| D&D | dnd-kit |
| バックエンド | Go 1.22, Fiber v2 |
| DB | Firestore（リアルタイム） |
| 認証 | Firebase Auth（Google / メール） |
| LLM | Gemini 1.5 Flash |
| 地図 | Google Maps JavaScript API, Places API |
| ホスティング | Firebase Hosting（フロント）, Cloud Run（バックエンド） |
