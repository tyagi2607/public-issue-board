"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { MapPin, Plus, LayoutDashboard, LogOut, User, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">PublicBoard</span>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-6 sm:flex">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Issues
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <Link href="/issues/new">
                      <Button size="sm">
                        <Plus className="h-4 w-4" />
                        Report Issue
                      </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="hidden text-sm text-gray-600 sm:block">
                        {user.username}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
                        title="Logout"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        <LogIn className="h-4 w-4" />
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm">Join</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
