# Custom studio: orders and fulfillment

The homepage shows three starting ideas. Each sample opens /pages/design-studio with the garment, color, artwork, and placement selected. /pages/create-your-own shows the five real catalog garments.

## Finding the customer's design

Open the Shopify order and expand the customized line item's properties.

- **Design preview** opens a hosted PNG showing the garment with the customer's artwork.
- **Front artwork** opens a transparent PNG layout for the front.
- **Back artwork** appears when the customer designs the back.
- **Design** lists the chosen artwork or lettering. **Colorway** identifies the selected color.
- The hidden _config property retains placement data and lettering for reference.

The studio creates these images before adding the item. Shopify stores the files through native multipart line-item property uploads. No Cloudinary account or browser-local storage is required for the order images. The cart also links to the hosted proof.

If an image cannot be generated, the studio stops before adding the item. If Shopify returns an item without the expected uploaded files, the studio attempts to remove that item and reports the failure.

## Preparing the physical item

The preview is a visual production reference. Transparent artwork files use the garment photograph's dimensions as a layout reference; they are not calibrated to physical print dimensions. Review placement and size in the supplier's production editor.

**Shopify attachments do not automatically change an ODMPOD print file.** Review the custom order and apply its artwork in ODMPOD before approving production. Confirm the supplier's automatic order-approval settings fit this manual custom-design workflow. Do not assume the supplier will read Shopify attachments or replace the blank garment automatically.

## Vintage Hoodie grouping

The ten imported Vintage Hoodie products remain active with their original variants, SKUs, inventory, and ODMPOD associations. Collection and search grids present one family card. Its product page shows linked color choices, and the studio groups all ten into one garment.

Selecting a color uses that source product's existing variant ID. The two imported Black options are preserved as Black and Black · 2 with their corresponding photos. Duplicate source URLs remain valid; canonical metadata points to the main hoodie page. This is a storefront grouping, not an Admin product merge. Shopify collection/search pagination and external product feeds still use the underlying separate products.

This behavior is implemented in studio-catalog.liquid, vintage-hoodie-colors.liquid, the product section, and product grid sections. Reimported products with different handles must be added there.

## Verification

A native multipart upload was tested against an isolated cart using a Brown/M Vintage Hoodie. Shopify returned hosted PNG URLs for both the preview and front artwork. The downloaded proof's pixels matched the generated test image. The test item was removed and the cart item count was verified as zero. No checkout or order was created.

