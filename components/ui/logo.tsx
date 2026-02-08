import { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className, alt = "WarpSend", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/warpsend.png"
      alt={alt}
      className={cn("object-contain", className)}
      {...props}
    />
  );
}
