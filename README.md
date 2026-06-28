# ShareSchedule

少人数グループ向けの**スケジュール共有 × チャット**コミュニケーションツール。

Slack ライクなチャンネル管理と Google Calendar 連携を組み合わせ、メンバーの予定を○/△/×で可視化します。

---

## 主な機能

| カテゴリ | 機能 |
|----------|------|
| カレンダー | コミュニティメンバーの空き状況を○/△/×で表示（匿名集計） |
| カレンダー | 個人予定の作成・編集・ドラッグ移動 |
| カレンダー | 自然言語 / 音声でのスケジュール入力（Gemini 1.5 Flash） |
| カレンダー | Google カレンダー同期 / iCal（.ics）インポート |
| チャット | リアルタイムチャンネルメッセージ（Firestore） |
| チャット | Markdown 表示・絵文字リアクション・メッセージ編集 |
| チャット | 画像・ファイル共有（危険ファイル警告付き） |
| 場所共有 | Google Places API でチャット内に地図リンクを挿入 |
| 通知 | FCM プッシュ通知・チャンネルごとのミュート・時間帯設定 |
| コミュニティ | 招待コードによるメンバー管理・役割（owner / admin / member） |
| セキュリティ | Firebase Auth（Google / メール）、Firestore セキュリティルール |

---

## 技術スタック

```
フロントエンド : React 18 + TypeScript + Vite + Tailwind CSS
状態管理       : Zustand + TanStack Query v5
カレンダーUI   : FullCalendar v6
バックエンド   : Go 1.22 + Fiber v2
データベース   : Cloud Firestore（リアルタイム）
認証           : Firebase Authentication
ストレージ     : Firebase Storage
LLM            : Gemini 1.5 Flash
地図           : Google Maps JavaScript API + Places API
ホスティング   : Firebase Hosting（フロント）+ Cloud Run（バックエンド）
```

---

## ディレクトリ構成

```
share_schedule/
├── README.md
├── CHANGELOG.md
├── 設計書.md                    # 詳細設計書
├── バックエンド言語選定理由.txt
└── work/                        # 実装コード
    ├── README.md                # セットアップガイド
    ├── firebase.json
    ├── firestore.rules
    ├── firestore.indexes.json
    ├── storage.rules
    ├── frontend/                # React アプリ
    │   ├── src/
    │   │   ├── api/             # API クライアント
    │   │   ├── components/      # UI コンポーネント
    │   │   │   ├── calendar/    # カレンダー関連
    │   │   │   ├── chat/        # チャット関連
    │   │   │   ├── common/      # 共通コンポーネント
    │   │   │   ├── map/         # 地図・場所共有
    │   │   │   └── notification/
    │   │   ├── hooks/           # カスタムフック
    │   │   ├── pages/           # ページコンポーネント
    │   │   ├── store/           # Zustand ストア
    │   │   ├── types/           # TypeScript 型定義
    │   │   └── utils/           # ユーティリティ関数
    │   └── public/
    │       └── firebase-messaging-sw.js  # FCM Service Worker
    └── backend/                 # Go API サーバー
        ├── cmd/server/          # エントリポイント
        └── internal/
            ├── handlers/        # HTTP ハンドラー
            ├── middleware/      # 認証・CORS
            ├── models/          # データモデル
            ├── repository/      # Firestore アクセス層
            └── services/        # ビジネスロジック
                ├── availability/ # ○/△/× 計算
                ├── calendar/    # Google Calendar / iCal
                ├── gemini/      # LLM 連携
                ├── safebrowsing/ # URL 安全確認
                └── upload/      # ファイルバリデーション
```

---

## セットアップ

詳細は [`work/README.md`](work/README.md) を参照してください。

### クイックスタート

```bash
# フロントエンド
cd work/frontend
cp .env.example .env   # Firebase の値を設定
npm install && npm run dev

# バックエンド
cd work/backend
cp .env.example .env   # 各 API キーを設定
go mod tidy
go run ./cmd/server
```

---

## ドキュメント

- [設計書](設計書.md) — 機能要件・DB設計・API設計・セキュリティ設計
- [バックエンド言語選定理由](バックエンド言語選定理由.txt) — Go を選択した根拠
- [セットアップガイド](work/README.md) — 環境構築・デプロイ手順

---

## ライセンス

MIT
