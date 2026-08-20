import { describe, expect, it } from "vitest";
import {
  autoMapColumns,
  indexExistingProducts,
  matchZipEntriesForSku,
  parseCsv,
  parsePrice,
  parseStock,
  planImportRows,
  skuKey,
  slugifyProduct,
  summarizeNotInFile,
  type ExistingProduct,
} from "@/lib/catalogImport/engine";

const categories = [
  { id: "cat-sarees", name: "Sarees", slug: "sarees" },
  { id: "cat-jeans", name: "Men's Jeans", slug: "mens-jeans" },
];

const existing: ExistingProduct[] = [
  { id: "uuid-akmcc90", sku: "AKMCC90", product_code: "AKMCC90", slug: "akmc-sani-1007", image_url: "https://example/sani.webp" },
];

describe("catalog import engine", () => {
  it("maps Pd Data.xlsx and simple template headers", () => {
    const pd = autoMapColumns([
      "Sr",
      "Product Name",
      "Product Code",
      "MRP",
      "Selling Price",
      "AKM Care Selling Price",
      "Quantity",
      "Product (Short & Detail) Descriptions",
    ]);
    expect(pd.sku).toBe("Product Code");
    expect(pd.name).toBe("Product Name");
    expect(pd.price).toBe("AKM Care Selling Price");
    expect(pd.stock).toBe("Quantity");

    const simple = autoMapColumns(["SKU", "Product Name", "Category", "Price", "Stock", "Image"]);
    expect(simple.sku).toBe("SKU");
    expect(simple.category).toBe("Category");
    expect(simple.image).toBe("Image");
  });

  it("parses CSV including quoted commas", () => {
    const { headers, rows } = parseCsv(`SKU,Product Name,Category,Price,Stock,Image
AKMCC90,"AKMC SANI - 1007, Print",Sarees,468,10,AKMCC90.jpg
`);
    expect(headers[0]).toBe("SKU");
    expect(rows[0]["Product Name"]).toContain("Print");
    expect(rows[0].Price).toBe("468");
  });

  it("rejects invalid price and stock", () => {
    expect(parsePrice("abc").ok).toBe(false);
    expect(parsePrice(0).ok).toBe(false);
    expect(parsePrice(-1).ok).toBe(false);
    expect(parsePrice("499").ok).toBe(true);
    expect(parseStock(1.5).ok).toBe(false);
    expect(parseStock(-1).ok).toBe(false);
    expect(parseStock(6).ok).toBe(true);
  });

  it("matches ZIP files to SKU without creating extra SKUs", () => {
    const files = ["AKMCC90.jpg", "akmcc90-2.png", "folder/AKMCC91.webp", "readme.txt", "AKMCC900.jpg"];
    expect(matchZipEntriesForSku("AKMCC90", files)).toEqual(["AKMCC90.jpg", "akmcc90-2.png"]);
    expect(matchZipEntriesForSku("AKMCC91", files)).toEqual(["folder/AKMCC91.webp"]);
  });

  it("UPDATE existing SKU keeps product UUID (no create)", () => {
    const { planned, report } = planImportRows({
      rows: [
        {
          SKU: "AKMCC90",
          "Product Name": "AKMC SANI - 1007",
          Category: "Sarees",
          Price: 499,
          Stock: 6,
          Image: "AKMCC90.jpg",
        },
      ],
      columnMap: autoMapColumns(["SKU", "Product Name", "Category", "Price", "Stock", "Image"]),
      mode: "update_existing",
      existing,
      categories,
      zipFilenames: ["AKMCC90.jpg"],
    });
    expect(planned).toHaveLength(1);
    expect(planned[0].validationStatus).toBe("valid");
    expect(planned[0].action).toBe("update");
    expect(planned[0].existingProductId).toBe("uuid-akmcc90");
    expect(planned[0].normalized?.price).toBe(499);
    expect(planned[0].normalized?.stock).toBe(6);
    expect(report.createCount).toBe(0);
    expect(report.updateCount).toBe(1);
  });

  it("ADD NEW does not duplicate an existing SKU", () => {
    const { planned } = planImportRows({
      rows: [
        {
          SKU: "akmcc90",
          "Product Name": "AKMC SANI - 1007",
          Category: "Sarees",
          Price: 468,
          Stock: 10,
          Image: "AKMCC90.jpg",
        },
      ],
      columnMap: autoMapColumns(["SKU", "Product Name", "Category", "Price", "Stock", "Image"]),
      mode: "add_new",
      existing,
      categories,
      zipFilenames: ["AKMCC90.jpg"],
    });
    expect(planned[0].errors).toContain("sku_already_exists");
    expect(planned[0].validationStatus).toBe("invalid");
    expect(planned[0].existingProductId).toBe("uuid-akmcc90");
  });

  it("retry of the same SKU still maps to one existing product id", () => {
    const map = indexExistingProducts(existing);
    expect(map.get(skuKey("AKMCC90"))?.id).toBe("uuid-akmcc90");
    expect(map.get(skuKey("akmcc90"))?.id).toBe("uuid-akmcc90");
    const secondPass = planImportRows({
      rows: [
        { SKU: "AKMCC90", "Product Name": "AKMC SANI - 1007", Category: "Sarees", Price: 499, Stock: 6, Image: "AKMCC90.jpg" },
        { SKU: "AKMCC90", "Product Name": "duplicate row", Category: "Sarees", Price: 499, Stock: 6, Image: "AKMCC90.jpg" },
      ],
      columnMap: autoMapColumns(["SKU", "Product Name", "Category", "Price", "Stock", "Image"]),
      mode: "sync",
      existing,
      categories,
      zipFilenames: ["AKMCC90.jpg"],
    });
    expect(secondPass.report.duplicateSkuCount).toBe(1);
    expect(secondPass.planned.filter((p) => p.validationStatus === "valid")).toHaveLength(1);
    expect(secondPass.planned[0].existingProductId).toBe("uuid-akmcc90");
  });

  it("SYNC creates + updates and never plans deletes", () => {
    const { planned, report } = planImportRows({
      rows: [
        { SKU: "AKMCC90", "Product Name": "AKMC SANI - 1007", Category: "Sarees", Price: 499, Stock: 6, Image: "AKMCC90.jpg" },
        { SKU: "AKMCC91", "Product Name": "AKMC SANI - 1008", Category: "Sarees", Price: 520, Stock: 8, Image: "AKMCC91.jpg" },
      ],
      columnMap: autoMapColumns(["SKU", "Product Name", "Category", "Price", "Stock", "Image"]),
      mode: "sync",
      existing,
      categories,
      zipFilenames: ["AKMCC90.jpg", "AKMCC91.jpg"],
    });
    expect(report.updateCount).toBe(1);
    expect(report.createCount).toBe(1);
    expect(planned.every((p) => p.action !== "skip" || p.validationStatus === "invalid")).toBe(true);
    const notInFile = summarizeNotInFile(["AKMCC90", "ORPHAN1"], planned);
    expect(notInFile).toEqual(["ORPHAN1"]);
  });

  it("flags missing images, invalid category, and missing required fields", () => {
    const { planned, report } = planImportRows({
      rows: [
        { SKU: "", "Product Name": "", Category: "UnknownCat", Price: "x", Stock: "-3", Image: "" },
        { SKU: "NEW1", "Product Name": "New", Category: "Sarees", Price: 10, Stock: 1, Image: "" },
      ],
      columnMap: autoMapColumns(["SKU", "Product Name", "Category", "Price", "Stock", "Image"]),
      mode: "sync",
      existing,
      categories,
      zipFilenames: [],
    });
    expect(planned[0].errors).toEqual(
      expect.arrayContaining(["missing_sku", "missing_name", "invalid_category", "invalid_price", "invalid_stock"]),
    );
    expect(planned[1].errors).toContain("missing_image");
    expect(report.missingImageCount).toBeGreaterThanOrEqual(1);
  });

  it("slugifies names without touching existing slug on update plan", () => {
    expect(slugifyProduct("AKMC SANI - 1007")).toBe("akmc-sani-1007");
    const { planned } = planImportRows({
      rows: [
        { SKU: "AKMCC90", "Product Name": "Renamed", Category: "Sarees", Price: 499, Stock: 6, Image: "AKMCC90.jpg" },
      ],
      columnMap: autoMapColumns(["SKU", "Product Name", "Category", "Price", "Stock", "Image"]),
      mode: "update_existing",
      existing,
      categories,
      zipFilenames: ["AKMCC90.jpg"],
    });
    expect(planned[0].existingSlug).toBe("akmc-sani-1007");
    expect(planned[0].normalized?.slug).toBe("akmc-sani-1007");
  });
});
