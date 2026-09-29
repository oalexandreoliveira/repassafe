export type RateLimitPolicy = {
  namespace: string;
  maxRequests: number;
  windowSeconds: number;
};

export const rateLimitPolicies = {
  loginIp: { namespace: "auth.login.ip", maxRequests: 10, windowSeconds: 900 },
  loginEmail: {
    namespace: "auth.login.email",
    maxRequests: 5,
    windowSeconds: 900,
  },
  signupIp: {
    namespace: "auth.signup.ip",
    maxRequests: 5,
    windowSeconds: 3600,
  },
  signupEmail: {
    namespace: "auth.signup.email",
    maxRequests: 3,
    windowSeconds: 86400,
  },
  confirmationIp: {
    namespace: "auth.confirmation.ip",
    maxRequests: 20,
    windowSeconds: 900,
  },
  profile: {
    namespace: "profile.update.user",
    maxRequests: 20,
    windowSeconds: 3600,
  },
  workflow: {
    namespace: "workflow.command.user",
    maxRequests: 60,
    windowSeconds: 60,
  },
  administration: {
    namespace: "administration.command.user",
    maxRequests: 30,
    windowSeconds: 60,
  },
} satisfies Record<string, RateLimitPolicy>;

export function normalizeRateLimitIdentifier(value: string) {
  return value.trim().toLocaleLowerCase("en-US").slice(0, 320);
}
