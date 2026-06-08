import jwt, { type SignOptions, type VerifyOptions } from "jsonwebtoken";

export type AccessJwtPayload = { sub: string; typ?: string };

const DEFAULT_ACCESS_TTL = "15m";
const ALLOWED_ALGORITHMS: jwt.Algorithm[] = ["HS256"];

export function signAccessToken(
  userId: string,
  secret: string,
  expiresIn: string = process.env.ACCESS_TOKEN_TTL ?? DEFAULT_ACCESS_TTL,
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    algorithm: "HS256",
  };
  return jwt.sign({ sub: userId, typ: "access" }, secret, options);
}

/** Verifies access JWT with pinned algorithm to prevent algorithm confusion attacks. */
export function verifyAccessToken(token: string, secret: string): AccessJwtPayload {
  const options: VerifyOptions = { algorithms: ALLOWED_ALGORITHMS };
  const payload = jwt.verify(token, secret, options) as AccessJwtPayload;
  if (payload.typ && payload.typ !== "access") {
    throw new Error("Invalid token type");
  }
  return payload;
}
