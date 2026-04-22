# Lovely AI Assistant - Cài đặt cục bộ

Một trợ lý AI siêu dễ thương được xây dựng bằng React 19, Express và Gemini AI.

## Yêu cầu
- Node.js version 20 trở lên.
- API Key từ [Google AI Studio](https://aistudio.google.com/app/apikey).

## Cài đặt

1. Giải nén file ZIP đã tải về.
2. Mở terminal trong thư mục dự án và cài đặt dependencies:
   ```bash
   npm install
   ```

3. Tạo file `.env` (nếu chưa có) và thêm API Key của bạn:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Chạy ứng dụng

Ở chế độ phát triển (Cả giao diện và Server):
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:3000`

## Build cho sản phẩm
Mã nguồn đã được tối ưu hóa để có thể deploy lên các nền tảng như Cloud Run hoặc các VPS hỗ trợ Node.js.
```bash
npm run build
npm start
```

Chúc bạn có những trải nghiệm thật ngọt ngào cùng Lovely AI! (✿◠‿◠)
