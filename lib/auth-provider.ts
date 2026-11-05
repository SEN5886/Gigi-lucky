import { createHash } from "node:crypto";
import { devAuthEnabled } from "./env.ts";

export type AuthResult = {
  ok: boolean;
  code: "AUTH_NOT_READY" | "AUTH_DEV_SESSION" | "AUTH_INVALID";
  message: string;
  user: { id: string; email: string } | null;
};

export interface AuthProvider {
  readonly name: "stub" | "dev";
  login(input: { email: string; password: string }): Promise<AuthResult>;
  register(input: { email: string; password: string }): Promise<AuthResult>;
  requestMagicLink(input: { email: string }): Promise<AuthResult>;
}

const notReady = (message: string): AuthResult => ({
  ok: false,
  code: "AUTH_NOT_READY",
  message,
  user: null,
});

function devUser(email: string): { id: string; email: string } {
  const id = `user_${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16)}`;
  return { id, email: email.toLowerCase() };
}

const stubProvider: AuthProvider = {
  name: "stub",
  async login() {
    return notReady("登录即将接入。当前不会校验真实密码。");
  },
  async register() {
    return notReady("注册即将接入。当前不会创建账号，也不会保存密码。");
  },
  async requestMagicLink() {
    return notReady("邮件登录即将接入。这个接口不会发送真实邮件。");
  },
};

const devProvider: AuthProvider = {
  name: "dev",
  async login({ email, password }) {
    if (password.length < 8) return { ok: false, code: "AUTH_INVALID", message: "请填写至少 8 位的密码。", user: null };
    return { ok: true, code: "AUTH_DEV_SESSION", message: "开发环境已建立模拟会话，没有连接真实账号系统。", user: devUser(email) };
  },
  async register({ email, password }) {
    if (password.length < 8) return { ok: false, code: "AUTH_INVALID", message: "请填写至少 8 位的密码。", user: null };
    return { ok: true, code: "AUTH_DEV_SESSION", message: "开发环境已建立模拟会话，密码没有被保存。", user: devUser(email) };
  },
  async requestMagicLink({ email }) {
    return { ok: true, code: "AUTH_DEV_SESSION", message: "开发环境已建立模拟会话，没有发送邮件。", user: devUser(email) };
  },
};

export function authProvider(): AuthProvider {
  return devAuthEnabled() ? devProvider : stubProvider;
}
