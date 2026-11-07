import assert from "node:assert/strict";
import { test } from "node:test";
import { extensionForImage, uploadPathFor } from "./product-images.ts";

test("accepts a real jpeg signature and rejects a renamed text file", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(extensionForImage(jpeg, "image/jpeg"), "jpg");
  assert.equal(extensionForImage(jpeg, "image/png"), null);
  assert.equal(extensionForImage(new Uint8Array([0x3c, 0x73, 0x63, 0x72, 0, 0, 0, 0, 0, 0, 0, 0]), "image/png"), null);
});

test("only allows generated upload filenames", () => {
  assert.equal(uploadPathFor("a".repeat(32) + ".png"), `/uploads/products/${"a".repeat(32)}.png`);
  assert.equal(uploadPathFor("../secret.png"), null);
  assert.equal(uploadPathFor("short.png"), null);
});
