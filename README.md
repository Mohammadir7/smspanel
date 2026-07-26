# پنل پیامک — اسکلت اولیه

## اجرا

### ۱) سرور Go

```powershell
cd "C:\Users\Island\Cursor Projects\1"
go mod tidy
go run ./cmd/server
```

متغیرهای اختیاری (`.env` یا محیط):

| متغیر | توضیح |
|--------|--------|
| `FARAZ_API_KEY` | خالی = ارسال شبیه‌سازی |
| `FARAZ_LINE_NUMBER` | خط فراز |
| `ZARINPAL_MERCHANT_ID` | خالی = درگاه رد می‌شود |
| `JWT_SECRET` | production الزامی |

### ۲) رابط دسکتاپ (وب RTL)

```powershell
cd web
npm install
npm run dev
```

مرورگر: `http://localhost:5173` — پنجره **ردیابی مراحل** پایین صفحه.

### ورود demo

| نقش | موبایل | رمز |
|-----|--------|-----|
| admin | 09120000001 | admin123 |
| user | 09120000002 | user123 |

موجودی اولیه user: ۵۰۰٬۰۰۰ ریال (demo).

## ماژول‌ها

`auth`, `users`, `wallet`, `sms`, `providers/faraz`, `queue`, `billing`, `pricing`, `filter`, `trace`, `httpapi`

## فیلتر demo

کلمه `کلمه_نمونه_ممنوع` در متن → رد می‌شود (ادمین CRUD بعداً).
