import { useEffect, useRef } from "react";
import * as THREE from "three";
import BIRDS from "vanta/dist/vanta.birds.min";

export default function BirdsBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const effect = BIRDS({
      el: ref.current,
      THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
      backgroundColor: 0xf2f7fc,
      backgroundAlpha: 0,          // transparent: your page background and lines show through
      color1: 0xff0000,
      color2: 0x00d1ff,
      colorMode: "varianceGradient",
      birdSize: 0.8,
      wingSpan: 20,
      speedLimit: 5,
      separation: 50,
      alignment: 30,
      cohesion: 20,
      quantity: 3,
    });
    return () => effect.destroy();   // stops the animation when the page unmounts
  }, []);

  return <div ref={ref} className="hp-birds" aria-hidden="true" />;
}