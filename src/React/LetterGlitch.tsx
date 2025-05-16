import { useRef, useEffect, useState } from "react";

const LetterGlitch = ({
  glitchColors = ["#5e4491", "#A476FF", "#241a38"],
  glitchSpeed = 33,
  centerVignette = false,
  outerVignette = false,
  smooth = true,
}: {
  glitchColors: string[];
  glitchSpeed: number;
  centerVignette: boolean;
  outerVignette: boolean;
  smooth: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const letters = useRef<any[]>([]);
  const grid = useRef({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef(Date.now());
  const revealQueue = useRef<number[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [glitchMessage, setGlitchMessage] = useState<string>("");
  const messageStarted = useRef(false);

  const fontSize = 18;
  const charWidth = 10;
  const charHeight = 22;

  const logo = [
    "       ／＞　 フ",
    "      | 　_　_| ",
    "    ／` ミ＿xノ ",
    "   /　　　　 |",
    "  /　 ヽ　　 ﾉ",
    " │　　|　|　|",
    "／￣|　　 |　|",
    "(￣ヽ＿_ヽ_)__)",
    "＼二)         S",
  ];

  const lettersAndSymbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:',.<>?/\\~".split("");
  const getRandomChar = () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const hexToRgb = (hex: string) => {
    const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthand, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  };

  const interpolateColor = (start: any, end: any, factor: number) => {
    const r = Math.round(start.r + (end.r - start.r) * factor);
    const g = Math.round(start.g + (end.g - start.g) * factor);
    const b = Math.round(start.b + (end.b - start.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const calculateGrid = (width: number, height: number) => ({
    columns: Math.floor(width / charWidth),
    rows: Math.floor(height / charHeight),
  });

  const initializeLetters = (columns: number, rows: number) => {
    grid.current = { columns, rows };
    const midRow = Math.floor((rows - logo.length) / 2);
    const maxLogoWidth = Math.max(...logo.map((l) => l.length));
    const startCol = Math.floor((columns - maxLogoWidth) / 2);

    letters.current = Array.from({ length: columns * rows }, (_, i) => {
      const x = i % columns;
      const y = Math.floor(i / columns);
      return {
        x,
        y,
        char: getRandomChar(),
        color: getRandomColor(),
        targetColor: getRandomColor(),
        colorProgress: 1,
        fixed: false,
      };
    });

    revealQueue.current = [];
    logo.forEach((line, rowIdx) => {
      const y = midRow + rowIdx;
      for (let i = 0; i < line.length; i++) {
        const x = startCol + i;
        const index = y * columns + x;
        if (line[i] !== " ") {
          revealQueue.current.push(index);
        }
      }
    });
  };

  const drawLetters = () => {
    const ctx = context.current;
    if (!ctx) return;
    const { width, height } = canvasRef.current!.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";

    letters.current.forEach((letter) => {
      const x = letter.x * charWidth;
      const y = letter.y * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  };

  const updateLetters = () => {
    const updateCount = Math.floor(letters.current.length * 0.05);
    for (let i = 0; i < updateCount; i++) {
      const idx = Math.floor(Math.random() * letters.current.length);
      const letter = letters.current[idx];
      if (!letter || letter.fixed) continue;
      letter.char = getRandomChar();
      letter.targetColor = getRandomColor();
      letter.colorProgress = smooth ? 0 : 1;
      if (!smooth) letter.color = letter.targetColor;
    }
  };

  const animate = () => {
    const now = Date.now();
    if (now - lastGlitchTime.current >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime.current = now;
    }
    if (smooth) {
      let needsRedraw = false;
      letters.current.forEach((letter) => {
        if (letter.colorProgress < 1) {
          letter.colorProgress += 0.05;
          if (letter.colorProgress > 1) letter.colorProgress = 1;
          const start = hexToRgb(letter.color);
          const end = hexToRgb(letter.targetColor);
          if (start && end) {
            letter.color = interpolateColor(start, end, letter.colorProgress);
            needsRedraw = true;
          }
        }
      });
      if (needsRedraw) drawLetters();
    }
    animationRef.current = requestAnimationFrame(animate);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    if (context.current) context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  const handleEasterEgg = () => {
    if (messageStarted.current) return;
    messageStarted.current = true;
    const full = "cats will dominate the world";
    let i = 0;
    const interval = setInterval(() => {
      if (i <= full.length) {
        setGlitchMessage(full.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 100);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    context.current = canvas.getContext("2d");
    resizeCanvas();
    animate();
    const revealInterval = setInterval(() => {
      if (revealQueue.current.length > 0) {
        const index = revealQueue.current.shift()!;
        const letter = letters.current[index];
        if (letter) {
          const col = index % grid.current.columns;
          const row = Math.floor(index / grid.current.columns);
          const offset = Math.floor((grid.current.columns - Math.max(...logo.map(l => l.length))) / 2);
          const line = row - Math.floor((grid.current.rows - logo.length) / 2);
          const char = logo[line]?.[col - offset] || " ";
          if (char !== " ") {
            letters.current[index] = {
              x: col,
              y: row,
              char,
              color: "#ffffff",
              targetColor: "#ffffff",
              colorProgress: 1,
              fixed: true,
            };
          }
        }
      } else {
        clearInterval(revealInterval);
      }
    }, 120);

    const handleResize = () => {
      cancelAnimationFrame(animationRef.current!);
      resizeCanvas();
      animate();
    };

    canvas.addEventListener("click", () => {
      setClickCount((c) => {
        const newCount = c + 1;
        if (newCount >= 3) {
          letters.current = letters.current.map((l) => l.fixed ? { ...l, char: " " } : l);
          handleEasterEgg();
        }
        return newCount;
      });
    });

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener("resize", handleResize);
      clearInterval(revealInterval);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#101010] overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {outerVignette && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,_rgba(16,16,16,0)_60%,_rgba(16,16,16,1)_100%)]" />
      )}
      {centerVignette && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,_rgba(0,0,0,0.8)_0%,_rgba(0,0,0,0)_60%)]" />
      )}
      {glitchMessage.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-mono animate-pulse">
          {glitchMessage}
        </div>
      )}
    </div>
  );
};

export default LetterGlitch;
