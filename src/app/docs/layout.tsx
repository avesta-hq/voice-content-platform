"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { UserService } from "@/lib/userService";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    UserService.logout();
    router.replace("/");
  };

  return (
    <>
      {children}
    </>
  );
}
