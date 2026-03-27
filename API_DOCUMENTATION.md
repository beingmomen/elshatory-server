# API Documentation — BeingMomen Server

> Base URL: `{{BASE_URL}}/api/v1`

## Table of Contents

- [Authentication](#authentication)
- [Common Query Parameters](#common-query-parameters)
- [Response Format](#response-format)
- [Endpoints](#endpoints)
  - [Landing](#landing)
  - [Auth (Users)](#auth-users)
  - [User Management (Admin)](#user-management-admin)
  - [Projects](#projects)
  - [Blogs](#blogs)
  - [Services](#services)
  - [Skills](#skills)
  - [Clients](#clients)
  - [Testimonials](#testimonials)
  - [Contacts](#contacts)
  - [Resources](#resources)
  - [Info](#info)
  - [Views (Blog Analytics)](#views-blog-analytics)
  - [Build Project](#build-project)
  - [Health](#health)

---

## Authentication

All protected endpoints require a JWT token sent via:

- **Header:** `Authorization: Bearer <token>`
- **Cookie:** `jwt=<token>` (httpOnly, secure in production)

Roles: `user`, `admin`, `dev`

---

## Common Query Parameters

All paginated `GET /` (getAll) endpoints support:

| Parameter        | Type   | Default            | Description                                                                                   |
| ---------------- | ------ | ------------------ | --------------------------------------------------------------------------------------------- |
| `page`           | Number | `1`                | Page number                                                                                   |
| `limit`          | Number | `10`               | Items per page (max: 100)                                                                     |
| `sort`           | String | `-createdAt`       | Sort fields, comma-separated. Prefix `-` for descending. Example: `-createdAt,title`          |
| `fields`         | String | all (except `__v`) | Fields to include, comma-separated. Example: `title,slug,image`                               |
| `search`         | String | —                  | Search across: `name`, `email`, `title`, `number`, `documentNumber`                           |
| Filter operators | —      | —                  | Any schema field with `[gte]`, `[gt]`, `[lte]`, `[lt]`. Example: `?createdAt[gte]=2024-01-01` |

---

## Response Format

### Success (Single)

```json
{
  "status": "success",
  "data": { ... }
}
```

### Success (List — Paginated)

```json
{
  "status": "success",
  "total": 50,
  "results": 10,
  "data": [ ... ]
}
```

### Success (List — No Pagination)

```json
{
  "status": "success",
  "results": 50,
  "data": [ ... ]
}
```

### Error

```json
{
  "status": "fail",
  "message": "Error description"
}
```

### Validation Error

```json
{
  "status": "fail",
  "message": "Validation failed",
  "errors": {
    "fieldName": "Error message for this field"
  }
}
```

---

## Endpoints

---

### Landing

Public endpoint that returns all data needed for the landing page in a single request.

#### `GET /landing`

- **Auth:** None (public)
- **Rate Limit:** 60 requests/minute

**Response:**

```json
{
  "status": "success",
  "data": {
    "skills": [{ "title": "Firebase", "icon": "i-logos-firebase" }],
    "services": [
      {
        "title": "Web Development",
        "description": "...",
        "altText": "...",
        "image": "https://..."
      }
    ],
    "testimonials": [
      {
        "name": "John",
        "email": "john@example.com",
        "description": "...",
        "image": "https://..."
      }
    ],
    "projects": [
      {
        "title": "My Project",
        "tag": "Web App",
        "url": "https://...",
        "image": "https://...",
        "altText": "...",
        "skills": [{ "title": "Vue.js" }, { "title": "Node.js" }]
      }
    ],
    "projectsTotal": 15,
    "clients": [{ "name": "Company X", "image": "https://..." }],
    "info": { "resumeUrl": "https://..." }
  }
}
```

---

### Auth (Users)

#### `POST /users/signup`

- **Auth:** None (public)

| Field             | Type   | Required | Validation            |
| ----------------- | ------ | -------- | --------------------- |
| `name`            | String | Yes      | 3-50 characters       |
| `email`           | String | Yes      | Valid email           |
| `phone`           | String | Yes      | 7-20 characters       |
| `password`        | String | Yes      | Min 8 characters      |
| `passwordConfirm` | String | Yes      | Must match `password` |

**Response:** `201` — Returns user data + JWT token (also set as cookie)

```json
{
  "status": "success",
  "token": "eyJhbGciOi...",
  "data": {
    "name": "Mohamed",
    "email": "mo@example.com",
    "phone": "01234567890",
    "role": "user",
    "photo": "/images/users/default.jpg",
    "slug": "mohamed",
    "documentNumber": 1,
    "_id": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

#### `POST /users/login`

- **Auth:** None (public)
- **Rate Limit:** Stricter auth rate limiter

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | String | Yes      |
| `password` | String | Yes      |

**Response:** `200` — Returns user data + JWT token

---

#### `POST /users/logout`

- **Auth:** None
- **Response:** `200` — Clears JWT cookie

---

#### `POST /users/forgotPassword`

- **Auth:** None (public)
- **Rate Limit:** Stricter auth rate limiter

| Field         | Type   | Required | Description                        |
| ------------- | ------ | -------- | ---------------------------------- |
| `email`       | String | Yes      | User's email                       |
| `redirectUrl` | String | No       | Custom frontend URL for reset link |

**Response:** `200` — Always returns success (prevents email enumeration)

---

#### `GET /users/resetPassword/:token/validate`

- **Auth:** None (public)
- **Rate Limit:** Stricter auth rate limiter
- **Response:** `200` — Validates token is still valid before showing reset form

---

#### `PATCH /users/resetPassword/:token`

- **Auth:** None (public)

| Field             | Type   | Required |
| ----------------- | ------ | -------- |
| `password`        | String | Yes      |
| `passwordConfirm` | String | Yes      |

**Response:** `200` — Returns user data + new JWT token

---

#### `PATCH /users/updateMyPassword`

- **Auth:** Protected (logged in)

| Field             | Type   | Required |
| ----------------- | ------ | -------- |
| `passwordCurrent` | String | Yes      |
| `password`        | String | Yes      |
| `passwordConfirm` | String | Yes      |

**Response:** `200` — Returns user data + new JWT token

---

#### `GET /users/me`

- **Auth:** Protected (logged in)
- **Response:** `200` — Returns current user's profile

---

#### `PATCH /users/updateMe`

- **Auth:** Protected (logged in)
- **Content-Type:** `multipart/form-data` (if uploading photo)

| Field   | Type   | Required | Description          |
| ------- | ------ | -------- | -------------------- |
| `name`  | String | No       | 3-50 characters      |
| `phone` | String | No       | 7-20 characters      |
| `photo` | File   | No       | Image file (JPG/PNG) |

> **Note:** Email and password cannot be changed here. Use dedicated endpoints.

**Response:** `200` — Returns updated user

---

#### `DELETE /users/deleteMe`

- **Auth:** Protected (logged in)
- **Response:** `204` — Soft delete (sets `active: false`)

---

### User Management (Admin)

All endpoints require: `Auth: Protected` + Role: `admin` or `dev`

#### `GET /users`

Paginated list of all users (excludes `dev` role). Supports [common query parameters](#common-query-parameters).

---

#### `GET /users/admins`

Paginated list of admin users only.

---

#### `GET /users/all`

All users without pagination (excludes `dev` role).

---

#### `GET /users/all/admins`

All admin users without pagination.

---

#### `GET /users/:id`

Get single user by ID. Returns 404 if target is `dev` and requester is not `dev`.

---

#### `POST /users`

Disabled. Returns error redirecting to `/signup`.

---

#### `POST /users/admin`

- **Auth:** `dev` only

| Field             | Type   | Required |
| ----------------- | ------ | -------- |
| `name`            | String | Yes      |
| `email`           | String | Yes      |
| `phone`           | String | Yes      |
| `password`        | String | Yes      |
| `passwordConfirm` | String | Yes      |

**Response:** `201` — Creates user with `admin` role

---

#### `PATCH /users/:id`

- **Content-Type:** `multipart/form-data` (if uploading photo)

| Field    | Type    | Required | Description    |
| -------- | ------- | -------- | -------------- |
| `name`   | String  | No       |                |
| `email`  | String  | No       |                |
| `phone`  | String  | No       |                |
| `active` | Boolean | No       | Enable/disable |
| `photo`  | File    | No       | Image file     |

---

#### `DELETE /users/:id`

Deletes user. Returns 404 if target is `dev` and requester is not `dev`.

---

### Projects

#### `GET /projects`

- **Auth:** None (public)
- **Query:** [Common query parameters](#common-query-parameters)
- **Populates:** `skills` (title only) from `skillIds`

**Response item:**

```json
{
  "_id": "...",
  "documentNumber": 1,
  "title": "My Project",
  "slug": "my-project",
  "tag": "Web App",
  "isActive": true,
  "url": "https://myproject.com",
  "skillIds": ["skillId1", "skillId2", "skillId3"],
  "image": "https://cloudinary.../image.webp",
  "altText": "Project screenshot",
  "user": "userId",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "skills": [
    { "_id": "skillId1", "title": "Vue.js" },
    { "_id": "skillId2", "title": "Node.js" },
    { "_id": "skillId3", "title": "MongoDB" }
  ]
}
```

---

#### `GET /projects/all`

- **Auth:** Protected (admin/dev)
- All projects without pagination.

---

#### `GET /projects/:id`

- **Auth:** None (public)

---

#### `POST /projects`

- **Auth:** Protected (admin/dev)
- **Content-Type:** `multipart/form-data`

| Field      | Type     | Required | Validation                |
| ---------- | -------- | -------- | ------------------------- |
| `title`    | String   | Yes      | 2-100 chars, unique       |
| `tag`      | String   | Yes      | 2-50 chars                |
| `url`      | String   | Yes      | Valid URL                 |
| `altText`  | String   | Yes      | 2-200 chars               |
| `skillIds` | String[] | Yes      | Array of Skill IDs, min 3 |
| `isActive` | Boolean  | No       | Default: `true`           |
| `image`    | File     | Yes      | Image file                |

**Response:** `201`

---

#### `PATCH /projects/:id`

- **Auth:** Protected (admin/dev)
- **Content-Type:** `multipart/form-data`
- All fields optional (same validation as create)

---

#### `DELETE /projects/:id`

- **Auth:** Protected (admin/dev)
- **Response:** `204`

---

#### `DELETE /projects/delete-all`

- **Auth:** Protected (`dev` only)
- **Response:** `204` — Deletes all projects

---

### Blogs

#### `GET /blogs`

- **Auth:** None (public)
- **Query:** [Common query parameters](#common-query-parameters)

**Response item:**

```json
{
  "_id": "...",
  "documentNumber": 1,
  "title": "My Blog Post",
  "slug": "my-blog-post",
  "description": "Short description",
  "content": "<h2>...</h2><p>...</p>",
  "tableOfContents": [
    { "id": "heading-1", "text": "Introduction", "level": 2 }
  ],
  "image": "https://cloudinary.../image.webp",
  "altText": "Blog cover",
  "tags": ["javascript", "vue", "tutorial"],
  "keywords": "javascript, vue tutorial",
  "resources": [{ "url": "https://vuejs.org", "title": "Vue.js Docs" }],
  "uniqueViews": 42,
  "status": "published",
  "isArabicArticle": true,
  "user": "userId",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `GET /blogs/all`

- **Auth:** Protected (admin/dev)
- Returns `title` and `slug` only, no pagination.

---

#### `GET /blogs/:id`

- **Auth:** None (public)

---

#### `GET /blogs/slug/:slug`

- **Auth:** None (public)
- **Special:** Tracks unique views per IP (30-min window). Only counts views from allowed domains.

---

#### `POST /blogs`

- **Auth:** Protected (admin/dev)
- **Content-Type:** `multipart/form-data`

| Field             | Type     | Required | Validation                                               |
| ----------------- | -------- | -------- | -------------------------------------------------------- |
| `title`           | String   | Yes      | 2-200 chars, unique                                      |
| `description`     | String   | Yes      | 10-500 chars                                             |
| `content`         | String   | No       | HTML content                                             |
| `tags`            | String[] | Yes      | Array of strings, min 3 items, each 2-50 chars           |
| `keywords`        | String   | Yes      | 2-200 chars                                              |
| `resources`       | Object[] | Yes      | Min 1 item: `{ url: String (valid URL), title: String }` |
| `status`          | String   | No       | `draft`, `published`, `archived`. Default: `draft`       |
| `isArabicArticle` | Boolean  | No       | Default: `true`                                          |
| `image`           | File     | Yes      | Image file                                               |
| `altText`         | String   | No       | 2-200 chars                                              |

> **Note:** `resources` and `tags` are sent as bracket notation in form-data: `resources[0].url`, `resources[0].title`, `tags[0]`, `tags[1]`, etc.

---

#### `PATCH /blogs/:id`

- **Auth:** Protected (admin/dev)
- **Content-Type:** `multipart/form-data`
- All fields optional (same validation as create)

---

#### `DELETE /blogs/:id`

- **Auth:** Protected (admin/dev)
- **Response:** `204`

---

#### `DELETE /blogs/delete-all`

- **Auth:** Protected (`dev` only)

---

### Services

#### `GET /services`

- **Auth:** None (public)
- **Query:** [Common query parameters](#common-query-parameters)

**Response item:**

```json
{
  "_id": "...",
  "documentNumber": 1,
  "title": "Web Development",
  "slug": "web-development",
  "description": "Full-stack web development services...",
  "image": "https://cloudinary.../image.webp",
  "altText": "Web development illustration",
  "user": "userId",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `GET /services/all`

- **Auth:** Protected (admin/dev)

---

#### `GET /services/:id`

- **Auth:** None (public)

---

#### `POST /services`

- **Auth:** Protected (admin/dev)
- **Content-Type:** `multipart/form-data`

| Field         | Type   | Required | Validation          |
| ------------- | ------ | -------- | ------------------- |
| `title`       | String | Yes      | 2-100 chars, unique |
| `description` | String | Yes      | 10-1000 chars       |
| `altText`     | String | Yes      | 2-200 chars         |
| `image`       | File   | Yes      | Image file          |

---

#### `PATCH /services/:id`

- **Auth:** Protected (admin/dev)
- **Content-Type:** `multipart/form-data`
- All fields optional

---

#### `DELETE /services/:id`

- **Auth:** Protected (admin/dev)
- **Response:** `204`

---

#### `DELETE /services/delete-all`

- **Auth:** Protected (`dev` only)

---

### Skills

#### `GET /skills`

- **Auth:** None (public)
- **Query:** [Common query parameters](#common-query-parameters)

**Response item:**

```json
{
  "_id": "...",
  "documentNumber": 1,
  "title": "Vue.js",
  "slug": "vue-js",
  "icon": "i-logos-vue",
  "user": "userId",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `GET /skills/all`

- **Auth:** Protected (admin/dev)
- Returns `title` and `icon` only, no pagination.

---

#### `GET /skills/:id`

- **Auth:** None (public)

---

#### `POST /skills`

- **Auth:** Protected (admin/dev)

| Field   | Type   | Required | Validation                                                    |
| ------- | ------ | -------- | ------------------------------------------------------------- |
| `title` | String | Yes      | 2-50 chars, unique                                            |
| `icon`  | String | Yes      | Must match format `i-{category}-{name}` (e.g., `i-logos-vue`) |

**Response:** `201`

---

#### `PATCH /skills/:id`

- **Auth:** Protected (admin/dev)
- All fields optional

---

#### `DELETE /skills/:id`

- **Auth:** Protected (admin/dev)
- **Response:** `204`

---

#### `DELETE /skills/delete-all`

- **Auth:** Protected (`dev` only)

---

### Clients

#### `GET /clients`

- **Auth:** None (public)
- **Query:** [Common query parameters](#common-query-parameters)

**Response item:**

```json
{
  "_id": "...",
  "documentNumber": 1,
  "name": "Company X",
  "slug": "company-x",
  "image": "https://cloudinary.../logo.webp",
  "altText": "Company X logo",
  "website": "https://companyx.com",
  "user": "userId",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `GET /clients/all`

- **Auth:** Protected (admin/dev)

---

#### `GET /clients/:id`

- **Auth:** None (public)

---

#### `POST /clients`

- **Auth:** Protected (admin/dev)
- **Content-Type:** `multipart/form-data`

| Field   | Type   | Required | Validation          |
| ------- | ------ | -------- | ------------------- |
| `name`  | String | Yes      | 2-100 chars, unique |
| `image` | File   | Yes      | Image file          |

---

#### `PATCH /clients/:id`

- **Auth:** Protected (admin/dev)
- **Content-Type:** `multipart/form-data`
- All fields optional

---

#### `DELETE /clients/:id`

- **Auth:** Protected (admin/dev)
- **Response:** `204`

---

#### `DELETE /clients/delete-all`

- **Auth:** Protected (`dev` only)

---

### Testimonials

#### `GET /testimonials`

- **Auth:** Protected (admin/dev)
- **Query:** [Common query parameters](#common-query-parameters)
- Returns ALL testimonials (confirmed + unconfirmed)

---

#### `GET /testimonials/confirmed`

- **Auth:** None (public)
- Returns only confirmed testimonials (paginated).

---

#### `GET /testimonials/all`

- **Auth:** Protected (admin/dev)
- All testimonials without pagination.

---

#### `GET /testimonials/:id`

- **Auth:** Protected (admin/dev)

---

#### `POST /testimonials`

- **Auth:** None (public — visitors submit testimonials)
- **Content-Type:** `multipart/form-data`

| Field         | Type   | Required | Validation    |
| ------------- | ------ | -------- | ------------- |
| `name`        | String | Yes      | 2-100 chars   |
| `email`       | String | Yes      | Valid email   |
| `description` | String | Yes      | 10-1000 chars |
| `image`       | File   | Yes      | Image file    |

> **Note:** New testimonials default to `isConfirmed: false`. Admin must confirm them.
> An email notification is sent to the manager upon creation.

**Response:** `201`

---

#### `PATCH /testimonials/:id`

- **Auth:** Protected (admin/dev)

| Field         | Type    | Required | Description    |
| ------------- | ------- | -------- | -------------- |
| `description` | String  | No       | 10-1000 chars  |
| `isConfirmed` | Boolean | No       | Approve/reject |

---

#### `DELETE /testimonials/:id`

- **Auth:** Protected (admin/dev)
- **Response:** `204`

---

#### `DELETE /testimonials/delete-all`

- **Auth:** Protected (`dev` only)

---

### Contacts

#### `GET /contacts`

- **Auth:** Protected (admin/dev)
- **Query:** [Common query parameters](#common-query-parameters)

**Response item:**

```json
{
  "_id": "...",
  "documentNumber": 1,
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "phone": "01234567890",
  "description": "I'd like to discuss a project...",
  "isViewed": false,
  "slug": "ahmed",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `GET /contacts/all`

- **Auth:** Protected (admin/dev)

---

#### `GET /contacts/:id`

- **Auth:** Protected (admin/dev)

---

#### `POST /contacts`

- **Auth:** None (public — contact form)

| Field         | Type   | Required | Validation    |
| ------------- | ------ | -------- | ------------- |
| `name`        | String | Yes      | 2-100 chars   |
| `email`       | String | Yes      | Valid email   |
| `phone`       | String | Yes      | 7-20 chars    |
| `description` | String | Yes      | 10-1000 chars |

> An email notification is sent to the manager upon creation.

**Response:** `201`

---

#### `PATCH /contacts/:id`

- **Auth:** Protected (admin/dev)

| Field      | Type    | Required | Description         |
| ---------- | ------- | -------- | ------------------- |
| `isViewed` | Boolean | No       | Mark as read/unread |

> Only `isViewed` can be updated.

---

#### `DELETE /contacts/:id`

- **Auth:** Protected (admin/dev)
- **Response:** `204`

---

#### `DELETE /contacts/delete-all`

- **Auth:** Protected (`dev` only)

---

### Resources

#### `GET /resources`

- **Auth:** None (public)
- **Query:** [Common query parameters](#common-query-parameters)

**Response item:**

```json
{
  "_id": "...",
  "documentNumber": 1,
  "title": "Vue.js Documentation",
  "slug": "vue-js-documentation",
  "url": "https://vuejs.org",
  "user": "userId",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

#### `GET /resources/all`

- **Auth:** Protected (admin/dev)

---

#### `GET /resources/:id`

- **Auth:** None (public)

---

#### `POST /resources`

- **Auth:** Protected (admin/dev)

| Field   | Type   | Required | Validation          |
| ------- | ------ | -------- | ------------------- |
| `title` | String | Yes      | 2-100 chars, unique |
| `url`   | String | Yes      | Valid URL           |

**Response:** `201`

---

#### `PATCH /resources/:id`

- **Auth:** Protected (admin/dev)
- All fields optional

---

#### `DELETE /resources/:id`

- **Auth:** Protected (admin/dev)
- **Response:** `204`

---

#### `DELETE /resources/delete-all`

- **Auth:** Protected (`dev` only)

---

### Info

Singleton resource — only one info document exists.

#### `GET /infos`

- **Auth:** None (public)

**Response:**

```json
{
  "status": "success",
  "data": {
    "resumeUrl": "https://drive.google.com/..."
  }
}
```

---

#### `POST /infos`

- **Auth:** Protected (admin/dev)
- Creates or updates (upsert) the singleton info document.

| Field       | Type   | Required | Validation |
| ----------- | ------ | -------- | ---------- |
| `resumeUrl` | String | Yes      | Valid URL  |

---

#### `PATCH /infos`

- **Auth:** Protected (admin/dev)

| Field       | Type   | Required | Validation |
| ----------- | ------ | -------- | ---------- |
| `resumeUrl` | String | No       | Valid URL  |

---

### Views (Blog Analytics)

All endpoints require: `Auth: Protected` + Role: `admin` or `dev`

#### `GET /views/stats/:blogId`

View statistics for a specific blog post.

---

#### `POST /views/cleanup`

Clean up old view records.

---

#### `POST /views/reset`

Reset all view data.

---

### Build Project

#### `POST /build-project`

- **Auth:** Protected (admin/dev)
- **Status:** Placeholder — returns success message. GitHub Actions/Vercel integration not yet implemented.

---

### Health

Public health check endpoints (no auth required). Mounted at `/health` (not under `/api/v1`).

#### `GET /health`

Basic health check with DB and Cloudinary status.

#### `GET /health/ready`

Readiness probe (for Kubernetes/Docker).

#### `GET /health/live`

Liveness probe.

---

## Image Upload Notes

Resources with images (`projects`, `blogs`, `services`, `clients`, `testimonials`, `users`) use:

- **Content-Type:** `multipart/form-data`
- **Field name:** `image` (or `photo` for users)
- **Processing:** Images are resized with Sharp and uploaded to Cloudinary
- **Format:** Converted to WebP
- **On update:** Old image is deleted from Cloudinary automatically
- **On delete:** Image is deleted from Cloudinary automatically

---

## Auto-Generated Fields

These fields are automatically managed by the server:

| Field            | Description                               |
| ---------------- | ----------------------------------------- |
| `_id`            | MongoDB ObjectId                          |
| `documentNumber` | Auto-incrementing sequential number       |
| `slug`           | Generated from `title` or `name`          |
| `original_slug`  | First slug (never changes after creation) |
| `createdAt`      | Timestamp (auto)                          |
| `updatedAt`      | Timestamp (auto)                          |
| `user`           | Set to authenticated user's ID on create  |
