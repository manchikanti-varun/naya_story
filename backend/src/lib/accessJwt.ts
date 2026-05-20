import jwt, { type SignOptions } from "jsonwebtoken";

export type AccessJwtPayload = { sub: string; typ?: string };

const DEFAULT_ACCESS_TTL = "15m";

export function signAccessToken(
  userId: string,
  secret: string,
  expiresIn: string = process.env.ACCESS_TOKEN_TTL ?? DEFAULT_ACCESS_TTL,
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId, typ: "access" }, secret, options);
}

/** Verifies access JWT; allows legacy tokens without `typ` until they expire. */
export function verifyAccessToken(token: string, secret: string): AccessJwtPayload {
  const payload = jwt.verify(token, secret) as AccessJwtPayload;
  if (payload.typ && payload.typ !== "access") {
    throw new Error("Invalid token type");
  }
  return payload;
}
