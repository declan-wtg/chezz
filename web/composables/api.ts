import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const RegisterRequest = z.object({
  email: z.string().nullable(),
  password: z.string().nullable(),
});
const LoginRequest = z.object({
  email: z.string().nullable(),
  password: z.string().nullable(),
  twoFactorCode: z.string().nullish(),
  twoFactorRecoveryCode: z.string().nullish(),
});
const AccessTokenResponse = z.object({
  tokenType: z.string().nullish(),
  accessToken: z.string().nullable(),
  expiresIn: z.number().int(),
  refreshToken: z.string().nullable(),
});
const RefreshRequest = z.object({ refreshToken: z.string().nullable() });
const ResendConfirmationEmailRequest = z.object({
  email: z.string().nullable(),
});
const ForgotPasswordRequest = z.object({ email: z.string().nullable() });
const ResetPasswordRequest = z.object({
  email: z.string().nullable(),
  resetCode: z.string().nullable(),
  newPassword: z.string().nullable(),
});
const TwoFactorRequest = z
  .object({
    enable: z.boolean().nullable(),
    twoFactorCode: z.string().nullable(),
    resetSharedKey: z.boolean(),
    resetRecoveryCodes: z.boolean(),
    forgetMachine: z.boolean(),
  })
  .partial();
const TwoFactorResponse = z.object({
  sharedKey: z.string().nullable(),
  recoveryCodesLeft: z.number().int(),
  recoveryCodes: z.array(z.string()).nullish(),
  isTwoFactorEnabled: z.boolean(),
  isMachineRemembered: z.boolean(),
});
const InfoResponse = z.object({
  email: z.string().nullable(),
  isEmailConfirmed: z.boolean(),
});
const InfoRequest = z
  .object({
    newEmail: z.string().nullable(),
    newPassword: z.string().nullable(),
    oldPassword: z.string().nullable(),
  })
  .partial();

export const schemas = {
  RegisterRequest,
  LoginRequest,
  AccessTokenResponse,
  RefreshRequest,
  ResendConfirmationEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TwoFactorRequest,
  TwoFactorResponse,
  InfoResponse,
  InfoRequest,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/identity/confirmEmail",
    alias: "ConfirmEmail",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "code",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "changedEmail",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/identity/forgotPassword",
    alias: "ForgotPassword",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ email: z.string().nullable() }),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/identity/login",
    alias: "Login",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LoginRequest,
      },
      {
        name: "useCookies",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "useSessionCookies",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: AccessTokenResponse,
  },
  {
    method: "post",
    path: "/api/identity/manage/2fa",
    alias: "Manage2FA",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: TwoFactorRequest,
      },
    ],
    response: TwoFactorResponse,
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Not Found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/identity/manage/info",
    alias: "GetInfo",
    requestFormat: "json",
    response: InfoResponse,
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Not Found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/identity/manage/info",
    alias: "PostInfo",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: InfoRequest,
      },
    ],
    response: InfoResponse,
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Not Found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/identity/refresh",
    alias: "Refresh",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ refreshToken: z.string().nullable() }),
      },
    ],
    response: AccessTokenResponse,
  },
  {
    method: "post",
    path: "/api/identity/register",
    alias: "Register",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RegisterRequest,
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/identity/resendConfirmationEmail",
    alias: "ResendConfirmationEmail",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ email: z.string().nullable() }),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/identity/resetPassword",
    alias: "ResetPassword",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResetPasswordRequest,
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Bad Request`,
        schema: z.void(),
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
