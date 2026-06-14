"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Client-side redirect to the default view. A server `redirect()` can't run on
// a static host (GitHub Pages), so we forward after the page loads. next/router
// applies basePath automatically.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/town-map");
  }, [router]);
  return null;
}
