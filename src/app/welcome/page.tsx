"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0e1a]">
      {/* Full-bleed hero image */}
      <Image
        src="/zaloclaw-design.png"
        alt="ZaloClaw"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Content anchored to bottom */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 px-6 pb-16 text-center animate-hero-enter">
        <h1 className="font-heading text-4xl font-semibold text-white sm:text-5xl">
          ZClaw - Your AI Data Clawing Companion
        </h1>
        <p className="text-white/70 text-sm tracking-widest uppercase">
          Intelligent Data Clawing · Effortless Connection
        </p>
        <Button
          size="lg"
          className="min-w-48 text-base font-semibold shadow-lg shadow-primary/30"
          onClick={() => router.push("/check")}
        >
          Begin Setup →
        </Button>
      </div>
    </div>
  );
}
