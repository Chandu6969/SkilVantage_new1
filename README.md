# SkilVantage

SkilVantage is a career training consultancy for students, freshers, and working professionals. The site presents five job-readiness programs — Data Analyst, Data Scientist, AI/ML Engineer, Generative AI, and Agentic AI — and collects registrations for the career team.

Training is job-readiness focused. The site does not promise employment, an internship, or a salary.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

`npm test` checks validation, resume checks, and that a registration is written to the server store.

## Where registrations are stored

Every registration and enquiry is sent to `/api/v1` and saved on the server. Nothing is kept only in the browser. An unfinished form may stay in the browser tab until it is submitted or the tab is closed.

- If `MONGODB_URI` is set, every record is stored in MongoDB. The database name defaults to `skilvantage`.
- If `DATABASE_URL` is set and MongoDB is not, records are stored in Postgres.
- If neither is set, records are stored in a private `data/` file on the server. That folder is not committed.
- If Google Sheets credentials are set, each new registration, enquiry, and follow-up is also copied into a private spreadsheet. The database remains the source of truth if the sheet is unavailable.

Sample records are loaded into an empty store so the career-team desk is not blank. They are labeled sample and drop out of the counts after the first real registration.

## Career-team desk

The desk is at `/admin`. It needs `ADMIN_PASSWORD` (at least 8 characters). An optional `COUNSELLOR_PASSWORD` signs in with a counsellor role: notes, status, and follow-ups, without CSV export or deletion.

On the published app, add those values as secrets. Do not put them in the website code.

From the desk the team can search and filter leads, update status, add notes, schedule a follow-up, export CSV, and download a resume.

Lead statuses: New, Contacted, Counselling Scheduled, Interested, Registered, Training Started, Completed, Not Interested, Follow-up Required.

## Google Sheets

1. Create a spreadsheet and a Google Cloud service account with the Sheets API enabled.
2. Share the spreadsheet with the service account email as an editor.
3. Set `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY`.

The sync creates five tabs if they are missing:

- Student Registrations
- Professional Registrations
- Course Enquiries
- Course List
- Follow-ups

`GOOGLE_SERVICE_ACCOUNT_JSON` can be used instead of the email and private key. The private key should keep its line breaks (`\n` escapes are accepted).

## Contact details

Public contact defaults are `skillvantageadmin@gmail.com`, WhatsApp and phone `+91 63032 20248`, and Hyderabad, India. Override them with `CONTACT_EMAIL`, `CONTACT_PHONE`, `CONTACT_WHATSAPP`, and `CONTACT_LOCATION`.

## API for a later mobile app

The public API is versioned under `/api/v1` and is the same API the website uses.

- `GET /api/v1/health`
- `GET /api/v1/courses` and `GET /api/v1/courses/:slug`
- `GET /api/v1/form-challenge`
- `POST /api/v1/registrations`
- `GET /api/v1/registrations/:id/confirmation` (id, program, and learner type only)
- `POST /api/v1/enquiries`
- `POST /api/v1/analytics`

Registration accepts JSON or multipart form data, including an optional PDF, DOC, or DOCX resume up to 5 MB. A short-lived spam check, a hidden field, and a rate limit protect the forms. Send an `Origin` header that matches the site.

Admin routes under `/api/v1/admin` require a session cookie or `Authorization: Bearer` token from `POST /api/v1/admin/login`.

Learner accounts, lessons, assignments, quizzes, project submission, attendance, progress, certificates, notifications, mentor messages, and job opportunities are not built yet. Add them as new `/api/v1` resources on the same store instead of a second backend. The repository interface is in `src/lib/store/types.ts`.
