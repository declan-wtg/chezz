using Chezz.Database.Models;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;

namespace Chezz.Controllers
{
    [Route("/api/identity")]
    public class IdentityController(
        UserManager<ChezzUser> userManager,
        TimeProvider timeProvider,
        IOptionsMonitor<BearerTokenOptions> bearerTokenOptions,
        IEmailSender emailSender,
        LinkGenerator linkGenerator) : ControllerBase
    {
        private readonly EmailAddressAttribute _emailAddressAttribute = new();

        [HttpPost("register", Name = "Register")]
        public async Task<Results<Ok, BadRequest<Dictionary<string, string[]>>>> Register(
            [FromBody] RequestSchemas.Identity.RegisterRequest registration,
            [FromServices] IServiceProvider sp)
        {
            var userManager = sp.GetRequiredService<UserManager<ChezzUser>>();

            if (!userManager.SupportsUserEmail)
            {
                throw new NotSupportedException($"{nameof(IdentityController)} requires a user store with email support.");
            }

            var userStore = sp.GetRequiredService<IUserStore<ChezzUser>>();
            var emailStore = (IUserEmailStore<ChezzUser>)userStore;
            var email = registration.Email;
            var username = registration.Username;

            if (string.IsNullOrEmpty(email) || !_emailAddressAttribute.IsValid(email))
            {
                return CreateValidationProblem(IdentityResult.Failed(userManager.ErrorDescriber.InvalidEmail(email)));
            }

            if (await emailStore.FindByEmailAsync(email.ToUpper(), CancellationToken.None) is not null)
            {
                return CreateValidationProblem(IdentityResult.Failed(userManager.ErrorDescriber.DuplicateEmail(email)));
            }

            if (string.IsNullOrEmpty(username) || !IsValidUsername(username))
            {
                return CreateValidationProblem(IdentityResult.Failed(userManager.ErrorDescriber.InvalidUserName(username)));
            }

            if (await userStore.FindByNameAsync(username, CancellationToken.None) is not null)
            {
                return CreateValidationProblem(IdentityResult.Failed(userManager.ErrorDescriber.DuplicateUserName(username)));
            }

            var user = new ChezzUser();
            await userStore.SetUserNameAsync(user, username, CancellationToken.None);
            await emailStore.SetEmailAsync(user, email, CancellationToken.None);
            var result = await userManager.CreateAsync(user, registration.Password);

            if (!result.Succeeded)
            {
                return CreateValidationProblem(result);
            }

            await SendConfirmationEmailAsync(user, userManager, email);
            return TypedResults.Ok();
        }

        [HttpPost("login", Name = "Login")]
        public async Task<Results<Ok<AccessTokenResponse>, EmptyHttpResult, ProblemHttpResult>> Login(
            [FromBody] RequestSchemas.Identity.LoginRequest login,
            [FromQuery] bool? useCookies,
            [FromQuery] bool? useSessionCookies,
            [FromServices] IServiceProvider sp)
        {
            var signInManager = sp.GetRequiredService<SignInManager<ChezzUser>>();

            var useCookieScheme = (useCookies == true) || (useSessionCookies == true);
            var isPersistent = (useCookies == true) && (useSessionCookies != true);
            signInManager.AuthenticationScheme = useCookieScheme ? IdentityConstants.ApplicationScheme : IdentityConstants.BearerScheme;

            var user = await userManager.FindByNameAsync(login.Username) ?? await userManager.FindByEmailAsync(login.Username);
            if (user is null)
            {
                return TypedResults.Problem($"User by username or email {login.Username} does not exist", statusCode: StatusCodes.Status401Unauthorized);
            }

            var result = await signInManager.PasswordSignInAsync(user, login.Password, isPersistent, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                return TypedResults.Problem(result.ToString(), statusCode: StatusCodes.Status401Unauthorized);
            }

            // The signInManager already produced the needed response in the form of a cookie or bearer token.
            return TypedResults.Empty;
        }

        [HttpPost("logout", Name = "Logout")]
        public async Task<Results<Ok<AccessTokenResponse>, EmptyHttpResult, ProblemHttpResult>> Logout([FromServices] IServiceProvider sp)
        {
            var user = await userManager.GetUserAsync(HttpContext.User);
            var signInManager = sp.GetService<SignInManager<ChezzUser>>();
            await signInManager!.SignOutAsync();

            return TypedResults.Empty;
        }

        [HttpPost("refresh", Name = "Refresh")]
        public async Task<Results<Ok<AccessTokenResponse>, UnauthorizedHttpResult, SignInHttpResult, ChallengeHttpResult>> Refresh(
            [FromBody] RefreshRequest refreshRequest,
            [FromServices] IServiceProvider sp)
        {
            var signInManager = sp.GetRequiredService<SignInManager<ChezzUser>>();
            var refreshTokenProtector = bearerTokenOptions.Get(IdentityConstants.BearerScheme).RefreshTokenProtector;
            var refreshTicket = refreshTokenProtector.Unprotect(refreshRequest.RefreshToken);

            // Reject the /refresh attempt with a 401 if the token expired or the security stamp validation fails
            if (refreshTicket?.Properties?.ExpiresUtc is not { } expiresUtc ||
                timeProvider.GetUtcNow() >= expiresUtc ||
                await signInManager.ValidateSecurityStampAsync(refreshTicket.Principal) is not ChezzUser user)

            {
                return TypedResults.Challenge();
            }

            var newPrincipal = await signInManager.CreateUserPrincipalAsync(user);
            return TypedResults.SignIn(newPrincipal, authenticationScheme: IdentityConstants.BearerScheme);
        }

        [HttpGet("confirmEmail", Name = "ConfirmEmail")]
        public async Task<Results<ContentHttpResult, UnauthorizedHttpResult>> ConfirmEmail(
            [FromQuery] string userId,
            [FromQuery] string code,
            [FromQuery] string? changedEmail,
            [FromServices] IServiceProvider sp)
        {
            var userManager = sp.GetRequiredService<UserManager<ChezzUser>>();
            if (await userManager.FindByIdAsync(userId) is not { } user)
            {
                // We could respond with a 404 instead of a 401 like Identity UI, but that feels like unnecessary information.
                return TypedResults.Unauthorized();
            }

            try
            {
                code = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));
            }
            catch (FormatException)
            {
                return TypedResults.Unauthorized();
            }

            IdentityResult result;

            if (string.IsNullOrEmpty(changedEmail))
            {
                result = await userManager.ConfirmEmailAsync(user, code);
            }
            else
            {
                result = await userManager.ChangeEmailAsync(user, changedEmail, code);
            }

            if (!result.Succeeded)
            {
                return TypedResults.Unauthorized();
            }

            return TypedResults.Text("Thank you for confirming your email.");
        }

        [HttpPost("resendConfirmationEmail", Name = "ResendConfirmationEmail")]
        public async Task<Ok> ResendConfirmationEmail(
            [FromBody] ResendConfirmationEmailRequest resendRequest,
            [FromServices] IServiceProvider sp)
        {
            var userManager = sp.GetRequiredService<UserManager<ChezzUser>>();
            if (await userManager.FindByEmailAsync(resendRequest.Email) is not { } user)
            {
                return TypedResults.Ok();
            }

            await SendConfirmationEmailAsync(user, userManager, resendRequest.Email);
            return TypedResults.Ok();
        }

        [HttpPost("forgotPassword", Name = "ForgotPassword")]
        public async Task<Results<Ok, ValidationProblem>> ForgotPassword(
            [FromBody] Chezz.RequestSchemas.Identity.ForgotPasswordRequest resetRequest,
            [FromServices] IServiceProvider sp)
        {
            var userManager = sp.GetRequiredService<UserManager<ChezzUser>>();
            var user = await userManager.FindByNameAsync(resetRequest.Username);

            if (user is not null && await userManager.IsEmailConfirmedAsync(user))
            {
                var code = await userManager.GeneratePasswordResetTokenAsync(user);
                code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

                await emailSender.SendEmailAsync(user.Email!, "Reset your password", $"Please reset your password by <a href='http://localhost:3000/reset-password/{HtmlEncoder.Default.Encode(code)}'>clicking here</a>. If you didn't request a password reset, you can ignore this email.");
            }

            // Don't reveal that the user does not exist or is not confirmed, so don't return a 200 if we would have
            // returned a 400 for an invalid code given a valid user email.
            return TypedResults.Ok();
        }

        [HttpPost("resetPassword", Name = "ResetPassword")]
        public async Task<Results<Ok, BadRequest<Dictionary<string, string[]>>>> ResetPassword(
            [FromBody] ResetPasswordRequest resetRequest,
            [FromServices] IServiceProvider sp)
        {
            var userManager = sp.GetRequiredService<UserManager<ChezzUser>>();

            var user = await userManager.FindByEmailAsync(resetRequest.Email);

            if (user is null || !(await userManager.IsEmailConfirmedAsync(user)))
            {
                // Don't reveal that the user does not exist or is not confirmed, so don't return a 200 if we would have
                // returned a 400 for an invalid code given a valid user email.
                return CreateValidationProblem(IdentityResult.Failed(userManager.ErrorDescriber.InvalidToken()));
            }

            IdentityResult result;
            try
            {
                var code = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(resetRequest.ResetCode));
                result = await userManager.ResetPasswordAsync(user, code, resetRequest.NewPassword);
            }
            catch (FormatException)
            {
                result = IdentityResult.Failed(userManager.ErrorDescriber.InvalidToken());
            }

            if (!result.Succeeded)
            {
                return CreateValidationProblem(result);
            }

            return TypedResults.Ok();
        }

        [HttpGet("manage/info")]
        public async Task<Results<Ok<Chezz.Identity.InfoResponse>, ValidationProblem, UnauthorizedHttpResult>> GetInfo(
            [FromServices] IServiceProvider sp)
        {
            var claimsPrincipal = HttpContext.User;
            var userManager = sp.GetRequiredService<UserManager<ChezzUser>>();
            if (await userManager.GetUserAsync(claimsPrincipal) is not { } user)
            {
                return TypedResults.Unauthorized();
            }

            return TypedResults.Ok(await CreateInfoResponseAsync(user, userManager));
        }

        [HttpPost("manage/info")]
        public async Task<Results<Ok<Chezz.Identity.InfoResponse>, BadRequest<Dictionary<string, string[]>>, NotFound>> PostInfo(
            [FromBody] InfoRequest infoRequest,
            [FromServices] IServiceProvider sp)
        {
            var claimsPrincipal = HttpContext.User;
            var userManager = sp.GetRequiredService<UserManager<ChezzUser>>();
            if (await userManager.GetUserAsync(claimsPrincipal) is not { } user)
            {
                return TypedResults.NotFound();
            }

            if (!string.IsNullOrEmpty(infoRequest.NewEmail) && !_emailAddressAttribute.IsValid(infoRequest.NewEmail))
            {
                return CreateValidationProblem(IdentityResult.Failed(userManager.ErrorDescriber.InvalidEmail(infoRequest.NewEmail)));
            }

            if (!string.IsNullOrEmpty(infoRequest.NewPassword))
            {
                if (string.IsNullOrEmpty(infoRequest.OldPassword))
                {
                    return CreateValidationProblem("OldPasswordRequired",
                        "The old password is required to set a new password. If the old password is forgotten, use /resetPassword.");
                }

                var changePasswordResult = await userManager.ChangePasswordAsync(user, infoRequest.OldPassword, infoRequest.NewPassword);
                if (!changePasswordResult.Succeeded)
                {
                    return CreateValidationProblem(changePasswordResult);
                }
            }

            if (!string.IsNullOrEmpty(infoRequest.NewEmail))
            {
                var email = await userManager.GetEmailAsync(user);

                if (email != infoRequest.NewEmail)
                {
                    await SendConfirmationEmailAsync(user, userManager, infoRequest.NewEmail, isChange: true);
                }
            }

            return TypedResults.Ok(await CreateInfoResponseAsync(user, userManager));
        }

        async Task SendConfirmationEmailAsync(ChezzUser user, UserManager<ChezzUser> userManager, string email, bool isChange = false)
        {
            var confirmEmailEndpointName = nameof(ConfirmEmail);

            var code = isChange
                ? await userManager.GenerateChangeEmailTokenAsync(user, email)
                : await userManager.GenerateEmailConfirmationTokenAsync(user);
            code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));

            var userId = await userManager.GetUserIdAsync(user);
            var routeValues = new RouteValueDictionary()
            {
                ["userId"] = userId,
                ["code"] = code,
            };

            if (isChange)
            {
                // This is validated by the /confirmEmail endpoint on change.
                routeValues.Add("changedEmail", email);
            }

            var confirmEmailUrl = linkGenerator.GetUriByName(HttpContext, confirmEmailEndpointName, routeValues)
                ?? throw new NotSupportedException($"Could not find endpoint named '{confirmEmailEndpointName}'.");

            await emailSender.SendEmailAsync(email, "Confirm your email", $"Please confirm your account by <a href='{HtmlEncoder.Default.Encode(confirmEmailUrl)}'>clicking here</a>. If you didn't request this email confirmation, you can ignore this email.");
        }

        private static bool IsValidUsername(string username)
        {
            var usernameRegex = @"^[a-zA-Z\d\._\-@\+]{3,16}$";
            return Regex.Match(username, usernameRegex).Success;
        }

        private static BadRequest<Dictionary<string, string[]>> CreateValidationProblem(string errorCode, string errorDescription) =>
        TypedResults.BadRequest(new Dictionary<string, string[]> {
        { errorCode, [errorDescription] }
        });

        private static BadRequest<Dictionary<string, string[]>> CreateValidationProblem(IdentityResult result)
        {
            // We expect a single error code and description in the normal case.
            // This could be golfed with GroupBy and ToDictionary, but perf! :P
            Debug.Assert(!result.Succeeded);
            var errorDictionary = new Dictionary<string, string[]>(1);

            foreach (var error in result.Errors)
            {
                string[] newDescriptions;

                if (errorDictionary.TryGetValue(error.Code, out var descriptions))
                {
                    newDescriptions = new string[descriptions.Length + 1];
                    Array.Copy(descriptions, newDescriptions, descriptions.Length);
                    newDescriptions[descriptions.Length] = error.Description;
                }
                else
                {
                    newDescriptions = [error.Description];
                }

                errorDictionary[error.Code] = newDescriptions;
            }

            return TypedResults.BadRequest(errorDictionary);
        }

        private static async Task<Chezz.Identity.InfoResponse> CreateInfoResponseAsync<TUser>(TUser user, UserManager<TUser> userManager)
            where TUser : class
        {
            return new()
            {
                Username = await userManager.GetUserNameAsync(user) ?? throw new NotSupportedException("Users must have a username."),
                Email = await userManager.GetEmailAsync(user) ?? throw new NotSupportedException("Users must have an email."),
                IsEmailConfirmed = await userManager.IsEmailConfirmedAsync(user),
            };
        }
    }
}
