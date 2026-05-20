import { describe, expect, it } from "vitest";
import { HttpError } from "./httpError.js";

describe("HttpError", () => {
  it("carries HTTP status", () => {
    const e = new HttpError(422, "invalid payload", { field: "email" });
    expect(e.status).toBe(422);
    expect(e.message).toBe("invalid payload");
    expect(e.details).toEqual({ field: "email" });
  });
});
