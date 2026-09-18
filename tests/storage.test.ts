import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_PAYLOAD_HASH, amzDateOf, encodeSegment, signV4 } from "@/lib/storage/sigv4";

test("SigV4 matches AWS's published GET Object example", () => {
  // https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
  const { signature, authorization } = signV4({
    method: "GET",
    path: "/test.txt",
    headers: {
      Host: "examplebucket.s3.amazonaws.com",
      Range: "bytes=0-9",
      "x-amz-content-sha256": EMPTY_PAYLOAD_HASH,
      "x-amz-date": "20130524T000000Z",
    },
    payloadHash: EMPTY_PAYLOAD_HASH,
    region: "us-east-1",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  });
  assert.equal(signature, "f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41");
  assert.match(authorization, /SignedHeaders=host;range;x-amz-content-sha256;x-amz-date/);
});

test("SigV4 helpers", () => {
  assert.equal(amzDateOf(new Date("2013-05-24T00:00:00.123Z")), "20130524T000000Z");
  assert.equal(encodeSegment("a b(1)*.png"), "a%20b%281%29%2A.png");
});
