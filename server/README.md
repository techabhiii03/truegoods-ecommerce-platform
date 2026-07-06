# Server Starter — Auth Module

This is a working backend slice: MongoDB connection + JWT register/login/me/refresh/logout.
It matches the architecture plan's folder structure, just with the `product/cart/order` pieces
left as commented-out placeholders in `src/app.js` for you to fill in next.

## Setup

1. **Copy these files into your existing `server/` folder**, merging with what you already have
   (your `package.json` from `npm init -y` will be replaced by the one included here — it already
   lists the packages you installed, plus `cookie-parser` and `nodemon`, which you'll need to add).

2. Install dependencies:
   ```powershell
   npm install
   npm install cookie-parser
   npm install -D nodemon
   ```

3. Create your real `.env` file from the example:
   ```powershell
   copy .env.example .env
   ```
   Then fill in:
   - `MONGO_URI` — from MongoDB Atlas (Database → Connect → Drivers)
   - `JWT_SECRET` and `JWT_REFRESH_SECRET` — generate with:
     ```powershell
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
     (run twice, once for each secret)

4. Add a `dev` script shortcut (already in package.json) and run:
   ```powershell
   npm run dev
   ```

5. You should see:
   ```
   MongoDB connected: <your-cluster-host>
   Server running in development mode on port 5000
   ```

## Test it

With the server running, test in a new terminal (or Postman/Thunder Client):

```powershell
curl http://localhost:5000/api/health

curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}'

curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'
```

A successful login returns a JSON body with `accessToken` and sets an httpOnly `refreshToken` cookie.

## What's included

- `src/config/db.js` — Mongoose connection
- `src/models/User.js` — User schema with password hashing (bcrypt) and a `matchPassword` method
- `src/controllers/authController.js` — register, login, refresh, logout, get current user
- `src/middleware/authMiddleware.js` — `protect`, verifies JWT and attaches `req.user`
- `src/middleware/adminMiddleware.js` — `requireAdmin`, gate admin-only routes
- `src/middleware/errorHandler.js` — centralized error + 404 handling
- `src/routes/authRoutes.js` — wires it all together at `/api/auth/*`
- `src/app.js` / `src/server.js` — Express app + entry point

## Next step

Once this is running and you can register/login successfully, the next milestone is the
**Product model + listing/search/filter endpoints** (Step 2 in the build order). Just ask when ready.
