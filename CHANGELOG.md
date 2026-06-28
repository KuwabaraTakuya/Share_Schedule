# Changelog

ShareSchedule のバージョン履歴。[Semantic Versioning](https://semver.org/lang/ja/) に準拠。

---

## [0.1.0] — 2026-06-29

### 初回実装（フルスクラッチ）

#### フロントエンド（React 18 + TypeScript + Vite）

**認証**
- Firebase Authentication による Google ログイン / メール・パスワード認証
- Zustand による認証状態の永続化
- ID トークン自動更新（55分ごと）

**コミュニティ・チャンネル**
- 複数コミュニティへの所属対応
- Discord スタイルのサイドバー（コミュニティアイコン + チャンネル一覧）
- dnd-kit によるチャンネルの並び替え（ドラッグ&ドロップ）
- 招待コードによるコミュニティ参加
- owner / admin / member の役割管理

**チャット**
- Firestore `onSnapshot` によるリアルタイムメッセージ
- Markdown レンダリング（marked + DOMPurify でサニタイズ）
- 絵文字リアクション（Firestore ArrayUnion / ArrayRemove）
- メッセージの編集・論理削除
- 画像・ファイル添付（10MB / 50MB 制限）
- 危険ファイル・危険URLの警告表示（Google Safe Browsing API）
- カーソルページネーションによる過去メッセージの追加読み込み

**カレンダー**
- FullCalendar v6 によるコミュニティカレンダー（月表示）
- メンバーの空き状況を○/△/×で表示（匿名集計）
- 個人カレンダー（月/週/日表示、ドラッグ移動対応）
- 自然言語でのスケジュール入力（Gemini 1.5 Flash 解析）
- Web Speech API による音声入力（日本語）
- Google カレンダー同期 / iCal（.ics）インポート
- 予定の公開範囲設定（非公開 / コミュニティ公開）

**地図・場所共有**
- Google Places API によるスポット検索
- チャットへの地図サムネイル付き場所共有

**通知**
- FCM（Firebase Cloud Messaging）によるブラウザプッシュ通知
- チャンネルごとの通知モード（全て / メンション / ミュート）
- 時間帯設定（静寂時間）

**検索**
- ユーザー名検索（コミュニティメンバー）
- メッセージ全文検索（TODO: Algolia/Typesense 連携）
- 場所検索（Google Places）

#### バックエンド（Go 1.22 + Fiber v2）

**認証・ミドルウェア**
- Firebase Admin SDK による JWT 検証
- CORS ミドルウェア

**API エンドポイント**
- `/api/v1/auth/verify` — ユーザー登録・更新
- `/api/v1/communities` — コミュニティ CRUD・招待・メンバー管理
- `/api/v1/communities/:id/channels` — チャンネル管理
- `/api/v1/channels/:id/messages` — メッセージ CRUD・リアクション
- `/api/v1/events` — カレンダーイベント CRUD
- `/api/v1/events/parse` — Gemini による自然言語解析
- `/api/v1/events/sync/google` — Google カレンダー同期
- `/api/v1/events/import/ics` — iCal インポート
- `/api/v1/communities/:id/availability` — ○/△/× 集計
- `/api/v1/upload/image` `/upload/file` — Firebase Storage アップロード
- `/api/v1/url/check` — Safe Browsing URL 確認
- `/api/v1/search/*` — ユーザー・メッセージ・場所検索
- `/api/v1/notifications/*` — FCM トークン登録・設定

**サービス**
- `availability.Calculator` — ○/△/× ハイブリッド計算（ルールベース + Gemini）、1時間キャッシュ
- `gemini.Client` — スケジュールテキスト解析、空き状況計算
- `calendar.GoogleCalendarService` — Google Calendar API v3 による予定取得
- `calendar.ParseICS` — RFC 5545 準拠の iCal パーサー
- `safebrowsing.Checker` — Google Safe Browsing API v4
- `upload.Validator` — MIME タイプ・拡張子によるファイル検証

#### Firebase 設定

- `firestore.rules` — コレクション別アクセス制御（メンバーシップ確認・役割チェック）
- `storage.rules` — ファイルサイズ・認証チェック
- `firestore.indexes.json` — チャンネル・イベント・メッセージの複合インデックス
- `firebase.json` — Hosting リライト・CSP ヘッダー・エミュレーター設定

#### ドキュメント

- `設計書.md` — 16セクションの詳細設計書（機能要件・DB設計・API設計・セキュリティ・UI設計）
- `バックエンド言語選定理由.txt` — Go vs Node.js vs Python vs Rust vs Bun 比較
- `work/README.md` — セットアップ・デプロイガイド
- `CHANGELOG.md` — 本ファイル

---

## 今後の予定

- [ ] メッセージ全文検索（Algolia または Typesense 連携）
- [ ] Google カレンダー OAuth フロー（フロントエンド UI）
- [ ] 繰り返し予定の展開処理
- [ ] iOS / Android アプリ（React Native 移植）
- [ ] E2E テスト（Playwright）
- [ ] 単体テスト（Go testing / Vitest）
