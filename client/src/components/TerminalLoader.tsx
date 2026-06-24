import { useEffect, useState } from 'react';

export default function TerminalLoader({ isLoading }: { isLoading: boolean }) {
  const [displayText, setDisplayText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  const terminalLines = [
    '> GTA6 FEED SYSTEM INITIALIZING...',
    '> Loading cyberpunk environment...',
    '> Connecting to network...',
    '> Decoding GTA6 data streams...',
    '> Initializing neon interface...',
    '> Building community hub...',
    '> System ready.',
  ];

  useEffect(() => {
    if (!isLoading) return;

    let currentLineIndex = 0;
    let currentCharIndex = 0;
    let fullText = '';

    const typeInterval = setInterval(() => {
      if (currentLineIndex < terminalLines.length) {
        const currentLine = terminalLines[currentLineIndex];
        
        if (currentCharIndex < currentLine.length) {
          fullText += currentLine[currentCharIndex];
          setDisplayText(fullText);
          currentCharIndex++;
        } else {
          // Move to next line
          fullText += '\n';
          setDisplayText(fullText);
          currentLineIndex++;
          currentCharIndex = 0;
        }
      } else {
        clearInterval(typeInterval);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [isLoading]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 
              'linear-gradient(0deg, transparent 24%, rgba(255, 0, 110, 0.1) 25%, rgba(255, 0, 110, 0.1) 26%, transparent 27%, transparent 74%, rgba(255, 0, 110, 0.1) 75%, rgba(255, 0, 110, 0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 245, 255, 0.1) 25%, rgba(0, 245, 255, 0.1) 26%, transparent 27%, transparent 74%, rgba(0, 245, 255, 0.1) 75%, rgba(0, 245, 255, 0.1) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px',
            animation: 'slide-grid 20s linear infinite'
          }}
        />
      </div>

      {/* Terminal window */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        {/* Terminal header */}
        <div className="neon-border-cyan mb-0 rounded-t-lg p-3 flex items-center gap-2 bg-card/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-secondary font-mono ml-2">LEONIDA_GATE_v1.0.0</span>
        </div>

        {/* Terminal content */}
        <div className="neon-border-cyan rounded-b-lg p-6 bg-background/90 backdrop-blur-sm min-h-80 flex flex-col justify-center">
          <div className="font-mono text-sm leading-relaxed">
            {displayText.split('\n').map((line, idx) => (
              <div 
                key={idx}
                className="text-secondary animate-fade-in"
              >
                {line}
              </div>
            ))}
            {isLoading && (
              <div className="text-primary">
                {cursorVisible ? '_' : ' '}
              </div>
            )}
          </div>

          {/* Loading indicator */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex gap-1">
              <div 
                className="w-2 h-2 bg-primary rounded-full"
                style={{
                  animation: 'pulse 1s ease-in-out infinite',
                  animationDelay: '0s'
                }}
              />
              <div 
                className="w-2 h-2 bg-secondary rounded-full"
                style={{
                  animation: 'pulse 1s ease-in-out infinite',
                  animationDelay: '0.2s'
                }}
              />
              <div 
                className="w-2 h-2 bg-accent rounded-full"
                style={{
                  animation: 'pulse 1s ease-in-out infinite',
                  animationDelay: '0.4s'
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">LOADING...</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-grid {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(50px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
