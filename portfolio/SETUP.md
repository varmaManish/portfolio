# Admin Panel Setup Guide

Your portfolio now has a full admin panel powered by **Firebase**. Follow these steps to get it working.

---

## Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**, name it (e.g., `manish-portfolio`)
3. Disable Google Analytics (optional), click **Create project**

---

## Step 2 — Enable Firestore Database

1. In the left sidebar, go to **Build > Firestore Database**
2. Click **Create database**
3. Select **Start in production mode**
4. Choose a region close to you (e.g., `asia-south1` for India)
5. Click **Enable**

---

## Step 3 — Set Firestore Security Rules

In Firestore > **Rules** tab, replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

---

## Step 4 — Enable Authentication

1. Go to **Build > Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable **Email/Password**
4. Go to the **Users** tab, click **Add user**
5. Enter your admin email and a strong password
6. Save the credentials somewhere safe — this is your admin login

---

## Step 5 — Get Your Firebase Config

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll down to **Your apps**, click **Add app > Web**
3. Register with any nickname (e.g., `portfolio-web`)
4. Copy the `firebaseConfig` object shown

---

## Step 6 — Update firebase-config.js

Open `firebase-config.js` in your project root and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 7 — Deploy and Log In

1. Deploy your site (GitHub Pages, Netlify, Vercel, etc.)
2. Navigate to `your-site.com/admin/` or open `admin/index.html` locally
3. Log in with the email + password you created in Step 4
4. You'll see the admin dashboard

---

## Step 8 — Import Your Existing Data (First Time Only)

On your first login, you'll see a banner:
> **"First time here? Import your existing portfolio data"**

Click **Import Existing Data** — this seeds Firestore with all your current hardcoded projects and blog posts. You can then edit them from the dashboard.

---

## What You Can Manage from the Admin Panel

### Projects Tab
- Add, edit, delete projects
- Toggle visibility (show/hide on the site)
- Mark a project as "Featured" (spans full width)
- Set display order (1 = first)
- Add Live URL, Source Code URL, Architecture detail URL

### Blog Posts Tab
- Write and publish blog posts
- Content supports HTML (`<h2>`, `<p>`, `<code>`, `<pre>`, `<ul>`, etc.)
- Toggle Draft / Published
- Each post gets its own URL: `blog-post.html?id=xxx`

### Settings Tab
- Toggle the "Available for Roles" badge in the hero
- Update stats numbers (8+ Projects, 4+ Domains, etc.)
- Edit your About Me paragraphs
- Customize the typing animation phrases

---

## File Structure

```
portfolio SEO/
├── admin/
│   ├── index.html          ← Admin login page
│   └── dashboard.html      ← Admin dashboard (Projects, Blog, Settings)
├── assets/
│   ├── image.png
│   └── ManishResume.pdf
├── projectDocument/
│   ├── Fashion recomendation.html
│   └── Repoanlyzer.html
├── index.html              ← Homepage (loads settings + featured projects)
├── projects.html           ← Projects page (loads all from Firestore)
├── blog.html               ← Blog list (loads published posts)
├── blog-post.html          ← Individual blog post reader
├── project-detail.html     ← Project detail page
├── firebase-config.js      ← YOUR FIREBASE CONFIG GOES HERE
├── main.js                 ← Shared JavaScript
├── style.css               ← Design system
├── config.js               ← EmailJS config
└── SETUP.md                ← This file
```

---

## Important Notes

- **Never commit `firebase-config.js` to a public repo** with real credentials. Add it to `.gitignore` or use environment variables with your hosting provider.
- The portfolio works perfectly without Firebase set up — it shows your hardcoded content as a fallback. Firebase just enables the admin panel.
- To add more admins later: Firebase Console > Authentication > Users > Add user.

---

## Hosting on GitHub Pages / Netlify

Both work great with this static site. Firebase is client-side only, so no server is needed.

For Netlify: `netlify deploy --dir="portfolio SEO"` or connect your repo.
For GitHub Pages: push to `gh-pages` branch or configure from Settings > Pages.
