# Responsive images

Post thumbnails, article covers, and ordinary local Markdown images use the same
Cloudinary component. It emits JXL first, then AVIF, then WebP, with responsive
`srcset` widths. Formats are explicit; the component does not use `f_auto`.

## Current site

The three thumbnails were already uploaded, but their entries were missing from
`src/data/cloudinary-breakpoints.json`. This made the component fall back to
Next.js image optimization. The restored entries use Cloudinary-generated
breakpoints, and the originals were verified to match the repository files.
The existing Gulfstream entry is preserved.

The deployment needs `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=paulapplegate-com` at build
time. The live Gulfstream image already uses this setting. Merge and deploy the
updated manifest to enable the same delivery for the thumbnails and local
Markdown image. No re-upload or private credentials are needed for these images.

## Adding an image

1. Place the image in `public/thumbnails/` or `src/assets/images/`.
2. Keep the following settings in `.env.local` (or `.env`):

   ```dotenv
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=paulapplegate-com
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. Run the upload command from the project directory:

   ```sh
   pnpm cloudinary:breakpoints public/thumbnails/my-photo.jpg
   ```

   Multiple files can be processed in one command:

   ```sh
   pnpm cloudinary:breakpoints public/thumbnails/*.jpg
   ```

   The script saves each successful image's dimensions and breakpoints before
   moving to the next image, and preserves existing manifest entries.

4. Use the existing local path in front matter or Markdown:

   ```yaml
   thumbnail: /thumbnails/my-photo.jpg
   ```

   ```md
   ![Describe the photo](/thumbnails/my-photo.jpg)
   ```

   For an image under `src/assets/images/`, use the `<Picture>` snippet printed
   by the command. No MDX import is required.

5. Commit the image, the content change, and
   `src/data/cloudinary-breakpoints.json`, then deploy. Keep `.env` and
   `.env.local` private. Only the public cloud name is needed by the deployed
   image components; the API key and secret are used by the local upload script.

## Checking delivery

Open the page source and look for `<picture>`, `image/jxl`, `image/avif`,
`image/webp`, and `srcset`. In the browser's Network panel, the selected image's
response `Content-Type` confirms the actual format.

A JPG filename inside a `/_next/image?url=...` URL identifies the original image,
not necessarily the delivered format. That URL means the Next.js fallback is
being used. Check the public cloud name and the matching manifest entry.

Local paths such as `/thumbnails/my-photo.jpg` map to the public ID
`thumbnails/my-photo`. Uploading an image alone is insufficient: its manifest
entry must also reach the deployment.

External images in the MDX demonstration still use their original remote URLs;
they have not been uploaded to this Cloudinary account. To use the Cloudinary
pipeline for a remote image, save it locally and follow the same steps above.
SVGs stay as SVGs, and the demo's deliberate `error.jpg` example remains a
missing-image demonstration.
