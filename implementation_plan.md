# Migrate Alumni Next.js App from Google Apps Script to PHP/MySQL Backend

Convert the "Alumni next" Next.js application from using Google Apps Script API to a PHP + MySQL backend, replicating the proven backend from `C:\xampp\htdocs\Alumni\backend` and adapting it for this project.

## Background

- **Current state**: The Next.js app at `C:\xampp\htdocs\Alumni next` uses Google Apps Script (JSONP/iframe) to fetch data from Google Sheets.
- **Target state**: PHP REST API + MySQL database (`Alumni`) served from `C:\xampp\htdocs\Alumni next\backend`, with the frontend `apiService.ts` rewritten to call it.
- **Reference**: The existing working PHP backend at `C:\xampp\htdocs\Alumni\backend` has the exact same models, utilities, and API structure we need. We'll adapt it (database name changed to `Alumni`, CORS updated for Next.js `localhost:3000`).

## User Review Required

> [!IMPORTANT]
> **Database Name**: You specified database name `Alumni`. The existing backend in `C:\xampp\htdocs\Alumni` uses `alumni_portal`. We will use **`Alumni`** as requested.

> [!IMPORTANT]
> **XAMPP MySQL credentials**: The existing backend uses `root` with **no password**. We'll keep the same. Confirm if yours differ.

> [!IMPORTANT]
> **Excel Data Import**: The file [Alumni_Data.xlsx](file:///c:/xampp/htdocs/Alumni%20next/Alumni_Data.xlsx) will need to be imported into the database. We'll create a PHP import script that reads the Excel file and populates all tables.

## Open Questions

> [!WARNING]
> **Upload directory**: The existing backend stores uploads at `C:\xampp\htdocs\Alumni\Uploads`. For the new backend, should uploads go to `C:\xampp\htdocs\Alumni next\Uploads`? (We'll default to this.)

## Proposed Changes

### Backend Structure

Create `c:\xampp\htdocs\Alumni next\backend\` as a complete copy of the proven existing backend, adapted for this project:

```
backend/
├── .htaccess                  # Apache config (CORS, upload limits)
├── config/
│   ├── config.php             # App config, CORS origins, upload paths, API key
│   └── database.php           # PDO database connection (db: Alumni)
├── database/
│   ├── schema.sql             # Full schema for database "Alumni"
│   └── import_excel.php       # Script to import Alumni_Data.xlsx
├── models/
│   ├── User.php               # Authentication model
│   ├── Student.php            # Students/alumni data model
│   ├── AlumniTalk.php         # Alumni talks model
│   ├── AlumniSpotlight.php    # Alumni spotlight model
│   ├── StudentDB.php          # Student strength/enrollment model
│   └── LinkedInStatus.php     # LinkedIn status tracking model
├── api/
│   ├── auth/
│   │   └── login.php          # POST login
│   ├── students/
│   │   ├── index.php          # GET list / POST create
│   │   ├── update.php         # PUT/POST update
│   │   └── delete.php         # DELETE/POST delete
│   ├── alumni-talks/
│   │   ├── index.php          # GET list / POST create/update/delete
│   │   └── update.php         # POST update by ID
│   ├── alumni-spotlight/
│   │   └── index.php          # GET list / POST create/update/delete
│   ├── studentdb/
│   │   ├── index.php          # GET list / POST CRUD / bulk upload
│   │   └── upload.php         # POST CSV upload
│   ├── linkedin-status/
│   │   ├── index.php          # GET list / POST CRUD / bulk
│   │   └── upload.php         # POST CSV upload
│   └── upload/
│       └── index.php          # POST file upload (photos, banners, etc.)
└── utils/
    ├── Response.php           # JSON response helper with CORS
    ├── Validator.php          # Input validation & sanitization
    └── FileUpload.php         # File upload with security checks
```

---

### Config Files

#### [NEW] [config.php](file:///c:/xampp/htdocs/Alumni%20next/backend/config/config.php)
- CORS origins include `http://localhost:3000` (Next.js dev server)
- Upload paths point to `C:\xampp\htdocs\Alumni next\Uploads\`
- Same API secret key and JWT settings

#### [NEW] [database.php](file:///c:/xampp/htdocs/Alumni%20next/backend/config/database.php)
- Database name: `Alumni`
- Host: `localhost`, user: `root`, password: empty

---

### Database Schema

#### [NEW] [schema.sql](file:///c:/xampp/htdocs/Alumni%20next/backend/database/schema.sql)
- Creates database `Alumni` with 6 tables: `users`, `students`, `alumni_talks`, `alumni_spotlight`, `student_strength`, `linkedin_status`
- Exact same structure as existing `alumni_portal` schema
- Default admin user inserted

#### [NEW] [import_excel.php](file:///c:/xampp/htdocs/Alumni%20next/backend/database/import_excel.php)
- PHP script using PhpSpreadsheet to read `Alumni_Data.xlsx`
- Parses all sheets and inserts data into appropriate tables
- Can be run via browser or CLI

---

### Models (6 files)

All models adapted from existing backend — identical logic, just file paths adjusted:

#### [NEW] [User.php](file:///c:/xampp/htdocs/Alumni%20next/backend/models/User.php)
#### [NEW] [Student.php](file:///c:/xampp/htdocs/Alumni%20next/backend/models/Student.php)
#### [NEW] [AlumniTalk.php](file:///c:/xampp/htdocs/Alumni%20next/backend/models/AlumniTalk.php)
#### [NEW] [AlumniSpotlight.php](file:///c:/xampp/htdocs/Alumni%20next/backend/models/AlumniSpotlight.php)
#### [NEW] [StudentDB.php](file:///c:/xampp/htdocs/Alumni%20next/backend/models/StudentDB.php)
#### [NEW] [LinkedInStatus.php](file:///c:/xampp/htdocs/Alumni%20next/backend/models/LinkedInStatus.php)

---

### API Endpoints (12 files)

All endpoints adapted from existing backend:

#### [NEW] [login.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/auth/login.php)
#### [NEW] [students/index.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/students/index.php)
#### [NEW] [students/update.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/students/update.php)
#### [NEW] [students/delete.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/students/delete.php)
#### [NEW] [alumni-talks/index.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/alumni-talks/index.php)
#### [NEW] [alumni-talks/update.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/alumni-talks/update.php)
#### [NEW] [alumni-spotlight/index.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/alumni-spotlight/index.php)
#### [NEW] [studentdb/index.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/studentdb/index.php)
#### [NEW] [studentdb/upload.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/studentdb/upload.php)
#### [NEW] [linkedin-status/index.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/linkedin-status/index.php)
#### [NEW] [linkedin-status/upload.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/linkedin-status/upload.php)
#### [NEW] [upload/index.php](file:///c:/xampp/htdocs/Alumni%20next/backend/api/upload/index.php)

---

### Utilities (3 files)

#### [NEW] [Response.php](file:///c:/xampp/htdocs/Alumni%20next/backend/utils/Response.php)
#### [NEW] [Validator.php](file:///c:/xampp/htdocs/Alumni%20next/backend/utils/Validator.php)
#### [NEW] [FileUpload.php](file:///c:/xampp/htdocs/Alumni%20next/backend/utils/FileUpload.php)

---

### Frontend Changes

#### [MODIFY] [apiService.ts](file:///c:/xampp/htdocs/Alumni%20next/src/services/apiService.ts)
- **Replace** Google Apps Script API calls with PHP backend REST API calls
- Remove JSONP/iframe hacks; use standard `fetch()` with JSON
- Update `API_URL` to `http://localhost/Alumni next/backend/api`
- Update all data fetching functions (`fetchStudentsData`, `fetchStudentStrengthData`, etc.) to call PHP endpoints
- Update all mutation functions (create, update, delete students/talks/spotlights)
- Keep the same TypeScript interfaces (`Student`, `AlumniTalkItem`, etc.) for frontend compatibility

#### [MODIFY] [.env.local](file:///c:/xampp/htdocs/Alumni%20next/.env.local)
- Change `NEXT_PUBLIC_API_URL` to point to PHP backend
- Add `NEXT_PUBLIC_BACKEND_URL` for the PHP API base URL

#### [MODIFY] [AuthContext.tsx](file:///c:/xampp/htdocs/Alumni%20next/src/context/AuthContext.tsx)
- Update to use new PHP login API endpoint instead of Apps Script

---

### Uploads Directory

#### [NEW] `C:\xampp\htdocs\Alumni next\Uploads\`
- `Photos/` — Student profile photos
- `AlumniTalk/Banners/` — Alumni talk banner images
- `AlumniTalk/Galleries/` — Alumni talk gallery images
- `AlumniSpotlight/Photos/` — Spotlight profile photos
- `AlumniSpotlight/Galleries/` — Spotlight gallery images
- `Temp/` — Temporary uploads

---

## Verification Plan

### Automated Tests
1. Run `schema.sql` in phpMyAdmin to create database and tables
2. Run `import_excel.php` to import data from Excel
3. Test each API endpoint with curl/browser

### Manual Verification
1. Open `http://localhost/Alumni next/backend/api/students/` in browser — should return JSON with student list
2. Open `http://localhost/Alumni next/backend/api/alumni-talks/` — should return alumni talks
3. Start Next.js dev server and verify:
   - Home page loads alumni data from PHP backend
   - Admin login works with PHP auth endpoint
   - Student registration creates records via PHP API
   - Alumni talks CRUD operations work
   - Alumni spotlight CRUD operations work
   - File uploads work correctly
