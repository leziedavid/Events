"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Accords joués en arpège (fréquences en Hz) : Do – Sol – La mineur – Fa
const CHORDS = [
  [261.63, 329.63, 392.0, 523.25],
  [196.0, 293.66, 392.0, 493.88],
  [220.0, 261.63, 329.63, 440.0],
  [174.61, 261.63, 349.23, 440.0],
];
const NOTE_MS = 520;

/** Mélodie douce façon boîte à musique, générée par Web Audio (aucun fichier à héberger) */
function startSynth(): () => void {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.09;
  master.connect(ctx.destination);

  // Léger écho pour donner de l'espace au son
  const echo = ctx.createDelay();
  echo.delayTime.value = 0.38;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.3;
  echo.connect(feedback).connect(echo);
  echo.connect(master);

  let step = 0;
  const play = () => {
    const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
    const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = chord[pattern[step % 8]] * 2;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    osc.connect(gain);
    gain.connect(master);
    gain.connect(echo);
    osc.start(t);
    osc.stop(t + 1.9);
    step++;
  };
  play();
  const id = setInterval(play, NOTE_MS);

  return () => {
    clearInterval(id);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => void ctx.close(), 500);
  };
}

function startFile(src: string): () => void {
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0.5;
  void audio.play();
  return () => audio.pause();
}

/**
 * Musique de fond désactivable. Elle ne démarre jamais seule : les navigateurs bloquent
 * la lecture automatique, il faut un geste de l'utilisateur.
 */
export function useAmbientMusic(src?: string) {
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const toggle = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
      setPlaying(false);
      return;
    }
    stopRef.current = src ? startFile(src) : startSynth();
    setPlaying(true);
  }, [src]);

  useEffect(() => () => stopRef.current?.(), []);

  return { playing, toggle };
}
