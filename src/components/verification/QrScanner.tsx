"use client";

import { Camera, CameraOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ScanFeedback = "valid" | "invalid" | null;

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
}

/** Délai avant de relire le même QR Code : évite de valider dix fois une carte tenue devant l'objectif */
const SAME_CODE_PAUSE_MS = 3500;

interface QrScannerProps {
  onDetect: (text: string) => void;
  /** Colore le cadre en vert (valide) ou en rouge (invalide) après une lecture */
  feedback: ScanFeedback;
  /** Rallume la caméra au montage : l'agent enchaîne les invités sans rappuyer sur le bouton */
  autoStart?: boolean;
  onActiveChange?: (active: boolean) => void;
}

export function QrScanner({ onDetect, feedback, autoStart = false, onActiveChange }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(autoStart);
  const [error, setError] = useState<string | null>(null);
  const onDetectRef = useRef(onDetect);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const last = { text: "", at: 0 };

    const emit = (text: string) => {
      const now = Date.now();
      if (text === last.text && now - last.at < SAME_CODE_PAUSE_MS) return;
      last.text = text;
      last.at = now;
      onDetectRef.current(text);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        video.srcObject = stream;
        await video.play();

        // BarcodeDetector (natif, rapide) quand il existe ; jsQR sinon (Safari iOS, Firefox)
        const Native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
        const detector = Native ? new Native({ formats: ["qr_code"] }) : null;
        const jsQR = detector ? null : (await import("jsqr")).default;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const tick = async () => {
          if (stopped) return;
          if (video.readyState >= 2 && video.videoWidth > 0) {
            try {
              if (detector) {
                const codes = await detector.detect(video);
                if (codes[0]?.rawValue) emit(codes[0].rawValue);
              } else if (jsQR && ctx) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(image.data, image.width, image.height);
                if (code?.data) emit(code.data);
              }
            } catch {
              // Une image illisible n'interrompt pas la lecture : on réessaie à la suivante
            }
          }
          raf = requestAnimationFrame(tick);
        };
        void tick();
      } catch {
        setError("Caméra indisponible. Autorisez l'accès à la caméra ou saisissez le code à la main.");
        setActive(false);
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  return (
    <div>
      <div
        className={cn(
          "relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border-2 bg-navy transition-all duration-300",
          feedback === "valid" && "border-success shadow-[0_0_0_6px_color-mix(in_oklab,var(--success)_30%,transparent),0_0_60px_var(--success)]",
          feedback === "invalid" && "border-destructive shadow-[0_0_0_6px_color-mix(in_oklab,var(--destructive)_30%,transparent),0_0_60px_var(--destructive)]",
          !feedback && "border-gold/40",
        )}
      >
        <video ref={videoRef} playsInline muted className={cn("size-full object-cover", !active && "hidden")} />

        {active ? (
          <>
            {/* Viseur : quatre coins + ligne de balayage */}
            <div className="pointer-events-none absolute inset-8">
              {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl"].map((corner) => (
                <span
                  key={corner}
                  className={cn("absolute size-10 transition-colors", corner, feedback === "valid" ? "border-success" : feedback === "invalid" ? "border-destructive" : "border-gold")}
                />
              ))}
              {!feedback && <span className="scan-line absolute inset-x-2 h-0.5 rounded-full bg-gold shadow-[0_0_14px_var(--gold)]" />}
            </div>
            <div
              className={cn(
                "pointer-events-none absolute inset-0 transition-opacity duration-300",
                feedback === "valid" ? "bg-success/30 opacity-100" : feedback === "invalid" ? "bg-destructive/35 opacity-100" : "opacity-0",
              )}
            />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-[#f5efe3]">
            <div>
              <CameraOff className="mx-auto size-10 text-gold-soft" />
              <p className="mt-3 text-sm text-[#f5efe3]/75">{error ?? "La caméra est éteinte."}</p>
            </div>
          </div>
        )}
      </div>

      <Button
        variant={active ? "outline" : "default"}
        size="lg"
        className="mx-auto mt-5 flex w-full max-w-sm"
        onClick={() => {
          setError(null);
          onActiveChange?.(!active);
          setActive(!active);
        }}
      >
        {active ? <CameraOff /> : <Camera />}
        {active ? "Arrêter la caméra" : "Scanner un QR Code"}
      </Button>
    </div>
  );
}
