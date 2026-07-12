import jwt from "jsonwebtoken";

const token = jwt.sign(
  { id: usuario.id },
  process.env.JWT_SECRET as string,
  { expiresIn: "7d" }
);