import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";
import { Card, CardContent } from "@/components/ui/Card";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    full_name: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const update = (field: string, value: string) =>
    setFormData((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.email) errs.email = "Email is required";
    if (!formData.username || formData.username.length < 3)
      errs.username = "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username))
      errs.username = "Username can only contain letters, numbers, underscores, hyphens";
    if (!formData.password || formData.password.length < 8)
      errs.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        username: formData.username,
        full_name: formData.full_name || undefined,
        password: formData.password,
      });
      router.push("/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Registration failed. Please try again.";
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Account | PublicBoard</title>
      </Head>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <MapPin className="mx-auto h-10 w-10 text-blue-600" />
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">
              Join thousands of citizens making their communities better
            </p>
          </div>

          <Card>
            <CardContent className="py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address *"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => update("email", e.target.value)}
                  error={errors.email}
                  autoComplete="email"
                />
                <Input
                  label="Username *"
                  placeholder="johnsmith"
                  value={formData.username}
                  onChange={(e) => update("username", e.target.value)}
                  error={errors.username}
                  autoComplete="username"
                />
                <Input
                  label="Full name (optional)"
                  placeholder="John Smith"
                  value={formData.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  autoComplete="name"
                />
                <Input
                  label="Password *"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => update("password", e.target.value)}
                  error={errors.password}
                  autoComplete="new-password"
                />
                <Input
                  label="Confirm password *"
                  type="password"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />

                {errors.form && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {errors.form}
                  </p>
                )}

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Create Account
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
