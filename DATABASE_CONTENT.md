# Database Content - محتوى قاعدة البيانات

---

## 1. Project Model

> موديل المشاريع - بيعرض أعمال البورتفوليو

**API:** `/api/v1/projects`

| Field            | Type       | Required                                | Unique | Index | Trim | Default    | Select | Validation                                                                                   |
| ---------------- | ---------- | --------------------------------------- | ------ | ----- | ---- | ---------- | ------ | -------------------------------------------------------------------------------------------- |
| `title`          | String     | Yes - `'Title is required'`             | Yes    | Yes   | Yes  | -          | -      | -                                                                                            |
| `slug`           | String     | -                                       | -      | Yes   | -    | -          | -      | يتولد تلقائي من الـ title                                                                    |
| `original_slug`  | String     | -                                       | -      | -     | -    | -          | -      | يتولد تلقائي من الـ title                                                                    |
| `tag`            | String     | Yes - `'Tag is required'`               | -      | -     | Yes  | -          | -      | -                                                                                            |
| `isActive`       | Boolean    | -                                       | -      | -     | -    | `true`     | -      | -                                                                                            |
| `url`            | String     | Yes - `'Url is required'`               | -      | -     | Yes  | -          | -      | لازم يكون URL صالح (بيستخدم `new URL()`) - `'Please provide a valid URL'`                    |
| `tagIds`         | [ObjectId] | Yes - `'Tags are required'`             | -      | -     | -    | -          | -      | ref: `Skill` - لازم يكون 3 عناصر على الأقل - `'Project must have at least 3 skills as tags'` |
| `image`          | String     | Yes - `'Image is required'`             | -      | -     | -    | -          | -      | -                                                                                            |
| `altText`        | String     | Yes - `'Alt text is required'`          | -      | -     | Yes  | -          | -      | -                                                                                            |
| `createdAt`      | Date       | -                                       | -      | Yes   | -    | `Date.now` | Yes    | -                                                                                            |
| `user`           | ObjectId   | Yes - `'Project must belong to a user'` | -      | Yes   | -    | -          | -      | ref: `User`                                                                                  |
| `documentNumber` | Number     | -                                       | Yes    | Yes   | -    | -          | -      | auto-increment (من Counter Plugin)                                                           |

### Virtual Fields

| Virtual | الوصف                                                              |
| ------- | ------------------------------------------------------------------ |
| `tags`  | بيعمل populate للـ `tagIds` من موديل `Skill` وبيرجع الـ `title` بس |

### Indexes - الفهارس

| Index                         | النوع |
| ----------------------------- | ----- |
| `{ slug: 1, user: 1 }`        | مركب  |
| `{ createdAt: -1, title: 1 }` | مركب  |

### Middleware

- **Pre-save:** بيولد `original_slug` و `slug` من الـ `title`
- **Pre-findOneAndUpdate:** بيحدث الـ `slug` لو الـ `title` اتغير

### API Endpoints

| Method | Route         | الوصف                         | الصلاحيات |
| ------ | ------------- | ----------------------------- | --------- |
| GET    | `/`           | كل المشاريع (paginated)       | عام       |
| POST   | `/`           | إنشاء مشروع                   | admin/dev |
| GET    | `/all`        | كل المشاريع (بدون pagination) | عام       |
| DELETE | `/delete-all` | حذف كل المشاريع               | dev فقط   |
| GET    | `/:id`        | مشروع بالـ ID                 | عام       |
| PATCH  | `/:id`        | تحديث مشروع                   | admin/dev |
| DELETE | `/:id`        | حذف مشروع                     | admin/dev |

---

## 2. Blog Model

> موديل المقالات - بيدعم المحتوى الكامل مع جدول المحتويات وتتبع المشاهدات

**API:** `/api/v1/blogs`

| Field             | Type                                      | Required                             | Unique | Index | Trim | Default    | Select               | Enum                                 | Validation                           |
| ----------------- | ----------------------------------------- | ------------------------------------ | ------ | ----- | ---- | ---------- | -------------------- | ------------------------------------ | ------------------------------------ |
| `title`           | String                                    | Yes - `'Title is required'`          | Yes    | Yes   | Yes  | -          | -                    | -                                    | -                                    |
| `slug`            | String                                    | -                                    | -      | Yes   | -    | -          | -                    | -                                    | يتولد تلقائي من الـ title            |
| `original_slug`   | String                                    | -                                    | -      | -     | -    | -          | -                    | -                                    | يتولد تلقائي من الـ title            |
| `description`     | String                                    | Yes - `'Description is required'`    | -      | -     | Yes  | -          | -                    | -                                    | -                                    |
| `content`         | String                                    | Yes - `'Content is required'`        | -      | -     | Yes  | -          | -                    | -                                    | بيتعالج تلقائي لاستخراج الـ headings |
| `tableOfContents` | [{ id, text, level }]                     | -                                    | -      | -     | -    | `[]`       | -                    | -                                    | بيتولد تلقائي من الـ content         |
| `image`           | String                                    | Yes - `'Image is required'`          | -      | -     | -    | -          | -                    | -                                    | -                                    |
| `altText`         | String                                    | No                                   | -      | -     | Yes  | -          | -                    | -                                    | -                                    |
| `tags`            | String                                    | Yes - `'Tags is required'`           | -      | -     | Yes  | -          | -                    | -                                    | -                                    |
| `keywords`        | String                                    | Yes - `'Keywords are required'`      | -      | -     | Yes  | -          | -                    | -                                    | -                                    |
| `links`           | [{ url (required), title }]               | No                                   | -      | -     | -    | `[]`       | -                    | -                                    | -                                    |
| `viewHistory`     | [{ ip, userAgent, timestamp, sessionId }] | -                                    | -      | -     | -    | `[]`       | No (`select: false`) | -                                    | مخفي من الـ queries العادية للأداء   |
| `uniqueViews`     | Number                                    | -                                    | -      | -     | -    | `0`        | -                    | -                                    | -                                    |
| `status`          | String                                    | -                                    | -      | -     | -    | `'draft'`  | -                    | `['draft', 'published', 'archived']` | -                                    |
| `isArabicArticle` | Boolean                                   | -                                    | -      | -     | -    | `true`     | -                    | -                                    | -                                    |
| `createdAt`       | Date                                      | -                                    | -      | Yes   | -    | `Date.now` | Yes                  | -                                    | -                                    |
| `user`            | ObjectId                                  | Yes - `'Blog must belong to a user'` | -      | Yes   | -    | -          | -                    | -                                    | ref: `User`                          |
| `documentNumber`  | Number                                    | -                                    | Yes    | Yes   | -    | -          | -                    | -                                    | auto-increment (من Counter Plugin)   |

### tableOfContents Sub-Schema

| Field   | Type   | الوصف                           |
| ------- | ------ | ------------------------------- |
| `id`    | String | معرف العنوان (للربط)            |
| `text`  | String | نص العنوان                      |
| `level` | Number | مستوى العنوان (h1=1, h2=2, ...) |

### links Sub-Schema

| Field   | Type   | Required | الوصف        |
| ------- | ------ | -------- | ------------ |
| `url`   | String | Yes      | رابط         |
| `title` | String | No       | عنوان الرابط |

### viewHistory Sub-Schema

| Field       | Type   | Required | Default    | الوصف           |
| ----------- | ------ | -------- | ---------- | --------------- |
| `ip`        | String | Yes      | -          | عنوان الـ IP    |
| `userAgent` | String | No       | -          | معلومات المتصفح |
| `timestamp` | Date   | -        | `Date.now` | وقت المشاهدة    |
| `sessionId` | String | No       | -          | معرف الجلسة     |

### Indexes - الفهارس

| Index                                                                   | النوع                    |
| ----------------------------------------------------------------------- | ------------------------ |
| `{ slug: 1, user: 1 }`                                                  | مركب                     |
| `{ createdAt: -1, title: 1 }`                                           | مركب                     |
| `{ title: 'text', description: 'text', content: 'text', tags: 'text' }` | Text Index - للبحث النصي |

### Middleware

- **Pre-save:** بيولد `original_slug` و `slug` من الـ `title`
- **Pre-save:** بيعالج الـ `content` ويستخرج الـ headings ويولد `tableOfContents` باستخدام `parseHeadings`
- **Pre-findOneAndUpdate:** بيحدث الـ `slug` والـ `tableOfContents` لو الـ `title` أو `content` اتغيروا

### API Endpoints

| Method | Route         | الوصف                         | الصلاحيات |
| ------ | ------------- | ----------------------------- | --------- |
| GET    | `/`           | كل المقالات (paginated)       | عام       |
| POST   | `/`           | إنشاء مقالة                   | admin/dev |
| GET    | `/all`        | كل المقالات (بدون pagination) | عام       |
| DELETE | `/delete-all` | حذف كل المقالات               | dev فقط   |
| GET    | `/slug/:slug` | مقالة بالـ slug               | عام       |
| GET    | `/:id`        | مقالة بالـ ID                 | عام       |
| PATCH  | `/:id`        | تحديث مقالة                   | admin/dev |
| DELETE | `/:id`        | حذف مقالة                     | admin/dev |

### Views API - `/api/v1/views`

| Method | Route            | الوصف                           | الصلاحيات |
| ------ | ---------------- | ------------------------------- | --------- |
| GET    | `/stats/:blogId` | إحصائيات المشاهدات لمقالة معينة | admin/dev |
| POST   | `/cleanup`       | تنظيف سجلات المشاهدات القديمة   | admin/dev |
| POST   | `/reset`         | إعادة تعيين كل المشاهدات        | admin/dev |

---

## 3. Service Model

> موديل الخدمات - بيعرض الخدمات المقدمة

**API:** `/api/v1/services`

| Field            | Type     | Required                                | Unique | Index | Trim | Default    | Select | Validation                         |
| ---------------- | -------- | --------------------------------------- | ------ | ----- | ---- | ---------- | ------ | ---------------------------------- |
| `title`          | String   | Yes - `'Title is required'`             | Yes    | Yes   | Yes  | -          | -      | -                                  |
| `slug`           | String   | -                                       | -      | Yes   | -    | -          | -      | يتولد تلقائي من الـ title          |
| `original_slug`  | String   | -                                       | -      | -     | -    | -          | -      | يتولد تلقائي من الـ title          |
| `description`    | String   | Yes - `'Description is required'`       | -      | -     | Yes  | -          | -      | -                                  |
| `image`          | String   | Yes - `'Image is required'`             | -      | -     | -    | -          | -      | -                                  |
| `altText`        | String   | Yes - `'Alt text is required'`          | -      | -     | Yes  | -          | -      | -                                  |
| `createdAt`      | Date     | -                                       | -      | Yes   | -    | `Date.now` | Yes    | -                                  |
| `user`           | ObjectId | Yes - `'Service must belong to a user'` | -      | Yes   | -    | -          | -      | ref: `User`                        |
| `documentNumber` | Number   | -                                       | Yes    | Yes   | -    | -          | -      | auto-increment (من Counter Plugin) |

### Indexes - الفهارس

| Index                         | النوع |
| ----------------------------- | ----- |
| `{ slug: 1, user: 1 }`        | مركب  |
| `{ createdAt: -1, title: 1 }` | مركب  |

### Middleware

- **Pre-save:** بيولد `original_slug` و `slug` من الـ `title`
- **Pre-findOneAndUpdate:** بيحدث الـ `slug` لو الـ `title` اتغير

### API Endpoints

| Method | Route         | الوصف                        | الصلاحيات |
| ------ | ------------- | ---------------------------- | --------- |
| GET    | `/`           | كل الخدمات (paginated)       | عام       |
| POST   | `/`           | إنشاء خدمة                   | admin/dev |
| GET    | `/all`        | كل الخدمات (بدون pagination) | عام       |
| DELETE | `/delete-all` | حذف كل الخدمات               | dev فقط   |
| GET    | `/:id`        | خدمة بالـ ID                 | عام       |
| PATCH  | `/:id`        | تحديث خدمة                   | admin/dev |
| DELETE | `/:id`        | حذف خدمة                     | admin/dev |

---

## 4. Skill Model

> موديل المهارات - بيعرض المهارات التقنية وبيستخدم كـ tags للمشاريع

**API:** `/api/v1/skills`

| Field            | Type     | Required                              | Unique | Index | Trim | Default    | Select | Validation                         |
| ---------------- | -------- | ------------------------------------- | ------ | ----- | ---- | ---------- | ------ | ---------------------------------- |
| `title`          | String   | Yes - `'Title is required'`           | Yes    | Yes   | Yes  | -          | -      | -                                  |
| `slug`           | String   | -                                     | -      | Yes   | -    | -          | -      | يتولد تلقائي من الـ title          |
| `original_slug`  | String   | -                                     | -      | -     | -    | -          | -      | يتولد تلقائي من الـ title          |
| `icon`           | String   | Yes - `'Icon is required'`            | -      | -     | Yes  | -          | -      | -                                  |
| `createdAt`      | Date     | -                                     | -      | Yes   | -    | `Date.now` | Yes    | -                                  |
| `user`           | ObjectId | Yes - `'Skill must belong to a user'` | -      | Yes   | -    | -          | -      | ref: `User`                        |
| `documentNumber` | Number   | -                                     | Yes    | Yes   | -    | -          | -      | auto-increment (من Counter Plugin) |

### Indexes - الفهارس

| Index                         | النوع |
| ----------------------------- | ----- |
| `{ slug: 1, user: 1 }`        | مركب  |
| `{ createdAt: -1, title: 1 }` | مركب  |

### Middleware

- **Pre-save:** بيولد `original_slug` و `slug` من الـ `title`
- **Pre-findOneAndUpdate:** بيحدث الـ `slug` لو الـ `title` اتغير

### API Endpoints

| Method | Route         | الوصف                         | الصلاحيات |
| ------ | ------------- | ----------------------------- | --------- |
| GET    | `/`           | كل المهارات (paginated)       | عام       |
| POST   | `/`           | إنشاء مهارة                   | admin/dev |
| GET    | `/all`        | كل المهارات (بدون pagination) | عام       |
| DELETE | `/delete-all` | حذف كل المهارات               | dev فقط   |
| GET    | `/:id`        | مهارة بالـ ID                 | عام       |
| PATCH  | `/:id`        | تحديث مهارة                   | admin/dev |
| DELETE | `/:id`        | حذف مهارة                     | admin/dev |

---

## 5. Client Model

> موديل العملاء - بيعرض العملاء اللي اتعامل معاهم

**API:** `/api/v1/clients`

| Field            | Type     | Required                               | Unique | Index | Trim | Default    | Select | Validation                         |
| ---------------- | -------- | -------------------------------------- | ------ | ----- | ---- | ---------- | ------ | ---------------------------------- |
| `name`           | String   | Yes - `'Name is required'`             | Yes    | Yes   | Yes  | -          | -      | -                                  |
| `slug`           | String   | -                                      | -      | Yes   | -    | -          | -      | يتولد تلقائي من الـ name           |
| `original_slug`  | String   | -                                      | -      | -     | -    | -          | -      | يتولد تلقائي من الـ name           |
| `image`          | String   | Yes - `'Image is required'`            | -      | -     | -    | -          | -      | -                                  |
| `altText`        | String   | No                                     | -      | -     | Yes  | -          | -      | -                                  |
| `website`        | String   | No                                     | -      | -     | -    | -          | -      | -                                  |
| `createdAt`      | Date     | -                                      | -      | Yes   | -    | `Date.now` | Yes    | -                                  |
| `user`           | ObjectId | Yes - `'Client must belong to a user'` | -      | Yes   | -    | -          | -      | ref: `User`                        |
| `documentNumber` | Number   | -                                      | Yes    | Yes   | -    | -          | -      | auto-increment (من Counter Plugin) |

### Indexes - الفهارس

| Index                        | النوع |
| ---------------------------- | ----- |
| `{ slug: 1, user: 1 }`       | مركب  |
| `{ createdAt: -1, name: 1 }` | مركب  |

### Middleware

- **Pre-save:** بيولد `original_slug` و `slug` من الـ `name`
- **Pre-findOneAndUpdate:** بيحدث الـ `slug` لو الـ `name` اتغير

### API Endpoints

| Method | Route         | الوصف                        | الصلاحيات |
| ------ | ------------- | ---------------------------- | --------- |
| GET    | `/`           | كل العملاء (paginated)       | عام       |
| POST   | `/`           | إنشاء عميل                   | admin/dev |
| GET    | `/all`        | كل العملاء (بدون pagination) | عام       |
| DELETE | `/delete-all` | حذف كل العملاء               | dev فقط   |
| GET    | `/:id`        | عميل بالـ ID                 | عام       |
| PATCH  | `/:id`        | تحديث عميل                   | admin/dev |
| DELETE | `/:id`        | حذف عميل                     | admin/dev |

---

## 6. Contact Model

> موديل الرسائل - بيستقبل رسائل التواصل من الزوار

**API:** `/api/v1/contacts`

| Field            | Type    | Required                            | Unique | Index | Trim | Default    | Select | Lowercase | Validation                                    |
| ---------------- | ------- | ----------------------------------- | ------ | ----- | ---- | ---------- | ------ | --------- | --------------------------------------------- |
| `name`           | String  | Yes - `'Name is required.'`         | -      | -     | -    | -          | -      | -         | -                                             |
| `email`          | String  | No                                  | -      | -     | -    | -          | -      | Yes       | `validator.isEmail` - `'Email is not valid.'` |
| `phone`          | String  | Yes - `'Phone number is required.'` | -      | -     | -    | -          | -      | -         | -                                             |
| `slug`           | String  | -                                   | -      | -     | -    | -          | -      | -         | يتولد تلقائي من الـ name                      |
| `original_slug`  | String  | -                                   | -      | -     | -    | -          | -      | -         | يتولد تلقائي من الـ name                      |
| `description`    | String  | Yes - `'Description is required.'`  | -      | -     | -    | -          | -      | -         | -                                             |
| `isViewed`       | Boolean | -                                   | -      | -     | -    | `false`    | -      | -         | هل الرسالة اتشافت ولا لأ                      |
| `createdAt`      | Date    | -                                   | -      | -     | -    | `Date.now` | Yes    | -         | -                                             |
| `documentNumber` | Number  | -                                   | Yes    | Yes   | -    | -          | -      | -         | auto-increment (من Counter Plugin)            |

### Indexes - الفهارس

| Index                  | النوع |
| ---------------------- | ----- |
| `{ slug: 1, name: 1 }` | مركب  |

### Middleware

- **Pre-save:** بيولد `original_slug` و `slug` من الـ `name`
- **Pre-findOneAndUpdate:** بيحدث الـ `slug` لو الـ `name` اتغير

### API Endpoints

| Method | Route  | الوصف                       | الصلاحيات |
| ------ | ------ | --------------------------- | --------- |
| GET    | `/`    | كل الرسائل                  | عام       |
| POST   | `/`    | إرسال رسالة (+ إرسال إيميل) | عام       |
| GET    | `/:id` | رسالة بالـ ID               | عام       |
| PATCH  | `/:id` | تحديث رسالة                 | admin/dev |
| DELETE | `/:id` | حذف رسالة                   | admin/dev |

---

## 7. Testimonial Model

> موديل التوصيات/الشهادات - بيستقبل آراء العملاء وبيحتاج تأكيد من الأدمن

**API:** `/api/v1/testimonials`

| Field            | Type    | Required                           | Unique | Index | Trim | Default    | Select | Lowercase | Validation                                    |
| ---------------- | ------- | ---------------------------------- | ------ | ----- | ---- | ---------- | ------ | --------- | --------------------------------------------- |
| `name`           | String  | Yes - `'Name is required.'`        | -      | -     | -    | -          | -      | -         | -                                             |
| `email`          | String  | Yes - `'Email is required.'`       | -      | -     | -    | -          | -      | Yes       | `validator.isEmail` - `'Email is not valid.'` |
| `slug`           | String  | -                                  | -      | -     | -    | -          | -      | -         | يتولد تلقائي من الـ name                      |
| `original_slug`  | String  | -                                  | -      | -     | -    | -          | -      | -         | يتولد تلقائي من الـ name                      |
| `description`    | String  | Yes - `'Description is required.'` | -      | -     | -    | -          | -      | -         | -                                             |
| `image`          | String  | Yes - `'Image is required.'`       | -      | -     | -    | -          | -      | -         | -                                             |
| `isConfirmed`    | Boolean | -                                  | -      | -     | -    | `false`    | -      | -         | هل التوصية متأكدة من الأدمن ولا لأ            |
| `createdAt`      | Date    | -                                  | -      | -     | -    | `Date.now` | Yes    | -         | -                                             |
| `documentNumber` | Number  | -                                  | Yes    | Yes   | -    | -          | -      | -         | auto-increment (من Counter Plugin)            |

### Indexes - الفهارس

| Index                  | النوع |
| ---------------------- | ----- |
| `{ slug: 1, name: 1 }` | مركب  |

### Middleware

- **Pre-save:** بيولد `original_slug` و `slug` من الـ `name`
- **Pre-findOneAndUpdate:** بيحدث الـ `slug` لو الـ `name` اتغير

### API Endpoints

| Method | Route        | الوصف                    | الصلاحيات |
| ------ | ------------ | ------------------------ | --------- |
| GET    | `/`          | كل التوصيات              | admin/dev |
| POST   | `/`          | إنشاء توصية              | عام       |
| GET    | `/confirmed` | التوصيات المؤكدة فقط     | عام       |
| GET    | `/:id`       | توصية بالـ ID            | عام       |
| PATCH  | `/:id`       | تحديث توصية (تأكيد مثلا) | admin/dev |
| DELETE | `/:id`       | حذف توصية                | admin/dev |

---

## 8. Resource Model

> موديل المصادر/الروابط المفيدة

**API:** `/api/v1/resources`

| Field            | Type     | Required                                 | Unique | Index | Trim | Default    | Select | Validation                                         |
| ---------------- | -------- | ---------------------------------------- | ------ | ----- | ---- | ---------- | ------ | -------------------------------------------------- |
| `title`          | String   | Yes - `'Title is required'`              | Yes    | Yes   | Yes  | -          | -      | -                                                  |
| `slug`           | String   | -                                        | -      | Yes   | -    | -          | -      | يتولد تلقائي من الـ title                          |
| `original_slug`  | String   | -                                        | -      | -     | -    | -          | -      | يتولد تلقائي من الـ title                          |
| `url`            | String   | Yes - `'URL is required'`                | -      | -     | -    | -          | -      | `validator.isURL` - `'Please provide a valid URL'` |
| `createdAt`      | Date     | -                                        | -      | Yes   | -    | `Date.now` | Yes    | -                                                  |
| `user`           | ObjectId | Yes - `'Resource must belong to a user'` | -      | Yes   | -    | -          | -      | ref: `User`                                        |
| `documentNumber` | Number   | -                                        | Yes    | Yes   | -    | -          | -      | auto-increment (من Counter Plugin)                 |

### Indexes - الفهارس

| Index                         | النوع |
| ----------------------------- | ----- |
| `{ slug: 1, user: 1 }`        | مركب  |
| `{ createdAt: -1, title: 1 }` | مركب  |

### Middleware

- **Pre-save:** بيولد `original_slug` و `slug` من الـ `title`
- **Pre-findOneAndUpdate:** بيحدث الـ `slug` لو الـ `title` اتغير

### API Endpoints

| Method | Route         | الوصف                        | الصلاحيات |
| ------ | ------------- | ---------------------------- | --------- |
| GET    | `/`           | كل المصادر (paginated)       | عام       |
| POST   | `/`           | إنشاء مصدر                   | admin/dev |
| GET    | `/all`        | كل المصادر (بدون pagination) | عام       |
| DELETE | `/delete-all` | حذف كل المصادر               | dev فقط   |
| GET    | `/:id`        | مصدر بالـ ID                 | عام       |
| PATCH  | `/:id`        | تحديث مصدر                   | admin/dev |
| DELETE | `/:id`        | حذف مصدر                     | admin/dev |

---

## 9. Info Model

> موديل المعلومات العامة - حاليا بيحتوي على رابط السيرة الذاتية فقط

**API:** `/api/v1/infos`

| Field       | Type   | Required                         | Unique | Index | Trim | Default    | Select | Validation                                                        |
| ----------- | ------ | -------------------------------- | ------ | ----- | ---- | ---------- | ------ | ----------------------------------------------------------------- |
| `resumeUrl` | String | Yes - `'Resume URL is required'` | -      | -     | -    | -          | -      | `validator.isURL` - `'Please provide a valid URL for the resume'` |
| `createdAt` | Date   | -                                | -      | Yes   | -    | `Date.now` | Yes    | -                                                                 |

### Indexes - الفهارس

| Index                    | النوع         |
| ------------------------ | ------------- |
| `{ fieldToBeUnique: 1 }` | فردي (unique) |

### API Endpoints

| Method | Route         | الوصف                          | الصلاحيات |
| ------ | ------------- | ------------------------------ | --------- |
| GET    | `/`           | كل المعلومات (paginated)       | عام       |
| POST   | `/`           | إنشاء معلومة                   | admin/dev |
| GET    | `/all`        | كل المعلومات (بدون pagination) | عام       |
| DELETE | `/delete-all` | حذف كل المعلومات               | dev فقط   |
| GET    | `/:id`        | معلومة بالـ ID                 | عام       |
| PATCH  | `/:id`        | تحديث معلومة                   | admin/dev |
| DELETE | `/:id`        | حذف معلومة                     | admin/dev |

---

## Counter Plugin

> بلجن بيضيف ترقيم تلقائي لكل document جديد في أي model بيستخدمه

**الملف:** `models/plugins/counterPlugin.js`

**مستخدم في:** Project, Blog, Service, Skill, Client, Contact, Testimonial, Resource

| Field            | Type   | Unique | Index | الوصف                                       |
| ---------------- | ------ | ------ | ----- | ------------------------------------------- |
| `documentNumber` | Number | Yes    | Yes   | رقم تسلسلي بيزيد تلقائي مع كل document جديد |

### طريقة العمل

- لما يتعمل document جديد (`isNew`)، بيدور على آخر `documentNumber` في الـ collection
- لو لقى، بيزود عليه 1
- لو ما لقاش (أول document)، بيبدأ من 1

---

## Landing Page API

> بيجمع بيانات من كذا model في endpoint واحد للصفحة الرئيسية

**API:** `/api/v1/landing`

| Method | Route | الوصف                          | الصلاحيات |
| ------ | ----- | ------------------------------ | --------- |
| GET    | `/`   | بيانات الصفحة الرئيسية (مجمعة) | عام       |

---

## Build Project API

> بيعمل build للمشروع

**API:** `/api/v1/build-project`

| Method | Route | الوصف               | الصلاحيات |
| ------ | ----- | ------------------- | --------- |
| POST   | `/`   | تشغيل build للمشروع | admin/dev |

---

## Schema Options المشتركة

كل الـ Models (ما عدا Info) عندها:

```js
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}
```

ده معناه إن الـ virtual fields بتظهر لما نحول الـ document لـ JSON أو Object.
