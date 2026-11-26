import { describe, it, expect } from "vitest";
import { dserverUri, loginCommand, webAddress } from "@/utils/dtoolCommand";

describe("dserverUri", () => {
  it("converts a base URI", () => {
    expect(dserverUri("s3://dtool-bucket", "dtool.example.org")).toBe(
      "dserver://dtool.example.org/s3/dtool-bucket",
    );
  });

  it("converts a dataset URI and keeps the port", () => {
    expect(
      dserverUri(
        "azure://container/1b9ab8f7-3c94-4fd1-9a52-2e0e3cf7e3a0",
        "127.0.0.1:8080",
      ),
    ).toBe(
      "dserver://127.0.0.1:8080/azure/container/1b9ab8f7-3c94-4fd1-9a52-2e0e3cf7e3a0",
    );
  });

  it("accepts a trailing slash", () => {
    expect(dserverUri("s3://bucket/", "h")).toBe("dserver://h/s3/bucket");
  });

  it("rejects URIs that dserver URIs cannot express", () => {
    expect(dserverUri("file:///home/user/dataset", "h")).toBeNull();
    expect(dserverUri("s3://bucket/prefix/uuid", "h")).toBeNull();
  });
});

describe("loginCommand", () => {
  it("uses the address of the web interface", () => {
    expect(webAddress("https://dtool.example.org", "/")).toBe(
      "https://dtool.example.org",
    );
    expect(webAddress("https://example.org", "/dtool/")).toBe(
      "https://example.org/dtool",
    );
    expect(loginCommand("http://127.0.0.1:8080")).toBe(
      "dtool dserver login http://127.0.0.1:8080",
    );
  });
});
