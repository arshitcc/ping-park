"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoginFormData,
  loginSchema,
  SignupFormData,
  signupSchema,
} from "../../../../lib/schemas/auth";
import Image from "next/image";
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { useAuthStore } from "../../../../lib/store/useAuthStore";
import { useDebounceValue } from "usehooks-ts";
import { EyeIcon, EyeOffIcon } from "@repo/ui/components/ui/icons";

function Page() {
  const [registering, setResistering] = useState(false);
  const [logining, setLogining] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const signupUsername = signupForm.watch("username");
  const [username] = useDebounceValue(signupUsername, 700);

  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "login";

  const { login, register, checkUsernameAvailable, isAuthenticated, user } =
    useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/chats");
    }
    if (tab !== "login" && tab !== "signup") {
      router.replace("/");
    }
  }, [tab, router]);

  const checkIsUsernameAvailable = async (username: string) => {
    try {
      setCheckingUsername(true);
      const res = await checkUsernameAvailable({
        username,
      });

      if (res.success) {
        setIsUsernameAvailable(true);
      } else {
        console.log(res);
        setIsUsernameAvailable(false);
      }
    } catch (error) {
      setIsUsernameAvailable(null);
      setRegisterError("Something went wrong. Please try again");
    } finally {
      setCheckingUsername(false);
    }
  };

  useEffect(() => {
    if (username.trim().length > 3) {
      setRegisterError(null);
      checkIsUsernameAvailable(username.trim());
    } else {
      setIsUsernameAvailable(null);
    }
  }, [username]);

  const handleSignup = async (data: SignupFormData) => {
    if (isUsernameAvailable === false) return;

    setLoginError(null);
    setLogining(false);

    setIsUsernameAvailable(null);
    setRegisterSuccess(null);
    setRegisterError(null);

    setResistering(true);
    try {
      await register(data);
      setRegisterSuccess("Registration successful");
      signupForm.reset();
    } catch (error) {
      setRegisterError("Something went wrong. Please try again later");
    } finally {
      setTimeout(() => {
        setRegisterError(null);
        setRegisterSuccess(null);
      }, 5000);
      setResistering(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsUsernameAvailable(null);
    setRegisterSuccess(null);
    setRegisterError(null);
    setResistering(false);

    setLoginError(null);
    setLogining(true);
    try {
      await login(data);
      router.push("/chats");
    } catch (error: any) {
      if (error.response.data?.statusCode === 403) {
        setLoginError(error.response.data.message);
        return;
      }
      setLoginError("Something went wrong. Please try again later");
    } finally {
      setTimeout(() => {
        setLoginError(null);
      }, 5000);
      setLogining(false);
    }
  };

  return (
    <div className="h-screen">
      <div className="max-w-xl mx-auto my-auto border border-white p-4 rounded-xl mt-25">
        <Tabs defaultValue={tab}>
          <div className="mx-auto">
            <Image
              width="100"
              height="100"
              src="https://img.icons8.com/plasticine/100/imessage.png"
              alt="imessage"
            />
            <h1 className="text-center text-3xl font-semibold">Ping Park</h1>
          </div>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="login"
              className="cursor-pointer"
              onClick={() => router.replace("/account/auth?tab=login")}
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="cursor-pointer"
              onClick={() => router.replace("/account/auth?tab=signup")}
            >
              Signup
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your credentials to login.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="flex flex-col gap-4"
                >
                  <FieldGroup>
                    {loginError && (
                      <p className="text-red-500 bg-red-50 p-2 rounded-xl">
                        {loginError}
                      </p>
                    )}

                    <Controller
                      control={loginForm.control}
                      name="user"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Username or Email</FieldLabel>
                          <Input
                            {...field}
                            className="caret-emerald-500 selection:bg-green-50 selection:text-emerald-800 border-neutral focus-visible:border-neutral focus-visible:ring-0"
                            onChange={field.onChange}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      control={loginForm.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Password</FieldLabel>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              className="caret-emerald-500 selection:bg-green-50 selection:text-emerald-800 border-neutral focus-visible:border-neutral focus-visible:ring-0"
                              onChange={field.onChange}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((s) => !s)}
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              className="absolute inset-y-0 cursor-pointer right-2 bg-none flex items-center justify-center rounded-md p-1"
                            >
                              {showPassword ? (
                                <EyeOffIcon className="size-4" />
                              ) : (
                                <EyeIcon className="size-4" />
                              )}
                            </button>
                          </div>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </form>
              </CardContent>
              <CardFooter>
                <Button
                  className="cursor-pointer bg-emerald-500 hover:bg-emerald-600"
                  type="submit"
                  onClick={loginForm.handleSubmit(handleLogin)}
                  disabled={logining}
                >
                  {logining ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4 text-green-400" /> Signing
                      In...
                    </span>
                  ) : (
                    "Login"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="signup" className="mt-2">
            <Card>
              <CardHeader>
                <CardTitle>Register</CardTitle>
                <CardDescription>
                  Enter your credentials to register.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={signupForm.handleSubmit(handleSignup)}
                  className="flex flex-col gap-4"
                >
                  {registerError && (
                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded-xl">
                      {registerError}
                    </p>
                  )}
                  {registerSuccess && (
                    <p className="text-sm text-green-500 bg-green-50 p-2 rounded-xl">
                      {registerSuccess}
                    </p>
                  )}
                  <Controller
                    name="username"
                    control={signupForm.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Username </FieldLabel>
                        <Input
                          {...field}
                          className="caret-emerald-500 selection:bg-green-50 selection:text-emerald-800 border-neutral focus-visible:border-neutral focus-visible:ring-0"
                          onChange={field.onChange}
                        />
                        {checkingUsername && (
                          <div className="flex items-center gap-2">
                            <Spinner className="size-4 text-emerald-500" />
                            <span className="text-sm text-muted-foreground">
                              Checking username ....
                            </span>
                          </div>
                        )}

                        {!checkingUsername && isUsernameAvailable === true && (
                          <span className="text-sm text-green-500 font-mono">{`username is available`}</span>
                        )}

                        {!checkingUsername && isUsernameAvailable === false && (
                          <span className="text-sm text-red-500 font-mono">{`This username is already taken`}</span>
                        )}

                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="email"
                    control={signupForm.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel> Email </FieldLabel>
                        <Input
                          {...field}
                          className="caret-emerald-500 selection:bg-green-50 selection:text-emerald-800 border-neutral focus-visible:border-neutral focus-visible:ring-0"
                          onChange={field.onChange}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="password"
                    control={signupForm.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel> Password </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            className="caret-emerald-500 selection:bg-green-50 selection:text-emerald-800 border-neutral focus-visible:border-neutral focus-visible:ring-0"
                            onChange={field.onChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            className="absolute inset-y-0 cursor-pointer right-2 bg-none flex items-center justify-center rounded-md p-1"
                          >
                            {showPassword ? (
                              <EyeOffIcon className="size-4" />
                            ) : (
                              <EyeIcon className="size-4" />
                            )}
                          </button>
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </form>
              </CardContent>
              <CardFooter>
                <Button
                  className="cursor-pointer bg-emerald-500 hover:bg-emerald-600"
                  disabled={registering}
                  onClick={signupForm.handleSubmit(handleSignup)}
                >
                  {registering ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4 text-green-400" />{" "}
                      Registering...
                    </span>
                  ) : (
                    "Register"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Page;
