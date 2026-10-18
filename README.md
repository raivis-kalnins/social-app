# Social 63 — Social Media Command Centre

**Target URL:** https://social.63.lv/  
**Release:** v1.1.0 — standalone PHP + vanilla JavaScript/CSS + installable PWA  
**Architecture inspired by:** [Radio 63](https://github.com/raivis-kalnins/radio-app) (separate standalone PHP/PWA project)

Social 63 is an editable, self-hosted **social media management starter application** with a dashboard inspired by the provided Social 63 UI reference. It installs on ordinary cPanel PHP hosting; it does not require React build tools, Composer, a Node server or a database connection.

## What works in v1.1.0

| Area | Working functionality |
| --- | --- |
| Secure sign-in | Login/logout, strong password hashes, CSRF protection, login rate limiting, secure sessions, password change |
| Dashboard | Responsive KPIs, review sentiment, content planner, recent inbox, channel status and SVG performance charts |
| Posts / planner | Create, edit and delete drafts; attach uploaded media; plan dates; manually mark a post published; week/month calendar |
| Video analytics | Record/edit video URLs, views, likes, comments and shares; compare cards |
| YouTube API | **Optional** server-to-server YouTube Data API v3 integration for public channel statistics and up to 12 recent videos |
| Reviews | Add/edit customer reviews, star ratings, sentiment and local reply drafts |
| Unified inbox | Add inbox records, track read/unread state and save draft replies |
| Channels | Store Instagram, Facebook, TikTok, YouTube, X, LinkedIn, Google Business etc. handles and counts; explicit connection status |
| Campaigns | Create/edit campaign plans, budgets, platform, statuses and timelines |
| Analytics | Reach, engagement, video views, follower change and sentiment; date-range filters, daily-data entry and CSV export |
| Media library | Authenticated upload and protected viewing of JPG, PNG, WEBP, AVIF, GIF, MP4, WEBM, MOV; video range requests |
| Team | Owner/editor/viewer roles; owner can add/remove members; viewers cannot alter content |
| Login protection | Optional hCaptcha (owner-controlled Settings switch and keys; server-side verification) |
| Login discovery | DigitalPulse development CTA and links to Games, Translate, Radio, Whiteboard, Music Writer and Price 63 |
| Quality | Desktop/tablet/mobile layout, light/dark theme, full search, accessible labels, small self-hosted assets, no marketing trackers |
| PWA | Installable manifest and versioned static-assets-only service worker. User/API data are not cached offline. |

### Important integration limitations

- **Sample entries and statistics are explicitly marked Demo**, not real account statistics. To start with real records: **Settings → Clear demo data**. Manually entered records are preserved.
- **Planned posts are calendar entries**, not automatically queued to Instagram/TikTok/Facebook/X. There is no background publishing service in this starter version.
- **Review and inbox replies are locally saved drafts**, **not** sent to the review provider or the messaging network.
- **Saved social channels are not OAuth connections**. A Manual or Demo status must not be mistaken for a connected account.
- The YouTube integration supports **public** channel/video statistics using a YouTube Data API key. **Private YouTube Studio analytics require a separate authorised OAuth flow**, not implemented here.
- Full Meta Graph API, TikTok, LinkedIn, X, Google Business Profile review syncing, automatic posting, and unified social messages require individual app registration, official OAuth credentials, the correct API scopes and sometimes business verification/approval. No unsupported scraping or pretend integrations are included.
- This version uses a locking JSON-file store for **small, single-server workspaces**. A high-volume or multi-server SaaS requires migrating persistence to MySQL/PostgreSQL, job queues, audit controls and platform-specific OAuth connectors.

## Install on cPanel for `social.63.lv`

1. In cPanel, create or select the subdomain **social.63.lv**, ensure DNS points to the hosting account and enable **Force HTTPS Redirect** (AutoSSL or your SSL certificate).
2. In cPanel → MultiPHP Manager / Select PHP Version, choose **PHP 8.1 or later** with `json`, `fileinfo`, `openssl` and sessions enabled. No SQLite extension is required.
3. Upload the **contents** of `social63-starter` from the ZIP directly into the subdomain's document root, not into an additional nested `social63-starter` directory.
4. Ensure `.htaccess` and `storage/.htaccess` are included (upload ZIP then use cPanel **Extract**, which preserves dotfiles). Apache must respect `.htaccess`; it denies direct access to private files.
5. Make the `storage/` directory writable by your PHP hosting user. Use normal ownership and a restrictive directory mode, usually **0750** or **0755** if needed for that host; never use world-writable `0777` as a default. The app creates and protects `storage/data.json` on first use and stores uploaded files under `storage/media/`.
6. `config.local.php` is included in this **private deployment ZIP** with an initial admin **password hash**, not the plaintext password. Sign in using the admin login details you provided when requesting this application. **Change that temporary password in Settings → Account security after the first login**, since it was shared in the conversation.
7. Open [https://social.63.lv/](https://social.63.lv/) and sign in. Then go to Settings to rename the sample "Bright Bean Café" workspace and, when ready, **Clear demo data**.
8. Test creating a local draft, uploading a small image, signing out, and signing in again. Review cPanel PHP error logs if an error occurs.

### Server security requirements

`storage/` contains private data, uploaded files and hashed passwords. **Do not expose the storage folder to public HTTP requests**. The included `.htaccess` rules cover an Apache cPanel host, but if you deploy behind **Nginx without Apache**, you must explicitly deny any URL under `/storage/`, `/includes/`, and `/config.*` and require PHP processing for `.php` requests before going live. A stronger production arrangement is moving storage entirely outside the public document root and updating `SOCIAL63_DATA` / `SOCIAL63_UPLOADS` accordingly. For initial public rollouts, confirm by opening `https://social.63.lv/storage/data.json` in a logged-out browser: it **must** return 403/404, not download private content.

Keep `config.local.php` private and **never push it or the `storage/` contents to public GitHub**. Both are ignored by the provided `.gitignore`. Keep backups of the private `storage` directory and configuration separately from the website code.

The application has a `noindex` metadata directive by design; this is a private dashboard, not a public SEO landing page.

### Enable hCaptcha for login (optional)

1. Go to [hCaptcha Dashboard](https://dashboard.hcaptcha.com/), add `social.63.lv` as a site and obtain a **site key** and **secret key**.
2. Sign into Social 63 as an **Owner**. Open **Settings → hCaptcha login protection**.
3. Enter the public site key and private secret, tick **Enable hCaptcha**, and press **Save hCaptcha settings**.
4. Sign out or use a private browser window to confirm the challenge appears. **Verification is enforced by PHP**, not only by the JavaScript widget.
5. To disable it, sign in as an owner (or use your existing signed-in browser), untick **Enable hCaptcha** and save. You can optionally clear the saved keys.

The secret is saved only in the protected `storage/data.json` file, never returned by the API, never rendered into the browser or added to `config.local.php`. Back up that private file securely. Do not commit it to Git. hCaptcha's official script is loaded only when protection is on; the host's Content Security Policy permits its endpoints, and the server must be able to make **HTTPS POST** calls to `https://api.hcaptcha.com/siteverify`. If hCaptcha is unavailable, login requests are refused until verification can be performed. **Do not enable hCaptcha until both keys are correct.**

The application rejects the published hCaptcha test sitekeys on public hostnames because they do not provide bot protection. Test keys can be used only on local development hosts. On non-HTTPS `localhost` you may need to configure a test hostname, as hCaptcha's production challenges do not support standard localhost domains.

**Locked-out recovery:** If the hCaptcha configuration is unusable and no owner session is available, back up the protected `storage/data.json` via cPanel File Manager, then edit its `hcaptcha.enabled` property to `false` while keeping the rest of the file intact. Never replace the whole `data.json` with the sample database.

### Login-page links

The login introduction links to [DigitalPulse](https://digitalpulse.click/) and Games 63, Translate 63, Radio 63, Whiteboard 63, Music Writer 63 and Price 63. The design shows discovery links on both desktop and mobile.

### YouTube Data API v3 (optional)

1. In a Google Cloud project, enable **YouTube Data API v3** and create a restricted API key (restrict to YouTube Data API v3; if possible restrict to your server IP).
2. Open `config.local.php` on the server and set `youtube_api_key` to that key. **Keep it server-side**; never paste it into client JavaScript.
3. In Social 63 → Channels → Add channel, choose **YouTube**, enter a label and the **channel ID** (24 characters, begins with `UC`), and save.
4. Press **Sync**. Social 63 requests official `channels.list`, the uploads playlist, and video public statistics. Results are saved and labelled **API synced**. YouTube API quota and provider availability apply.
5. Subscribers/likes/comments may be hidden or unavailable on individual channels/videos; the API exposes only what the provider returns.

**No YouTube API key is shipped in the ZIP.** The demo continues to work without it.

### Upgrading without losing content

On an existing installation replace the changed files in `api.php`, `index.php`, `includes/core.php`, `assets/app.js`, `assets/app.css`, `VERSION`, `service-worker.js`, `README.md` and `THIRD_PARTY_NOTICES.md`. **Keep** the existing `config.local.php` and the entire `storage/` directory. Increment `VERSION`, asset query versions and the service-worker cache key when releasing a new build. Never upload a sample `storage/data.json` over your live data.

## Project layout

```text
social63-starter/
├── index.php                # HTML app shell & login
├── api.php                  # Authentication, content, videos, CSV, uploads, YouTube API
├── config.example.php       # Public template for private server settings
├── config.local.php         # Private initial deployment settings (Git ignored)
├── includes/core.php        # Data model, locking store, security and validation
├── assets/app.css           # Responsive UI & light/dark mode
├── assets/app.js            # Dashboard, pages, forms, charts & actions
├── assets/icon.svg          # Logo / PWA icon
├── storage/.htaccess        # Deny all direct HTTP requests
├── router.php               # Security router for local PHP development only
├── service-worker.js        # Versioned public asset caching only
├── manifest.webmanifest    # PWA metadata
├── .htaccess                # Apache security rules
└── README.md
```

## Local development and sanity checks

From the app folder:

```bash
php -S 127.0.0.1:8080 router.php
```

Open `http://127.0.0.1:8080/`. **Use the included router when running PHP's built-in development server:** unlike Apache, it does not interpret `.htaccess` and would otherwise expose private storage. Do not use the development server as your production host.

Syntax checks:

```bash
php -l index.php
php -l api.php
php -l includes/core.php
node --check assets/app.js
```

For screenshots, a real browser can be used against the local server or staging HTTPS domain. Browser rendering and official remote API sync must also be tested on the eventual hosting environment with its exact PHP/SSL settings.

## Credits

Created for the 63.lv app family · [DigitalPulse](https://digitalpulse.click/). SVG interface icons are based on common geometric icon primitives; Lucide icon design conventions (MIT licence) informed the visual style. No external JavaScript frameworks, trackers or icon CDNs are used.
