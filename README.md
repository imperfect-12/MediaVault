# MediaVault

MediaVault is a MERN personal media tracker for movies, series, anime, and games. It uses JWT auth in httpOnly cookies, MongoDB via Mongoose, and Cloudinary poster uploads from the React client.

## Structure

- `client/` - Vite, React, React Router, Axios, plain CSS
- `server/` - Express, Mongoose, JWT auth, media CRUD, Cloudinary signature route

## Setup

Install dependencies:

```powershell
cd server
npm install
cd ../client
npm install
```

Set `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/mediavault
JWT_SECRET=replace-with-a-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PORT=5000
CLIENT_URL=http://localhost:5173
```

Set `client/.env`:

```env
VITE_API_URL=
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
```

Run the API:

```powershell
cd server
npm run dev
```

Run the client:

```powershell
cd client
npm run dev
```

The client runs at `http://localhost:5173` and proxies `/api` to `http://localhost:5000`.

## Notes

- `VITE_CLOUDINARY_UPLOAD_PRESET` must be an unsigned upload preset from Cloudinary for direct poster uploads.
- Media entries are always scoped to the authenticated user on the server.
- Section pages include search, sort, entry counts, status dots, favourites, and ratings.
