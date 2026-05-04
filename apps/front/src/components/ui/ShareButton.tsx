"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export function ShareButton() {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      <Share2 className="mr-2 h-4 w-4" />
      Share this post
    </Button>
  );
}
