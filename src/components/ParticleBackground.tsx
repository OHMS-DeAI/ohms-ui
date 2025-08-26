import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useCallback, useEffect, useState } from "react";

const ParticleBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container?: any) => {
    // Removed console log
  }, []);

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      className="particle-bg"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}
      options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 60,
        interactivity: {
          events: {
            onClick: { enable: false, mode: "none" },
            onHover: { enable: false, mode: "none" },
            resize: { enable: true },
          },
          modes: {},
        },
        particles: {
          color: { value: "#0B1537" },
          links: {
            color: "#F5C542",
            distance: 140,
            enable: true,
            opacity: 0.25,
            width: 0.6,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 0.5,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              width: 1920,
              height: 1080
            },
            value: 45,
          },
          opacity: {
            value: 0.15,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 0.4, max: 1.2 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground;