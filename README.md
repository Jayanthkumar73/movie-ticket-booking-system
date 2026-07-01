# 🧠 brain.md — Project Knowledge Base

> Single source of truth for this project. Read THIS file first; you should be able to
> do most tasks without re-reading all the code. Keep it updated when structure changes.

---

## 1. What this is

**Aurora Cinema** — a full-stack **movie ticket booking system** (BookMyShow-style).
Customers browse movies → pick a show → select seats → pay/confirm → get a booking.
Admins manage movies, theatres, screens, shows, bookings, reports, and admin approvals.

- **Root:** `C:/Users/Nishant Dwivedi/Desktop/movie_ticket/movie-ticket-booking-system`
- **Backend:** `backend/` — Spring Boot (Java 17)
- **Frontend:** `frontend/` — React 19 + Vite + MUI

---

## 2. Tech stack

### Backend
- **Spring Boot 4.1.0** (Spring Framework 7), **Java 17**, Maven
- Spring Data JPA + **MySQL** (`moviebooking` db, `ddl-auto=update`)
- Spring Security + **JWT** (jjwt 0.11.5), method security via `@PreAuthorize`
- **Cloudinary** (poster/image uploads), **Spring Mail** (OTP emails), Lombok
- ⚠️ **Spring 7 note:** `UriComponentsBuilder.fromHttpUrl(...)` is REMOVED. Use `fromUriString(...)`.

### Frontend
- **React 19**, **Vite 8**, **MUI v9** (`@mui/material`, `@mui/icons-material`)
- **Redux Toolkit** (`@reduxjs/toolkit`, auth slice), **axios**, react-router-dom
- jsPDF + jspdf-autotable (report export), recharts (admin charts)
- Lint: `oxlint`. Scripts: `dev`, `build`, `lint`, `preview`.
- Frontend calls backend via `/api/...` (proxy assumed in dev/prod).

---

## 3. How to run / verify

```bash
# Backend (from backend/)
./mvnw -q -o compile        # compile check (offline). EXIT 0 = good.
./mvnw spring-boot:run      # run API

# Frontend (from frontend/)
npx vite build              # build check. EXIT 0 = good.
npm run dev                 # dev server
```

DB must be running (MySQL localhost:3306, user `root`). Schema auto-updates on boot.

---

## 4. Domain model (entities)  — `backend/.../entity/`

- **User** — auth user; roles via `Role`. Super admin email in config.
- **Role** — RBAC. Roles seen: `ROLE_CUSTOMER`, `ROLE_THEATRE_ADMIN`, `ROLE_SUPER_ADMIN`
  (also `ROLE_ADMIN` referenced in a couple of frontend checks).
- **Movie** — `id, movieName, language, genre, duration(min), releaseDate, description,
  posterImageUrl, trailerUrl, imdbId(unique)`. `imdbId` set only for OMDb-imported movies.
- **Theatre** — `theatreName, city, address, managerName, managerContact` (+ image).
- **Screen** — belongs to Theatre; `screenName, totalSeats, screenType` (`REGULAR|PREMIUM|IMAX`).
- **Show** — `showDate, showTime, pricePerSeat, status(ShowStatus)`, `@ManyToOne Movie`, `@ManyToOne Screen`.
- **Booking** — `bookingNumber, selectedSeats, totalAmount, status(BookingStatus: CONFIRMED|CANCELLED),
  bookingDate`, links to show/movie/theatre/screen/user (see BookingResponse DTO for shape).
- **OtpVerification** — admin login OTP.
- Enums: `ScreenType`, `ShowStatus`, `BookingStatus`, `Role`.

Seats are **generated on the frontend** (rows A,B,C… × 10 seats) from `totalSeats`; backend
tracks `bookedSeats` per show via `/api/shows/{id}/seats`.

---

## 5. REST API (backend controllers)

Base: `/api`. Auth via `Authorization: Bearer <jwt>`.

### Auth — `AuthController` (`/api/auth/**`, public)
- `POST /auth/register` — `{name,email,phone,password,role}` (role `USER`|`ADMIN`)
- `POST /auth/login` — `{email,password}` → JWT, or `{requiresOtp,email}` for admins
- `POST /auth/verify-otp` — `{email,otp}` → JWT

### Movies — `MovieController` (`/api/movies`)
- `GET /movies` — list (public)
- `GET /movies/{id}` — one (public)
- `POST /movies` — multipart `movie`(JSON)+`file` — **admin** add
- `PUT /movies/{id}` — multipart update — **admin**
- `DELETE /movies/{id}` — **admin**
- `GET /movies/omdb/search?query=` — **admin** — search OMDb by title → `OmdbSearchResultDTO[]`
- `POST /movies/omdb/import?imdbId=` — **admin** — import movie from OMDb (idempotent)

### Shows — `ShowController` (`/api/shows`)
- `GET /shows/movie/{movieId}` — shows for a movie (public)
- `GET /shows/{id}/seats` — `{totalSeats, bookedSeats[], pricePerSeat}` (public)
- `POST /shows?movieId=&screenId=` — body `{showDate,showTime,pricePerSeat}` — **admin**

### Screens — `ScreenController` (`/api/screens`)
- `GET /screens?theatreId=` — list; `POST /screens?theatreId=`; `PUT /screens/{id}`; `DELETE /screens/{id}` (admin for writes)

### Theatres — `TheatreController` (`/api/theatres`)
- `GET /theatres`; `POST /theatres` (multipart `theatre`+`file`) — admin

### Bookings — `BookingController` (`/api/bookings`)
- `POST /bookings` — `{showId, selectedSeats[]}` → creates booking
- `GET /bookings/my` — current user's bookings
- `PUT /bookings/{id}/cancel` — cancel (blocked within 1h of showtime — enforced UI-side too)
- `GET /bookings/admin` — all bookings (admin)
- `GET /bookings/report?from=&to=` — report summary; `GET /bookings/report/export?from=&to=` — rows

### Admin — `AdminController` (`/api/admin`)
- `GET /admin/pending` — pending admin signups; `PUT /admin/approve/{userId}` — approve (super admin)

### Security — `SecurityConfig`
- Stateless, JWT filter, global CORS (`*`).
- Public: `/api/auth/**`, `/api/movies/**` (URL-level), GET on shows/screens/theatres.
- Writes protected by method-level `@PreAuthorize("hasAnyRole('THEATRE_ADMIN','SUPER_ADMIN')")`.
- Note: `/api/movies/**` is permitAll at URL level, but OMDb/write endpoints still enforce
  role via `@PreAuthorize`.

---

## 6. Config — `backend/src/main/resources/application.properties`

- MySQL: `jdbc:mysql://localhost:3306/moviebooking`, user `root` (pw in file)
- JWT secret + expiry; Cloudinary creds; Gmail SMTP creds; super-admin email
- **OMDb:** `omdb.api-key=15447beb`, `omdb.base-url=http://www.omdbapi.com/`
- ⚠️ Secrets are committed in plaintext. If repo goes public, move to env vars.

---

## 7. OMDb integration (movie data provider)

TMDB was blocked, so we use **OMDb** (`http://www.omdbapi.com/`, free key).
- Search by title `?s=`; details by imdbID `?i=&plot=full`. Capitalised JSON keys.
- **Backend:** `OmdbService` (search + import w/ safe parsing), DTOs `OmdbSearchResultDTO`,
  `OmdbSearchResponse`, `OmdbDetailResponse`. `Movie.imdbId` unique prevents duplicates.
- Field map: Title→movieName, Released("16 Jul 2010")→releaseDate, Runtime("148 min")→duration,
  Genre→genre, Language(first)→language, Plot→description, Poster→posterImageUrl.
  Missing → duration 0, date today, "Unknown". OMDb has **no trailer** (trailerUrl stays empty).
- **No "upcoming list"** in OMDb — admin must search by name. (Trakt would add upcoming lists.)
- **Frontend:** Admin → Movies tab → "Search & Import from OMDb" panel (poster grid, one-click
  Import, "✓ Added" when already imported).

---

## 8. Frontend structure — `frontend/src/`

- `main.jsx` — Redux Provider + MUI `ThemeProvider(theme)` + `CssBaseline` + `index.css`
- `theme.js` — **Noir theme + design tokens** (see §9). Exports `theme` (default), `NOIR`,
  `pageBg`, `spotlight`, `glassCard`, `amberGradient`.
- `App.jsx` — Router; root noir wrapper Box + Navbar + Routes + footer.
- `index.css` — global noir foundation (bg, fonts, film-grain overlay, custom scrollbar, selection).
- `components/Navbar.jsx` — sticky glass noir navbar, wordmark **AURORA.CINEMA**, active states.
- `components/ProtectedRoute.jsx` — role-gated routes.
- `redux/authSlice.js`, `redux/store.js` — auth state (`token, roles, isAuthenticated`).

### Pages — `frontend/src/pages/`
| File | Route | Purpose |
|---|---|---|
| `MovieListPage.jsx` | `/`, `/movies` | Landing: hero + **search/genre filter** + poster card grid |
| `ShowsPage.jsx` | `/movies/:id/shows` | Movie header + shows grouped by date |
| `SeatSelectionPage.jsx` | `/shows/:id/seats` | Seat grid, legend, summary → confirm |
| `BookingConfirmPage.jsx` | `/booking/confirm` | Review + Pay & Confirm |
| `BookingSuccessPage.jsx` | `/booking/success` | Confirmation + booking # |
| `BookingHistoryPage.jsx` | `/bookings` | User's bookings, cancel |
| `LoginPage.jsx` | `/login` | User/Admin/SuperAdmin tabs + OTP |
| `RegisterPage.jsx` | `/register` | Signup |
| `AdminDashboard.jsx` | `/admin` | Tabbed admin (see below) |

### AdminDashboard tabs (single big file, sub-components)
Movies · Theatres(super) · Screens · Shows · Bookings · Reports · Approve Admins(super).
Shared style consts inside file: `darkCard`, `inputSx`, `useAuthAxios(token)`.
- **Movies tab** has: OMDb search/import panel, manual add form, list table with **Edit (dialog)
  + Delete** actions.
- Admin flow to add a movie as a show: Movies tab (import/add) → Shows tab (movie+theatre+screen
  +date/time/price → Create Show).

---

## 9. 🎨 Design system — "CINEMATIC NOIR"  (in `theme.js`)

Chosen art direction: premium, editorial, least "AI-generated". MUBI/Apple TV+/Letterboxd vibe.

**Tokens (`NOIR` export):**
- bg `#0a0a0b`, bgElev `#0f0f11`, surface `#151517`, surface2 `#1c1c20`
- border `rgba(255,255,255,0.08)`, borderStrong `rgba(255,255,255,0.16)`
- text `#f5f3ef`, textDim `rgba(245,243,239,0.62)`, textFaint `rgba(245,243,239,0.38)`
- **accent amber** `#E5B769` (deep `#C9922F`, soft `rgba(229,183,105,0.12)`) 
- gold `#F5C518` (ratings), success `#5FBF80`, danger `#E5484D`

**Fonts:** display serif **Fraunces** (h1–h4, wordmarks), UI sans **Inter** (body/buttons).
Loaded via Google Fonts in `index.html`.

**Helpers:** `pageBg` (near-black + warm top spotlight), `spotlight` (hero glow),
`glassCard`, `amberGradient` (`linear-gradient(135deg,#E5B769,#C9922F)`).

**Component defaults (theme overrides):** amber contained buttons w/ dark text + glow,
no-image dark Paper/Card w/ hairline border, subtle chips, outlined inputs w/ amber focus.

**Rules of thumb when styling new UI:**
- Import tokens from `../theme`; don't hardcode old candy colors.
- Backgrounds use `pageBg`. Primary CTA = `variant="contained"` (auto amber). Never re-add the
  old `linear-gradient(45deg,#ff6b6b,#ffd93d)` / pink-orange `#FE6B8B→#FF8E53`.
- Headings in Fraunces serif, warm white, one amber accent word. Avoid gradient-text everywhere.
- Rating/price highlights: gold `#F5C518` or amber. Success green, danger red from tokens.

---

## 10. ✅ Redesign status — Cinematic Noir COMPLETE

All frontend surfaces migrated to the noir design system (`vite build` passes, EXIT 0):

- ✅ `theme.js`, `index.html` (Fraunces+Inter), `index.css` (noir + grain + scrollbar),
  `main.jsx`, `App.jsx` (root wrapper + footer)
- ✅ `Navbar.jsx` (glass sticky), `MovieListPage.jsx` (hero + cards + search/filter)
- ✅ `ShowsPage.jsx` (blurred backdrop header), `SeatSelectionPage.jsx` (amber seats/screen glow)
- ✅ `BookingConfirmPage.jsx`, `BookingSuccessPage.jsx`, `BookingHistoryPage.jsx`
- ✅ `LoginPage.jsx`, `RegisterPage.jsx` (noir auth cards)
- ✅ `AdminDashboard.jsx` — `darkCard`/`inputSx` retheme to `NOIR`; gradient buttons → amber;
  bg → noir; `#ff6b6b`→`#E5B769`, `#ffd93d`→`#F5C518` (gold).

**Search/filter feature (MovieListPage):** client-side over the already-fetched `/api/movies`
list. `query` matches movieName/genre/language; `activeGenre` chips derived from all movies
(genre split on commas for OMDb multi-genre). `useMemo` for `genres` + `filtered`. No backend
change. Empty-match state offers "Clear filters".

**Old palette (fully removed — do not reintroduce):**
`#ff6b6b`, `#ffd93d`, `#4ecdc4`, `#f39c12`, `#56ab2f`, `#c0392b`,
`linear-gradient(45deg,#ff6b6b,#ffd93d)`, old dark gradient bg, pink-orange `#FE6B8B→#FF8E53`.

**Verify after edits:** `cd frontend && npx vite build` must exit 0.

---

## 11. Known caveats / TODO ideas

- Secrets (DB pw, OMDb key, Gmail, Cloudinary, JWT) are plaintext in `application.properties`.
- OMDb: no upcoming list, no trailers. Trakt integration would add both.
- Movie delete fails if shows still reference it (FK) — UI shows a friendly hint.
- `App.css` is dead Vite-template CSS (not imported anywhere) — safe to ignore/delete.
- Seat map is purely client-generated from `totalSeats`; no per-seat pricing tiers.
