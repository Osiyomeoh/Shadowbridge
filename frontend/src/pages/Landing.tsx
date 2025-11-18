import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Zap, CheckCircle } from 'lucide-react';

const TypingText = ({ text, speed = 50, delay = 0, className = '' }: { text: string; speed?: number; delay?: number; className?: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText('');
    setIsTyping(false);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    const typingTimeout = setTimeout(() => {
      setIsTyping(true);
      const typingInterval = setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayedText(text.slice(0, indexRef.current + 1));
          indexRef.current += 1;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
        }
      }, speed);

      return () => clearInterval(typingInterval);
    }, delay);

    return () => {
      clearInterval(cursorInterval);
      clearTimeout(typingTimeout);
    };
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && showCursor && (
        <span className="inline-block w-0.5 h-[1em] bg-[#00ff88] ml-1 animate-pulse align-middle" style={{ boxShadow: '0 0 8px #00ff88' }}>|</span>
      )}
    </span>
  );
};

const WordReveal = ({ words, delay = 0, className = '' }: { words: string[]; delay?: number; className?: string }) => {
  const [visibleWords, setVisibleWords] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    const revealTimeout = setTimeout(() => {
      const revealInterval = setInterval(() => {
        if (indexRef.current < words.length) {
          setVisibleWords(words.slice(0, indexRef.current + 1));
          indexRef.current += 1;
        } else {
          clearInterval(revealInterval);
        }
      }, 300);

      return () => clearInterval(revealInterval);
    }, delay);

    return () => {
      clearInterval(cursorInterval);
      clearTimeout(revealTimeout);
    };
  }, [words, delay]);

  const allWordsVisible = visibleWords.length === words.length;

  return (
    <span className={className}>
      {visibleWords.map((word, i) => (
        <span key={i} className="inline-block animate-fade-in-word" style={{ animationDelay: `${i * 0.1}s` }}>
          {word}
          {i < visibleWords.length - 1 && <span className="text-gray-400 mx-3">•</span>}
        </span>
      ))}
      {!allWordsVisible && showCursor && (
        <span className="inline-block w-0.5 h-[1em] bg-[#00ff88] ml-2 animate-pulse align-middle">|</span>
      )}
    </span>
  );
};

const NetworkName = ({ name, colors }: { name: string; colors: string[] }) => {
  const gradientString = `linear-gradient(90deg, ${colors.join(', ')})`;
  return (
    <span 
      className="text-5xl md:text-7xl font-black animate-gradient"
      style={{
        background: gradientString,
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 30px rgba(0, 255, 136, 0.4))',
        textShadow: '0 0 40px rgba(0, 255, 136, 0.3)',
      }}
    >
      {name}
    </span>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = sectionRefs.current.map((ref) => {
      if (!ref) return null;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-fade-in');
              const element = entry.target as HTMLElement;
              const currentTransform = element.style.transform || '';
              element.style.opacity = '1';
              if (currentTransform.includes('translateX')) {
                element.style.transform = 'translateX(0)';
              } else if (currentTransform.includes('scale')) {
                element.style.transform = 'translateY(0) scale(1)';
              } else if (currentTransform.includes('translateY')) {
                element.style.transform = 'translateY(0)';
              } else {
                element.style.transform = 'translateY(0)';
              }
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
      );
      
      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Hyperbridge-style Animated Background Lines - Very Visible */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{ opacity: 1 }}>
          <defs>
            {/* Flowing gradient for animated lines - brighter and more visible */}
            <linearGradient id="lineGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#00d9ff" stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.6;1.2;0.6" dur="4s" begin="0.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="4s" begin="1s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <linearGradient id="lineGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#00d9ff" stopOpacity="0.8">
                <animate attributeName="stop-opacity" values="0.6;1.2;0.6" dur="4s" begin="0.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0">
                <animate attributeName="stop-opacity" values="0;1;0" dur="4s" begin="1s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            {/* Reduced mask - only hide lines directly behind main text */}
            <mask id="textMask">
              <rect width="100%" height="100%" fill="white" />
              {/* Only hide lines behind main hero title (smaller area) */}
              <rect x="0" y="0" width="100%" height="15%" fill="black" />
            </mask>
          </defs>
          
          {/* Animated Background Lines - Horizontal (More Visible) */}
          <g mask="url(#textMask)">
            <line x1="0" y1="100" x2="1920" y2="100" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" />
            <line x1="0" y1="200" x2="1920" y2="200" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '0.4s' }} />
            <line x1="0" y1="300" x2="1920" y2="300" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '0.8s' }} />
            <line x1="0" y1="400" x2="1920" y2="400" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '1.2s' }} />
            <line x1="0" y1="500" x2="1920" y2="500" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '1.6s' }} />
            <line x1="0" y1="600" x2="1920" y2="600" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '2s' }} />
            <line x1="0" y1="700" x2="1920" y2="700" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '2.4s' }} />
            <line x1="0" y1="800" x2="1920" y2="800" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '2.8s' }} />
            <line x1="0" y1="900" x2="1920" y2="900" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '3.2s' }} />
            <line x1="0" y1="1000" x2="1920" y2="1000" 
                  stroke="url(#lineGradientH)" strokeWidth="2" className="animated-line-h" style={{ animationDelay: '3.6s' }} />
          </g>
          {/* Animated Background Lines - Vertical (More Visible) */}
          <g mask="url(#textMask)">
            <line x1="200" y1="0" x2="200" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" />
            <line x1="400" y1="0" x2="400" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" style={{ animationDelay: '0.5s' }} />
            <line x1="600" y1="0" x2="600" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" style={{ animationDelay: '1s' }} />
            <line x1="800" y1="0" x2="800" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" style={{ animationDelay: '1.5s' }} />
            <line x1="1000" y1="0" x2="1000" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" style={{ animationDelay: '2s' }} />
            <line x1="1200" y1="0" x2="1200" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" style={{ animationDelay: '2.5s' }} />
            <line x1="1400" y1="0" x2="1400" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" style={{ animationDelay: '3s' }} />
            <line x1="1600" y1="0" x2="1600" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" style={{ animationDelay: '3.5s' }} />
            <line x1="1720" y1="0" x2="1720" y2="1080" 
                  stroke="url(#lineGradientV)" strokeWidth="2" className="animated-line-v" style={{ animationDelay: '4s' }} />
          </g>
        </svg>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-cyan/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-neon-green/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-neon-yellow/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header - Black & White Theme */}
      <header className="backdrop-blur-lg sticky top-0 z-50 bg-black/95 relative z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#00ff88] animate-pulse-glow" />
              <div>
                <h1 className="text-xl font-black text-white">Shadow<span className="text-[#00ff88]">Bridge</span></h1>
                <p className="text-xs text-gray-400">Private Payments. Public Trust.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app')}
              className="px-6 py-2 bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-bold rounded-lg hover:from-[#00d9ff] hover:to-[#00ff88] transition-all duration-300 shadow-lg shadow-[#00ff88]/30"
            >
              Launch App →
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Animated Text */}
      <section className="relative z-10 py-20 md:py-32" style={{ zIndex: 10 }}>
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Animated ShadowBridge Logo/Title - Typing Effect */}
            <div className="mb-8">
              <h1 className="text-7xl md:text-9xl font-black mb-4 tracking-tight">
                <span className="inline-block text-white">
                  <TypingText text="Shadow" speed={80} delay={500} className="animate-text-glow" />
                </span>
                <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] via-[#00d9ff] to-[#00ff88] animate-gradient-shift ml-2">
                  <TypingText text="Bridge" speed={80} delay={2000} className="animate-pulse-glow" />
                </span>
              </h1>
            </div>
            
            {/* Animated Tagline - Word Reveal with Cursor */}
            <div className="mb-12">
              <p className="text-2xl md:text-4xl font-bold text-white mb-4">
                <WordReveal words={['Private', 'Compliant', 'Cross-Chain']} delay={4000} className="animate-scale-pulse" />
              </p>
            </div>
            
            {/* Animated Description - Typing Effect */}
            <div className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              <TypingText 
                text="Bridge assets between " 
                speed={30} 
                delay={6000}
                className="text-gray-400"
              />
              <span className="text-white font-semibold animate-text-highlight">Midnight</span>
              <TypingText 
                text=" and " 
                speed={30} 
                delay={7500}
                className="text-gray-400"
              />
              <span className="text-white font-semibold animate-text-highlight">Ethereum</span>
              <TypingText 
                text=" with complete privacy using zero-knowledge proofs." 
                speed={30} 
                delay={8000}
                className="text-gray-400"
              />
              <br className="hidden md:block" />
              <TypingText 
                text="Stay " 
                speed={30} 
                delay={11000}
                className="text-gray-400"
              />
              <span className="text-[#00ff88] font-semibold animate-pulse-glow">compliant</span>
              <TypingText 
                text=" without exposing your financial data." 
                speed={30} 
                delay={12000}
                className="text-gray-400"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ animation: 'fadeInUp 0.8s ease-out 14s both' }}>
              <button
                onClick={() => navigate('/app')}
                className="px-10 py-4 text-lg font-bold bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black rounded-lg hover:from-[#00d9ff] hover:to-[#00ff88] transition-all duration-300 shadow-lg shadow-[#00ff88]/50 hover:shadow-[#00ff88]/80 animate-pulse-glow transform hover:scale-105"
                style={{ animation: 'fadeInUp 0.8s ease-out 14s both' }}
              >
                Launch App →
              </button>
              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-10 py-4 text-lg font-semibold border-2 border-white/30 rounded-lg hover:border-white/60 hover:bg-white/5 transition-all duration-300 text-white transform hover:scale-105"
                style={{ animation: 'fadeInUp 0.8s ease-out 14.2s both' }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Network Carousel Section - Moving Carousel */}
      <section className="relative z-10 py-24 overflow-hidden" style={{ zIndex: 10 }}>
        <div className="container mx-auto px-6">
          <p className="text-sm text-gray-500 text-center mb-16 uppercase tracking-wider animate-fade-in">Connected to all your favorite networks</p>
          
          {/* Carousel Container */}
          <div className="relative overflow-hidden py-16">
            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-black via-black/90 to-transparent z-10 pointer-events-none"></div>
            
            {/* Moving Carousel Track */}
            <div className="relative h-32 md:h-40 flex items-center">
              <div className="carousel-track flex items-center gap-16 md:gap-24 whitespace-nowrap">
                {/* First set */}
                <NetworkName name="Arbitrum" colors={['#fbbf24', '#3b82f6', '#a855f7']} />
                <NetworkName name="Base" colors={['#3b82f6', '#00d9ff', '#00ff88']} />
                <NetworkName name="Midnight" colors={['#00ff88', '#00d9ff', '#3b82f6']} />
                <NetworkName name="Ethereum" colors={['#00d9ff', '#a855f7', '#ec4899']} />
                {/* Duplicates for seamless infinite loop */}
                <NetworkName name="Arbitrum" colors={['#fbbf24', '#3b82f6', '#a855f7']} />
                <NetworkName name="Base" colors={['#3b82f6', '#00d9ff', '#00ff88']} />
                <NetworkName name="Midnight" colors={['#00ff88', '#00d9ff', '#3b82f6']} />
                <NetworkName name="Ethereum" colors={['#00d9ff', '#a855f7', '#ec4899']} />
                {/* More duplicates for smoother loop */}
                <NetworkName name="Arbitrum" colors={['#fbbf24', '#3b82f6', '#a855f7']} />
                <NetworkName name="Base" colors={['#3b82f6', '#00d9ff', '#00ff88']} />
                <NetworkName name="Midnight" colors={['#00ff88', '#00d9ff', '#3b82f6']} />
                <NetworkName name="Ethereum" colors={['#00d9ff', '#a855f7', '#ec4899']} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              {/* Left: Visual */}
              <div 
                className="relative opacity-0 transition-all duration-700"
                style={{ transform: 'translateY(30px)' }}
                ref={(el) => { sectionRefs.current[0] = el; }}
              >
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  {/* Central Chip */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-neon-green via-neon-cyan to-neon-purple rounded-lg rotate-45 animate-pulse-glow shadow-2xl animate-spin-slow">
                      <div className="absolute inset-2 bg-primary-900 rounded-lg flex items-center justify-center">
                        <Shield className="w-12 h-12 text-neon-green animate-pulse-glow" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Connected Networks */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 card p-4 w-24 animate-fade-in animate-float" style={{ animationDelay: '0.1s' }}>
                    <div className="text-xs text-center text-neon-cyan font-semibold">Midnight</div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 card p-4 w-24 animate-fade-in animate-float" style={{ animationDelay: '0.3s' }}>
                    <div className="text-xs text-center text-neon-purple font-semibold">Ethereum</div>
                  </div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 card p-4 w-24 animate-fade-in animate-float" style={{ animationDelay: '0.5s' }}>
                    <div className="text-xs text-center text-neon-green font-semibold">Sepolia</div>
                  </div>
                  
                  {/* Connection Lines with animated dots */}
                  <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
                    <defs>
                      <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0, 255, 136, 0)" />
                        <stop offset="50%" stopColor="rgba(0, 255, 136, 0.8)" />
                        <stop offset="100%" stopColor="rgba(0, 255, 136, 0)" />
                      </linearGradient>
                      <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(168, 85, 247, 0)" />
                        <stop offset="50%" stopColor="rgba(168, 85, 247, 0.8)" />
                        <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                      </linearGradient>
                      <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(0, 217, 255, 0)" />
                        <stop offset="50%" stopColor="rgba(0, 217, 255, 0.8)" />
                        <stop offset="100%" stopColor="rgba(0, 217, 255, 0)" />
                      </linearGradient>
                      {/* Animated gradient for moving dots */}
                      <linearGradient id="dotGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0, 255, 136, 0)" stopOpacity="0" />
                        <stop offset="50%" stopColor="rgba(0, 255, 136, 1)" stopOpacity="1" />
                        <stop offset="100%" stopColor="rgba(0, 255, 136, 0)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Animated lines */}
                    <line x1="50%" y1="0%" x2="50%" y2="50%" stroke="url(#lineGradient1)" strokeWidth="3" className="animate-pulse" />
                    <line x1="50%" y1="50%" x2="50%" y2="100%" stroke="url(#lineGradient2)" strokeWidth="3" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <line x1="0%" y1="50%" x2="50%" y2="50%" stroke="url(#lineGradient3)" strokeWidth="3" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    {/* Animated dots moving along lines */}
                    <circle cx="50%" cy="25%" r="4" fill="rgba(0, 255, 136, 1)" className="animate-float" style={{ animationDuration: '2s' }} />
                    <circle cx="50%" cy="75%" r="4" fill="rgba(168, 85, 247, 1)" className="animate-float" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                    <circle cx="25%" cy="50%" r="4" fill="rgba(0, 217, 255, 1)" className="animate-float" style={{ animationDuration: '2s', animationDelay: '1s' }} />
                  </svg>
                </div>
              </div>

              {/* Right: Content */}
              <div 
                className="space-y-8 opacity-0 transition-all duration-700"
                style={{ transform: 'translateX(30px)' }}
                ref={(el) => { sectionRefs.current[1] = el; }}
              >
                <div>
                  <h2 className="text-4xl font-bold mb-4 text-gradient animate-fade-in">Less Trust, More Proofs</h2>
                  <h3 className="text-2xl font-semibold mb-4 text-neon-cyan animate-fade-in" style={{ animationDelay: '0.2s' }}>Secure Interoperability</h3>
                  <p className="text-gray-300 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    By introducing a <strong className="text-neon-green">coprocessor model</strong> that combines cryptoeconomics with advanced <strong className="text-neon-purple">zero-knowledge cryptography</strong>, ShadowBridge pioneers a new architecture for <strong className="text-neon-cyan">cryptographically secure interoperability</strong>.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app')}
                  className="btn-primary px-6 py-3 animate-scale-in"
                  style={{ animationDelay: '0.6s' }}
                >
                  Learn More →
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div 
                className="space-y-8 opacity-0 transition-all duration-700"
                style={{ transform: 'translateX(-30px)' }}
                ref={(el) => { sectionRefs.current[2] = el; }}
              >
                <div>
                  <h3 className="text-2xl font-semibold mb-4 text-neon-green animate-fade-in">Permissionless Relayers</h3>
                  <p className="text-gray-300 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    ShadowBridge is a fully decentralized and permissionless protocol that allows anyone to transmit cross-chain messages and earn fees without the need for staking or whitelisting.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app')}
                  className="btn-primary px-6 py-3 animate-scale-in"
                  style={{ animationDelay: '0.4s' }}
                >
                  Learn More →
                </button>
              </div>

              {/* Right: Visual */}
              <div 
                className="relative opacity-0 transition-all duration-700"
                style={{ transform: 'translateX(30px)' }}
                ref={(el) => { sectionRefs.current[3] = el; }}
              >
                <div className="card p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-neon-yellow" />
                    <span className="font-semibold">Fast Settlement</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-neon-green" />
                    <span className="font-semibold">Verifiable Proofs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-neon-cyan" />
                    <span className="font-semibold">Private Transactions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gradient animate-fade-in">
              Take Your Protocol MultiChain in Minutes
            </h2>
            <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              The ShadowBridge protocol provides SDKs for Solidity and WASM smart contract environments that make building interoperoperable applications a breeze. Build Cross-chain Dexes, Lending, Intents, and more!
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div 
                className="card p-6 text-center opacity-0 hover:scale-105 transition-all duration-700"
                style={{ transform: 'translateY(30px) scale(0.9)' }}
                ref={(el) => { sectionRefs.current[4] = el; }}
              >
                <Lock className="w-12 h-12 text-neon-cyan mx-auto mb-4 animate-pulse-glow" />
                <h3 className="font-semibold mb-2 text-lg">Private by Design</h3>
                <p className="text-sm text-gray-400">
                  Transaction amounts remain completely private using zero-knowledge proofs
                </p>
              </div>

              <div 
                className="card p-6 text-center opacity-0 hover:scale-105 transition-all duration-700"
                style={{ transform: 'translateY(30px) scale(0.9)', transitionDelay: '0.1s' }}
                ref={(el) => { sectionRefs.current[5] = el; }}
              >
                <Shield className="w-12 h-12 text-neon-green mx-auto mb-4 animate-pulse-glow" />
                <h3 className="font-semibold mb-2 text-lg">Fully Compliant</h3>
                <p className="text-sm text-gray-400">
                  Built-in KYC and sanctions screening without exposing sensitive data
                </p>
              </div>

              <div 
                className="card p-6 text-center opacity-0 hover:scale-105 transition-all duration-700"
                style={{ transform: 'translateY(30px) scale(0.9)', transitionDelay: '0.2s' }}
                ref={(el) => { sectionRefs.current[6] = el; }}
              >
                <ArrowRight className="w-12 h-12 text-neon-yellow mx-auto mb-4 animate-pulse-glow" />
                <h3 className="font-semibold mb-2 text-lg">Low Fees</h3>
                <p className="text-sm text-gray-400">
                  1.5% fee vs 7% traditional cross-chain bridges
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient animate-fade-in">
              Ready to Bridge?
            </h2>
            <p className="text-xl text-gray-300 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Start sending private cross-chain payments in seconds
            </p>
            <button
              onClick={() => navigate('/app')}
              className="btn-primary px-12 py-4 text-xl font-semibold animate-scale-in hover:scale-110 transition-transform"
              style={{ animationDelay: '0.4s' }}
            >
              Launch App →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Shield className="w-6 h-6 text-neon-cyan" />
              <span className="font-bold text-gradient">ShadowBridge</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 ShadowBridge. All Rights Reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
