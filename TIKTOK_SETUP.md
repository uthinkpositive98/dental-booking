# TikTok Publisher — วิธีติดตั้ง

## ไฟล์ที่เพิ่ม/แก้
| ไฟล์ | หน้าที่ |
|---|---|
| `tiktok/index.html` | หน้า `/tiktok` — ปุ่ม Login with TikTok, ชื่อบัญชีที่เชื่อม, ฟอร์มเลือกวิดีโอ + caption + privacy + toggle + ยืนยันโพสต์ |
| `api/tiktok/login.js` | ส่งผู้ใช้ไปหน้าขอสิทธิ์ของ TikTok |
| `api/tiktok/callback.js` | รับ code กลับมาแลกเป็น access token (เก็บในคุกกี้เข้ารหัส) |
| `api/tiktok/me.js` | ดึงชื่อบัญชี (user.info.basic) + creator_info |
| `api/tiktok/init.js` | เริ่ม Direct Post (video.publish) |
| `api/tiktok/upload.js` | ส่งไฟล์วิดีโอขนาดเล็ก (<4MB) ต่อไปให้ TikTok |
| `api/tiktok/status.js` | เช็กสถานะโพสต์ |
| `api/tiktok/logout.js` | ยกเลิกการเชื่อมต่อ |
| `api/_lib/tiktok.js` | ฟังก์ชันใช้ร่วม |
| `privacy/index.html`, `terms/index.html` | Privacy Policy / Terms of Service (TikTok ขอ URL ทั้งสองหน้า) |
| `index.html` | เพิ่มลิงก์ TikTok Publisher / Privacy / Terms ที่ footer |

## ขั้นตอน
1. **อัปโหลดไฟล์ขึ้น GitHub repo เดิม** → Vercel deploy ให้อัตโนมัติ
2. **Vercel → Project → Settings → Environment Variables** ใส่:
   - `TIKTOK_CLIENT_KEY` = Client key (ดูในหน้าแอป TikTok Developer)
   - `TIKTOK_CLIENT_SECRET` = Client secret
   - (ไม่บังคับ) `SESSION_SECRET` = ข้อความสุ่มยาวๆ ใช้เข้ารหัสคุกกี้
   แล้วกด **Redeploy**
3. **TikTok Developer → แอป → Login Kit → Redirect URI** ใส่:
   `https://dental-booking-seven.vercel.app/api/tiktok/callback`
4. **ช่อง URL ในฟอร์ม TikTok**
   - Web/Desktop URL: `https://dental-booking-seven.vercel.app/tiktok/`
   - Terms of Service URL: `https://dental-booking-seven.vercel.app/terms/`
   - Privacy Policy URL: `https://dental-booking-seven.vercel.app/privacy/`
   - ถ้า TikTok ให้ verify URL ด้วยไฟล์ (`tiktokXXXX.txt`) → วางไฟล์นั้นไว้ที่โฟลเดอร์บนสุดของโปรเจกต์ (ข้าง `index.html`) แล้ว deploy ใหม่ จากนั้นกด Verify
5. **Sandbox** → เพิ่มบัญชี TikTok ของคลินิกเป็น Target user แล้วลองโพสต์ที่ `/tiktok`
   - แอปที่ยังไม่ผ่าน audit จะโพสต์ได้แค่ **Only me** (เป็นเรื่องปกติ)
6. **อัดวิดีโอเดโม** แล้วกด Submit

## หมายเหตุ
- วิดีโอเดโมควรใช้คลิปสั้นขนาด **ต่ำกว่า 4MB** (ส่งผ่านเซิร์ฟเวอร์ Vercel ได้ชัวร์) คลิปที่ใหญ่กว่านั้นเบราว์เซอร์จะส่งตรงไป TikTok ซึ่งอาจโดนบล็อก (CORS)
- ไม่ต้องมี package.json — Vercel รันไฟล์ในโฟลเดอร์ `api/` เป็น serverless function ให้เอง
