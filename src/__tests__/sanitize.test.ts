/**
 * Unit tests for sanitize.ts — XSS prevention
 */
import { sanitize, stripHtml, encodeHtml, isSafeInput, truncate, sanitizeObject } from "@/lib/sanitize";

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<script>alert('xss')</script>")).toBe("alert('xss')");
    expect(stripHtml("<b>Hello</b>")).toBe("Hello");
    expect(stripHtml("<div class='x'>test</div>")).toBe("test");
  });

  it("leaves plain text unchanged", () => {
    expect(stripHtml("Hello World")).toBe("Hello World");
  });
});

describe("encodeHtml", () => {
  it("encodes dangerous characters", () => {
    expect(encodeHtml("<script>")).toBe("&lt;script&gt;");
    expect(encodeHtml('"test"')).toBe("&quot;test&quot;");
    expect(encodeHtml("a&b")).toBe("a&amp;b");
  });
});

describe("sanitize", () => {
  it("strips HTML and encodes characters", () => {
    expect(sanitize("<b>Hello</b>")).toBe("Hello");
    expect(sanitize('"><script>alert(1)</script>')).not.toContain("<script>");
  });

  it("handles normal text", () => {
    expect(sanitize("Groceries for January")).toBe("Groceries for January");
  });
});

describe("isSafeInput", () => {
  it("rejects script tags", () => {
    expect(isSafeInput("<script>alert(1)</script>")).toBe(false);
  });

  it("rejects javascript: protocol", () => {
    expect(isSafeInput("javascript:alert(1)")).toBe(false);
  });

  it("rejects event handlers", () => {
    expect(isSafeInput('onclick="alert(1)"')).toBe(false);
  });

  it("accepts normal text", () => {
    expect(isSafeInput("Salary for January")).toBe(true);
    expect(isSafeInput("Groceries")).toBe(true);
  });
});

describe("truncate", () => {
  it("leaves short strings unchanged", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("truncates long strings with ellipsis", () => {
    const result = truncate("This is a very long note that should be truncated", 20);
    expect(result.length).toBe(20);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("sanitizeObject", () => {
  it("sanitizes all string values in a flat object", () => {
    const obj = { name: "<b>Test</b>", amount: 100, note: '"; DROP TABLE--' };
    const result = sanitizeObject(obj);
    expect(result.name).toBe("Test");
    expect(result.amount).toBe(100);
    expect(result.note).not.toContain('"');
  });
});
