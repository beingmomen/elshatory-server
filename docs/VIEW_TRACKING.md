# نظام تتبع المشاهدات المحسن

## نظرة عامة

تم تطوير نظام تتبع المشاهدات ليكون أكثر دقة وموثوقية، مع منع المشاهدات المزيفة والمتكررة من نفس المستخدم.

## الميزات الجديدة

### 1. تتبع المشاهدات الذكي
- **تتبع IP Address**: منع المشاهدات المتكررة من نفس العنوان
- **تتبع User Agent**: التمييز بين المتصفحات المختلفة
- **تتبع Session ID**: التمييز بين الجلسات المختلفة
- **نافذة زمنية**: منع المشاهدات المتكررة خلال 30 دقيقة
- **فلترة الدومين**: حساب المشاهدات فقط من الدومين المعتمد `https://beingmomen.com`

### 2. حقول قاعدة البيانات الجديدة
```javascript
// في blogModel.js
viewHistory: [{
  ip: String,           // عنوان IP للمستخدم
  userAgent: String,    // معلومات المتصفح
  timestamp: Date,      // وقت المشاهدة
  sessionId: String     // معرف الجلسة
}],
uniqueViews: {         // عدد المشاهدات الفريدة
  type: Number,
  default: 0
}
```

### 3. منطق التحقق من المشاهدات
```javascript
// التحقق من الدومين المسموح
const referer = req.get('Referer') || req.get('Origin') || '';
const allowedDomain = 'https://beingmomen.com';
const isFromAllowedDomain = referer.startsWith(allowedDomain);

// حساب المشاهدات فقط من الدومين المعتمد
if (isFromAllowedDomain) {
  // التحقق من المشاهدة السابقة خلال 30 دقيقة
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const recentView = blog.viewHistory.find(view => 
    view.ip === clientIP &&
    view.timestamp > thirtyMinutesAgo
  );
}
```

## API الجديد لإدارة المشاهدات

### 1. الحصول على إحصائيات المشاهدات
```http
GET /api/v1/views/stats/:blogId
Authorization: Bearer <token>
```

**الاستجابة:**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalViews": 150,
      "uniqueViews": 120,
      "viewsLast24Hours": 25,
      "viewsLastWeek": 80,
      "viewsLastMonth": 140,
      "uniqueIPsLast24Hours": 20,
      "uniqueIPsLastWeek": 65,
      "uniqueIPsLastMonth": 95
    }
  }
}
```

### 2. تنظيف السجلات القديمة
```http
POST /api/v1/views/cleanup
Authorization: Bearer <token>
```

يحذف سجلات المشاهدات الأقدم من 90 يوماً للحفاظ على الأداء.

### 3. إعادة تعيين جميع المشاهدات (للتطوير)
```http
POST /api/v1/views/reset
Authorization: Bearer <token>
```

⚠️ **تحذير**: هذا سيحذف جميع بيانات المشاهدات!

## كيفية الاستخدام

### 1. للمطورين
```javascript
// إعادة تعيين المشاهدات أثناء التطوير
const response = await fetch('/api/v1/views/reset', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
```

### 2. للمشرفين
```javascript
// الحصول على إحصائيات مقال معين
const stats = await fetch(`/api/v1/views/stats/${blogId}`, {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// تنظيف السجلات القديمة
const cleanup = await fetch('/api/v1/views/cleanup', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

## الأمان والصلاحيات

- جميع endpoints محمية بـ authentication
- مقتصرة على المشرفين والمطورين فقط
- تسجيل جميع العمليات في console

## الصيانة الدورية

### تنظيف تلقائي (اختياري)
يمكن إضافة cron job لتنظيف السجلات القديمة تلقائياً:

```javascript
// في server.js أو ملف منفصل
const cron = require('node-cron');
const { cleanupOldViews } = require('./utils/viewsCleanup');

// تشغيل كل يوم في الساعة 2:00 صباحاً
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily view cleanup...');
  await cleanupOldViews();
});
```

## الحماية من الدومينات غير المصرح بها

### كيفية عمل فلترة الدومين
النظام يتحقق من `Referer` أو `Origin` header في كل طلب:

```javascript
const referer = req.get('Referer') || req.get('Origin') || '';
const allowedDomain = 'https://beingmomen.com';
const isFromAllowedDomain = referer.startsWith(allowedDomain);
```

### الحالات المحمية
- **الطلبات المباشرة**: من خارج الموقع الرسمي
- **المواقع المزيفة**: التي تحاول سرقة المحتوى
- **الاختبارات المحلية**: من localhost أو domains أخرى
- **البوتات الضارة**: التي تحاول تضخيم المشاهدات

### الاستثناءات
- الطلبات من `https://beingmomen.com` فقط تُحسب
- الطلبات من subdomains مثل `www.beingmomen.com` تُحسب أيضاً
- أي domain آخر لن يؤثر على عداد المشاهدات

## الفوائد

1. **دقة أكبر**: منع المشاهدات المزيفة والمتكررة
2. **إحصائيات مفصلة**: تتبع المشاهدات حسب الفترات الزمنية
3. **أداء محسن**: تنظيف السجلات القديمة تلقائياً
4. **مرونة في الإدارة**: أدوات للمطورين والمشرفين
5. **شفافية**: إحصائيات مفصلة للمشاهدات الفريدة
6. **حماية من التلاعب**: منع المشاهدات من مصادر غير مصرح بها

## ملاحظات مهمة

- النظام يحفظ آخر 90 يوم من سجلات المشاهدات
- المشاهدات من نفس IP خلال 30 دقيقة لا تُحسب
- يمكن للمطورين إعادة تعيين المشاهدات أثناء التطوير
- جميع العمليات مسجلة ومحمية