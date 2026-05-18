import { useEffect, useState } from 'react';

export function useTypewriter(text, speed = 1, paused = false) {
  const [chars, setChars] = useState(0);
  useEffect(() => {
    setChars(0);
    if (!text) return undefined;
    let cancelled = false;
    let timer = null;
    let index = 0;
    const tick = () => {
      if (cancelled) return;
      if (paused) {
        timer = setTimeout(tick, 200);
        return;
      }
      index += 1;
      setChars(index);
      if (index < text.length) {
        const char = text[index - 1];
        const isPunct = /[，。！？；：、,.!?]/.test(char);
        const isSpace = /[\s\n]/.test(char);
        const base = isPunct ? 160 + Math.random() * 70 : isSpace ? 18 : 18 + Math.random() * 26;
        timer = setTimeout(tick, base / speed);
      }
    };
    timer = setTimeout(tick, 180);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [text, speed, paused]);
  return {
    revealed: text ? text.slice(0, chars) : '',
    done: !text || chars >= text.length,
  };
}
