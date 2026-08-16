import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const RelationshipRequest = z.object({ username: z.string().nullable() });
const LobbyInformation = z
  .object({
    playerUsernames: z.array(z.string()).nullable(),
    gameId: z.string().uuid().nullable(),
    isPrivate: z.boolean(),
  })
  .partial();
const ChessPieceEnum = z.enum([
  "Pawn",
  "Knight",
  "Bishop",
  "Rook",
  "Queen",
  "King",
]);
const PieceColor = z.enum(["White", "Black"]);
const ChessPiece = z
  .object({
    type: ChessPieceEnum,
    playerId: z.string().nullable(),
    color: PieceColor,
    imageUrl: z.string().nullable(),
  })
  .partial();
const ChessGameState = z.object({
  board: z.array(z.array(ChessPiece.nullable())).nullable(),
  yourTurn: z.boolean(),
  yourColor: PieceColor,
});
const ChessPosition = z
  .object({ x: z.number().int(), y: z.number().int() })
  .partial();
const ChessMove = z
  .object({ from: ChessPosition, to: ChessPosition })
  .partial();
const RegisterRequest = z.object({
  username: z.string().nullable(),
  email: z.string().nullable(),
  password: z.string().nullable(),
});
const LoginRequest = z.object({
  username: z.string().nullable(),
  password: z.string().nullable(),
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
const ForgotPasswordRequest = z.object({ username: z.string().nullable() });
const ResetPasswordRequest = z.object({
  email: z.string().nullable(),
  resetCode: z.string().nullable(),
  newPassword: z.string().nullable(),
});
const InfoResponse = z
  .object({
    username: z.string().nullable(),
    email: z.string().nullable(),
    isEmailConfirmed: z.boolean(),
  })
  .partial();
const InfoRequest = z
  .object({
    newEmail: z.string().nullable(),
    newPassword: z.string().nullable(),
    oldPassword: z.string().nullable(),
  })
  .partial();
const NotificationType = z.union([z.literal(0), z.literal(1)]);
const Notification = z.object({
  id: z.string().nullable(),
  userId: z.string().nullish(),
  notificationType: NotificationType.optional(),
  title: z.string().nullish(),
  content: z.string().nullish(),
  callbackId: z.string().nullish(),
});
const FriendResponse = z
  .object({ username: z.string().nullable(), id: z.string().nullable() })
  .partial();
const ChezzUser = z
  .object({
    id: z.string().nullable(),
    userName: z.string().nullable(),
    normalizedUserName: z.string().nullable(),
    email: z.string().nullable(),
    normalizedEmail: z.string().nullable(),
    emailConfirmed: z.boolean(),
    passwordHash: z.string().nullable(),
    securityStamp: z.string().nullable(),
    concurrencyStamp: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    phoneNumberConfirmed: z.boolean(),
    twoFactorEnabled: z.boolean(),
    lockoutEnd: z.string().datetime({ offset: true }).nullable(),
    lockoutEnabled: z.boolean(),
    accessFailedCount: z.number().int(),
  })
  .partial();
const FriendRequest = z.object({
  id: z.string().nullable(),
  userFromId: z.string().nullish(),
  userFrom: ChezzUser.optional(),
  userToId: z.string().nullish(),
  userTo: ChezzUser.optional(),
});
const FriendAcceptRequest = z
  .object({ requestId: z.string().nullable() })
  .partial();
const FriendDeclineRequest = z
  .object({ requestId: z.string().nullable() })
  .partial();

export const schemas = {
  RelationshipRequest,
  LobbyInformation,
  ChessPieceEnum,
  PieceColor,
  ChessPiece,
  ChessGameState,
  ChessPosition,
  ChessMove,
  RegisterRequest,
  LoginRequest,
  AccessTokenResponse,
  RefreshRequest,
  ResendConfirmationEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  InfoResponse,
  InfoRequest,
  NotificationType,
  Notification,
  FriendResponse,
  ChezzUser,
  FriendRequest,
  FriendAcceptRequest,
  FriendDeclineRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/games/chess/game/:gameId/move",
    alias: "Chess_MakeMove",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ChessMove,
      },
      {
        name: "gameId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.boolean(),
  },
  {
    method: "get",
    path: "/api/games/chess/game/:gameId/moves",
    alias: "Chess_GetMoves",
    requestFormat: "json",
    parameters: [
      {
        name: "gameId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.array(ChessMove),
  },
  {
    method: "get",
    path: "/api/games/chess/game/:gameId/status",
    alias: "Chess_GetGameStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "gameId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ChessGameState,
  },
  {
    method: "post",
    path: "/api/games/chess/lobby/:lobbyId/privacy",
    alias: "Chess_ChangeLobbyPrivacy",
    requestFormat: "json",
    parameters: [
      {
        name: "lobbyId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "isPrivate",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/games/chess/lobby/:lobbyId/privacy",
    alias: "Chess_GetLobbyPrivacy",
    requestFormat: "json",
    parameters: [
      {
        name: "lobbyId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.boolean(),
  },
  {
    method: "get",
    path: "/api/games/chess/lobby/:lobbyId/status",
    alias: "Chess_GetLobbyStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "lobbyId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: LobbyInformation,
  },
  {
    method: "post",
    path: "/api/games/chess/lobby/create",
    alias: "Chess_CreateLobby",
    requestFormat: "json",
    parameters: [
      {
        name: "isPrivate",
        type: "Query",
        schema: z.boolean().optional().default(true),
      },
    ],
    response: z.string().uuid(),
  },
  {
    method: "post",
    path: "/api/games/chess/lobby/matchmake",
    alias: "Chess_Matchmake",
    requestFormat: "json",
    response: z.string().uuid(),
  },
  {
    method: "post",
    path: "/api/games/chess/lobby/send-request",
    alias: "Chess_SendRequest",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ username: z.string().nullable() }),
      },
    ],
    response: z.string().uuid(),
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/api/identity/confirmEmail",
    alias: "Identity_ConfirmEmail",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "code",
        type: "Query",
        schema: z.string().optional(),
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
    alias: "Identity_ForgotPassword",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ username: z.string().nullable() }),
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
    alias: "Identity_Login",
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
    path: "/api/identity/logout",
    alias: "Identity_Logout",
    requestFormat: "json",
    response: AccessTokenResponse,
  },
  {
    method: "get",
    path: "/api/identity/manage/info",
    alias: "Identity_GetInfo",
    requestFormat: "json",
    response: InfoResponse,
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
    path: "/api/identity/manage/info",
    alias: "Identity_PostInfo",
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
        schema: z.record(z.array(z.string())),
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
    alias: "Identity_Refresh",
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
    alias: "Identity_Register",
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
        schema: z.record(z.array(z.string())),
      },
    ],
  },
  {
    method: "post",
    path: "/api/identity/resendConfirmationEmail",
    alias: "Identity_ResendConfirmationEmail",
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
    alias: "Identity_ResetPassword",
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
        schema: z.record(z.array(z.string())),
      },
    ],
  },
  {
    method: "get",
    path: "/api/notificationList",
    alias: "Notification_GetNotifications",
    requestFormat: "json",
    response: Notification,
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/relationship/accept-friend-request",
    alias: "UserRelationship_AcceptFriendRequest",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ requestId: z.string().nullable() }).partial(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/relationship/add-friend",
    alias: "UserRelationship_AddFriendRequest",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ username: z.string().nullable() }),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `Conflict`,
        schema: z.string(),
      },
    ],
  },
  {
    method: "post",
    path: "/api/relationship/decline-friend-request",
    alias: "UserRelationship_DeclineFriendRequest",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ requestId: z.string().nullable() }).partial(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/relationship/get-friend-requests",
    alias: "UserRelationship_GetFriendRequests",
    requestFormat: "json",
    response: z.array(FriendRequest),
  },
  {
    method: "get",
    path: "/api/relationship/get-friends",
    alias: "UserRelationship_GetFriends",
    requestFormat: "json",
    response: z.array(FriendResponse),
  },
  {
    method: "delete",
    path: "/api/relationship/remove-friend",
    alias: "UserRelationship_RemoveFriend",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ username: z.string().nullable() }),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: z.record(z.string()),
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
