# Asset tagging QR demo

Sources: `Call with Yekesh.m4a`, `Asset Classification for Asset Tagging 1.xlsx`, and `refer/deploy.yml`.

## Requirements from the call

- Give each asset a unique QR code.
- Scanning with a normal phone camera opens a public URL showing all ten asset details in a readable layout. A login is not required to view an asset.
- The call initially discusses encoding details directly, then agrees on a URL linking to an asset detail page.
- Print a QR code with a SAP code underneath. Use a dummy 16-character code for the demo; the actual code will be supplied later.
- Target a label approximately 50 × 50 mm (also described in the call as two inches square). Confirm exact printer dimensions before production printing.
- Yekesh needs a shareable sample QR for the first demonstration. He will scan it on his phone to show the details.
- Excel upload, authenticated data entry, and QR printing were discussed as application capabilities. The first review can use the supplied sample records.
- Asset movement tracking belongs to phase two.

User clarification: use only the Samples sheet for the demo. The ten refers to the ten detail fields shown for each sample; the eight asset types are classifications, not the field count. The Asset Classification and Specs sheets do not define additional pages or demo requirements.

## Ten asset fields

1. Asset Code
2. Asset Name
3. PO number
4. Vendor Code
5. Vendor Name
6. Asset Location
7. Cost Center
8. Quantity
9. Useful Life
10. Capitalization Date

Store identifiers as strings to preserve leading zeroes. Preserve multiple PO numbers and quantity units. Convert Excel dates into readable dates.

## Workbook contents

Use the Samples sheet as the data source. It contains these sample records, each with the ten fields listed above:

| Asset code | Asset name | Classification |
| --- | --- | --- |
| 1300004353 | Sifter (Size- 30 Inch) | Plant & Machinery |
| 1300004364 | Laboratory Hot Air Oven (ID.No.: RQ/LDO-05) | Laboratory Equipment |
| 1300004362 | Main Control Panel | Electrical Equipment |
| 1300004402 | TV - STV75 in QA Conference Room | Office equipment |
| 1300004366 | HP ProBook 440 G11-11 No's | IT Equipment |
| 1700001080 | Sofa 2 Seater- Alexa Half leather grey sofa set | Furniture & Fixtures |
| 1700001098 | HDPE Pallet :1200X1000X150 MM- Nilkamal | Furniture & Fixtures |
| 1400000021 | Electric Scooter Chetak 3501 - 1 No | Vehicles |

Preserve the complete field values in Samples; do not impose character limits from the separate Specs sheet.

Some records cover multiple physical items (for example, eleven laptops and sixty pallets). Use one QR per supplied asset record in the demo. Individual item tagging requires a later decision about item identifiers.

## Implemented first build

Use React, TypeScript, and Vite.

### Samples page

- Provide a simple way to select a sample from the Samples sheet.
- Show all ten fields for the selected sample and its QR label.
- Use the sample's asset type as context, with no separate classification page or asset-management dashboard.

### Public asset details

- Permanent route such as `/asset/1300004353`.
- Mobile-friendly layout with the asset name and code prominently displayed.
- All ten fields available after scanning.
- Clear missing-asset state for an unknown code.

### QR labels

- Generate a QR containing the final deployed asset URL.
- Display a unique dummy 16-character SAP code underneath, clearly identified as demo data in the app.
- Download a QR image and print a roughly 50 × 50 mm label.
- Provide a downloadable sample QR for Yekesh.
- Retain the QR quiet zone and test that a decoded QR matches the deployed URL.

### Deployment

Adapt `refer/deploy.yml` into `.github/workflows/deploy.yml`: install dependencies with `npm ci`, build with `npm run build`, and deploy `dist` to a dedicated Cloudflare Pages project. Replace the reference project's `srshti-creative-studio` name.

The repository needs a GitHub remote and the workflow's Cloudflare API token/account ID secrets to deploy. Generate the shareable QR against the actual public deployment URL and verify direct asset routes after deployment.

The first demo can bundle the sample data with the app. Authenticated editing and shared Excel imports require persistent storage and an authenticated write API; include those in a subsequent implementation stage rather than implying that browser-local edits are shared across phones.

The read-only demo is implemented, including sample selection, search and type filtering, all ten detail fields, public asset routes, QR generation, PNG label download, and 50 × 50 mm printing. Data is extracted by `scripts/extract_samples.py` from Samples only. The deployment workflow targets `brady10labels`; publishing still requires a GitHub remote and Cloudflare repository secrets.

## Acceptance checks

- A phone scan of the shared QR opens the correct public asset page without login.
- All ten fields match the workbook, with full strings and correct dates.
- Each supplied asset has its own QR URL and demo SAP code.
- A printed label places the SAP code beneath a readable QR.
- Direct navigation and refresh on an asset URL work on Cloudflare Pages.
- An unknown asset code displays a useful message.
- Asset movement features are deferred to phase two.
