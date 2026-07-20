"use client";

import Image from "next/image";
import Link from "next/link";

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <Image
        src="/assets/logo.png"
        alt="Logo"
        width={45}
        height={45}
        className="rounded-md"
      />
    </Link>
  );
};
