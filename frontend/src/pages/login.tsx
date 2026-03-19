import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";
import { Card, CardContent } from "@/components/ui/Card";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      router.push((router.query.next as string) ?? "/");
    } catch (err: unknown) {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In | PublicBoard</title>
      </Head>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <MapPin className="mx-auto h-10 w-10 text-blue-600" />
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Sign in to PublicBoard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and vote on civic issues in your community
            </p>
          </div>

          <Card>
            <CardContent className="py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Sign in
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Join for free
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
