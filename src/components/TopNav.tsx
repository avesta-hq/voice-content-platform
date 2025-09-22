"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  const item = (href: string, label: string) => {
    const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        {label}
      </Link>
    );
  };
  return (
    <nav className="flex items-center gap-2">
      {item('/docs', 'Create Content')}
      {item('/social-reply-studio', 'Social Reply Studio')}
    </nav>
  );
}


