# 🎬 Aurora Cinema — Premium Movie Ticket Booking System

Aurora Cinema is a modern, premium, full-stack **movie ticket booking platform** (BookMyShow-style). It offers a complete end-to-end customer journey from discovering movies to secure ticket purchasing, backed by a robust role-based admin dashboard with multi-theatre scoping.

---

## 🚀 Key Features

### 🌟 Client-Facing Features
*   **Cinematic Discovery:** Sleek landing page featuring a curated hero section, movie card search, and instant genre/language filtering.
*   **Showtimes & Venues:** Grouped showtimes with automated filtering of past shows and today's elapsed showtimes.
*   **Real-time Seat Selection:** Interactive seat grid mapping featuring **30-second background polling** to sync seat availability instantly across users.
*   **5-Minute Seat Locking:** Server-side transaction locks on chosen seats. If a user enters the payment page, their seats are marked as `PENDING` and locked for 5 minutes to prevent double-booking.
*   **Razorpay Payment Integration:** Fully integrated secure payment gateway via Razorpay API.
*   **Interactive E-Ticket:** Confirmed bookings generate a visual ticket with a **scan-to-enter QR Code** and a direct option to **Download as PDF**.
*   **Booking History & Cancellation:** View personal booking logs and cancel tickets instantly up to 1 hour before the showtime (automatic seat release).

### 🏛️ Admin & Management Features
*   **Theatre Admin Scoping (Data Isolation):**
    *   Theatre admins are pinned to a specific theatre (e.g., *PVR Forum Mall*, *AMB Cinemas*).
    *   Admins only see screens, shows, bookings, and reports for **their assigned theatre**.
    *   Super Admin retains global visibility of combined reports across all theatres.
*   **Streamlined Management UI:**
    *   **Theatre Banner:** Dashboard displays a prominent golden banner identifying the admin's assigned theatre.
    *   **Auto-set Theatre:** When adding screens or scheduling shows, the theatre selection is automatically configured and hidden to prevent user error.
*   **OMDb Movie Integration:** Search the OMDb database, import movies with safe runtime parsing, and upload posters directly to Cloudinary.
*   **Reports & Business Analytics:** Grouped analytics, charts, date-range booking queries, and direct exports of reports.
*   **Super Admin Approvals:** Gated dashboard for approving new theatre admin requests.
*   **Secure OTP Login:** Two-factor passwordless verification using dynamically sent email OTPs branded specifically for Aurora Cinemas.

---

## 🛠️ Technology Stack

### Backend
*   **Core:** Spring Boot 4.1.0 (Spring 7), Java 17, Maven
*   **Database:** MySQL (Spring Data JPA)
*   **Security:** Spring Security + JWT, custom OTP verification table, and method-level roles (`@PreAuthorize`)
*   **Email:** Spring Mail integration with HTML templates (using thymeleaf/mime-helper)
*   **Media Storage:** Cloudinary integration for image uploads

### Frontend
*   **Core:** React 19, Vite 8
*   **UI Library:** MUI v9 (Material-UI) styled with a custom **Cinematic Noir design system** (warm typography, glassmorphism, and dark modes)
*   **State Management:** Redux Toolkit (Auth state management)
*   **HTTP Client:** Axios with custom interceptors
*   **Features:** `html2canvas` & `jsPDF` for ticket exports, `recharts` for analytical charts, and `qrcode.react` for verification QR codes

---

## 📦 How to Setup & Run

### 1. Prerequisites
*   Java Development Kit (JDK) 17+
*   Node.js v18+
*   MySQL Database server (running on `localhost:3306`)

### 2. Database Configuration
Create a database named `moviebooking` in your MySQL server:
```sql
CREATE DATABASE moviebooking;
```

Configure your credentials in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/moviebooking
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

### 3. Running the Backend
From the `backend/` directory:
```bash
# Run using maven wrapper
./mvnw spring-boot:run
```
*The database tables will be created automatically and populated with initial theatres, admins, and movie records.*

### 4. Running the Frontend
From the `frontend/` directory:
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

---

## 👥 Seeded Theatre Admin Accounts
Use these pre-configured theatre owner accounts to test scoped administrative functionality (Password for all accounts is `1234`):

1.  **PVR Forum Mall:** `s.jayanthbhai1@gmail.com`
2.  **Prasads Multiplex:** `s.jayanthkumar1234@gmail.com`
3.  **AMB Cinemas:** `erewards79@gmail.com`
4.  **Inox Garuda Mall:** `hemanth73060@gmail.com`
5.  **PVR Director's Cut:** `yaswanthsai_mannem@srmap.edu.in`
6.  **Sathyam Cinemas:** `raviprakashreddy_kontham@srmap.edu.in`
7.  **Inox Marina Mall:** `samathamsankar@gmail.com`
