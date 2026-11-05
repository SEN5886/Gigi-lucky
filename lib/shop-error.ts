export class ShopError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ShopError";
    this.status = status;
    this.code = code;
  }
}
