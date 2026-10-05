# Brady asset samples

React + TypeScript + Vite demo using only the **Samples** worksheet from the supplied Excel workbook. Select a sample, view its ten fields, and download or print its unique QR label. Public `/asset/:code` links show the same fields without login.

## Run locally

Requires Node.js 22.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. For a phone on the same Wi-Fi, use the network URL printed by Vite. QR codes use the origin from which you opened the app; a `localhost` QR cannot open this app on another phone.

```sh
npm run build
npm run preview
```

## Sample data

`src/data/samples.json` is extracted from the Samples worksheet, preserving full values, identifiers, multiple purchase orders, and quantity units. Excel serial dates become ISO dates, displayed as readable dates. Asset type labels come from headings in that same worksheet.

To refresh data after replacing the source workbook:

```sh
npm run extract:samples
npm run build
```

Each demo SAP code is the asset code padded to 16 characters; these are placeholders, not assigned production SAP codes.

## Cloudflare Pages deployment

`.github/workflows/deploy.yml` follows the supplied workflow and deploys `dist` to the **brady10labels** project on pushes to `main` or manual dispatch.

1. Connect this repository to GitHub.
2. Add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The API token needs Cloudflare Pages edit access for the account.
3. Push to `main` or run the workflow manually.
4. Open the URL reported by the deployment and download a label from that live site for Yekesh.

By default, every QR contains the current site's origin plus `/asset/<asset-code>`. Set the GitHub Actions repository variable `PUBLIC_URL` if QR codes should always use a canonical production origin, for example `https://brady10labels.pages.dev` or your custom domain. It is passed to the build as `VITE_PUBLIC_URL`. `.env.example` documents the local equivalent.

`public/_redirects` provides SPA fallback for direct asset links and reloads. No audio file or source workbook is included in the deployment; the public bundle contains the sample data.

## Labels

Download label saves a 1000 × 1000 PNG with a QR and the SAP code below. Print uses a dedicated 50 × 50 mm layout. Select actual size/100% and disable browser print headers and footers. The quiet zone is included in both formats.

## Scope

This is the approved read-only sample demo. Login, editing, shared uploads, and movement tracking require a later implementation with authenticated storage.
