# Mess Book 🍛

A simple phone app for running a food mess (canteen). It replaces the paper register. It keeps track of members and their plans, shows whose plan is ending, and sends WhatsApp reminders with one tap.

- **One user, no login.** It's built for the mess owner.
- **Works on Android** like a normal app (Add to Home Screen).
- **Free to run**: Supabase (database) + Render (hosting).
- **English or Telugu (తెలుగు)**: tap the 🌐 button on the Dashboard, or go to Settings → Language. The phone remembers the choice.

| | |
|---|---|
| Backend | FastAPI · SQLAlchemy 2 · Pydantic v2 · Alembic · PostgreSQL (SQLite for local dev) |
| Frontend | React · Vite · TypeScript · Tailwind CSS · PWA |
| Timezone | All dates and "today" are calculated in **Asia/Kolkata** on the server |

```
mess/
├── backend/            FastAPI app, Alembic migrations, seed script, tests
│   ├── app/            models, schemas, logic (dates & status), routers
│   ├── alembic/        database migrations
│   ├── seed.py         sample plans + members
│   └── tests/          pytest tests
├── frontend/           React app (built into backend/static for production)
├── build.sh            build script used by Render
└── render.yaml         Render blueprint (one web service)
```

---

## 1. Create the database (Supabase, free)

> A Supabase project named **`mess`** (Mumbai region) has already been created and migrated for this repo. If you're using that one, skip to step 4 below to get its connection string.

1. Sign up at <https://supabase.com> and click **New project**.
2. Name: `mess`. Region: **South Asia (Mumbai)**. Choose a strong **database password** and save it somewhere safe.
3. Wait about a minute for the project to start.
4. Click **Connect** at the top of the project page, choose **Session pooler**, and copy the URI. It looks like this:
   ```
   postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```
   Replace `[YOUR-PASSWORD]` with your database password.
   *Use the **Session pooler** URL, not "Direct connection". The direct one only works over IPv6, which Render does not support.*

Tables are created automatically on first start (`alembic upgrade head`). The migration turns on Row Level Security for every table, so Supabase's public REST API can't read your data. Only this app can, through its database connection.

<details>
<summary>Using Neon instead</summary>

Create a free project at <https://neon.tech>, copy the connection string from the dashboard (it ends with `?sslmode=require`), and use it as `DATABASE_URL`. Everything else is the same.
</details>

---

## 2. Run it on your computer

You need **Python 3.11+** and **Node.js 20+**.

```bash
# Backend
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      Mac/Linux:  source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # then paste your DATABASE_URL into .env
                            # (or leave it empty to use a local SQLite file)
alembic upgrade head        # create tables
python seed.py              # optional: Monthly plan + 5 sample members
uvicorn app.main:app --reload --port 8010
```

```bash
# Frontend (in a second terminal)
cd frontend
npm install
npm run dev                 # open http://localhost:5173
```

The Vite dev server forwards `/api` calls to the backend on port 8010. API docs are at <http://localhost:8010/api/docs>.

**Run the tests:**

```bash
cd backend
pytest
```

**Try the production build locally** (one server for everything):

```bash
cd frontend && npm run build && cd ..
rm -rf backend/static && cp -r frontend/dist backend/static
cd backend && uvicorn app.main:app --port 8010   # open http://localhost:8010
```

### Sample data

`python seed.py` adds the **Monthly** plan (₹3,000) and 5 members. Their dates are set relative to today, so the dashboard always shows a mix: 1 active, 2 expiring, 2 expired.

To seed a hosted database without running Python against it, run `python seed.py --sql` and paste the output into the Supabase **SQL Editor**.

---

## 3. Deploy to Render (free, one service)

1. Push this folder to a GitHub repository.
2. Go to <https://render.com>, then **New → Blueprint**, and pick your repo. Render reads `render.yaml`.
   *(Or **New → Web Service** with these settings: Runtime **Python**, Build command `./build.sh`, Start command `cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.)*
3. When asked for **`DATABASE_URL`**, paste your Supabase Session pooler URL.
4. Click **Deploy**. The first build takes a few minutes. Your app will be at `https://mess-book-xxxx.onrender.com`.

### Keep it always awake (free)

On the free plan, Render puts the app to sleep after 15 minutes without visits, and Supabase pauses a free database after 7 days without activity. A free "uptime monitor" that visits the app every 5 minutes prevents both:

1. Sign up at <https://uptimerobot.com> (free).
2. **Add New Monitor**:
   - Monitor type: **HTTP(s)**
   - URL: `https://<your-app>.onrender.com/api/keepalive`
   - Monitoring interval: **5 minutes**
3. Save. That's all. The app now stays awake, and every visit runs a small database query so Supabase stays active too.

Render's free plan includes 750 hours a month, enough for one app running non-stop. If you run other free Render services in the same account, they share those hours. Bonus: UptimeRobot emails you if the app ever goes down.

*(cron-job.org works the same way if you prefer it: create a job that calls the same URL every 5 minutes.)*

---

## 4. Install on an Android phone

1. Open your Render link in **Chrome** on the phone.
2. Wait for the dashboard to load.
3. Tap the **⋮** menu (top right), then **Add to Home screen** (or **Install app**), then **Install**.
4. A **Mess Book** icon appears on the home screen. It opens full-screen like a normal app.

---

## Using the app

| Screen | What it does |
|---|---|
| **Dashboard** | Counts of Active / Expiring / Expired members and this month's collection. Lists whose plan is ending soon and whose has already ended. Each row has **WhatsApp**, **Renew** and **Call** buttons. |
| **Members** | Search by name or phone. Filter by All / Active / Expiring / Expired. |
| **Add (+)** | Name, phone, room, plan, start date. The end date and amount fill in automatically, and you can change them. |
| **Member page** | Details, full payment history, reminders sent, Edit / Renew / Delete. |
| **Settings** | Plans, mess name, reminder messages, how many days counts as "expiring", **Download backup**. |

**WhatsApp reminders:** tapping **WhatsApp** opens WhatsApp with the message already typed. You just press Send. No paid API is used. The app records each reminder and shows **"✓ Reminded today"** so you don't message someone twice.

The message templates can use `{name}`, `{plan}`, `{end_date}`, `{amount}` and `{mess_name}`.

**Backup:** Settings → **Download backup** saves an Excel file with all members, payments, plans, reminders and settings. Download one every week.

---

## How dates work

- **Monthly plans:** start 05 Oct + 1 month → ends **04 Nov** (the end date is the last day the member can eat).
- **Day plans:** start 05 Oct + 15 days → ends **19 Oct**.
- **Renewal** starts the day after the current plan ends. If the plan has already ended, it starts today.
- **Status** is worked out fresh every time:
  - **Expired:** the end date has passed.
  - **Expiring:** the plan ends within the expiring window (default 3 days), including today.
  - **Active:** everything else.

## API overview

All endpoints are under `/api`. Interactive docs are at `/api/docs`.

| Method | Path | |
|---|---|---|
| GET | `/dashboard` | counts + expiring + expired (last 30 days) |
| GET | `/members?search=&status=` | member list with current plan & status |
| POST | `/members` | create member + first payment |
| GET / PUT / DELETE | `/members/{id}` | details (with history) / edit / delete |
| POST | `/members/{id}/renew` | add a new payment period |
| POST | `/members/{id}/reminders` | log reminder, return message + `wa.me` link |
| GET / POST / PUT | `/plans`, `/plans/{id}` | manage plans (plans are turned off, never deleted) |
| GET | `/plans/preview-end-date?plan_id=&start_date=` | calculated end date |
| GET / PUT | `/settings` | mess name, window, templates |
| GET | `/backup` | Excel backup download |
| GET | `/health` | used by the "waking up" screen |
| GET / HEAD | `/keepalive` | for the uptime pinger (also touches the database) |
