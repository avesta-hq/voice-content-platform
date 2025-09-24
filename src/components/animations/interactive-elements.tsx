"use client"

import { motion, useAnimation, useInView } from "framer-motion"
import { ReactNode, useEffect, useRef } from "react"

// Hover animations
export function HoverScale({ 
  children, 
  scale = 1.05, 
  className = "" 
}: { 
  children: ReactNode
  scale?: number
  className?: string 
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Floating animation
export function FloatingElement({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Pulse animation
export function PulseElement({ 
  children, 
  className = "",
  scale = [1, 1.05, 1] 
}: { 
  children: ReactNode
  className?: string
  scale?: number[]
}) {
  return (
    <motion.div
      animate={{
        scale,
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Slide in from view
export function SlideInView({ 
  children, 
  direction = "up",
  className = "",
  delay = 0 
}: { 
  children: ReactNode
  direction?: "up" | "down" | "left" | "right"
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const controls = useAnimation()

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: 50, opacity: 0 }
      case "down":
        return { y: -50, opacity: 0 }
      case "left":
        return { x: -50, opacity: 0 }
      case "right":
        return { x: 50, opacity: 0 }
      default:
        return { y: 50, opacity: 0 }
    }
  }

  useEffect(() => {
    if (isInView) {
      controls.start({
        x: 0,
        y: 0,
        opacity: 1,
        transition: {
          duration: 0.6,
          ease: "easeOut",
          delay
        }
      })
    }
  }, [isInView, controls, delay])

  return (
    <motion.div
      ref={ref}
      initial={getInitialPosition()}
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Typewriter effect
export function TypewriterText({ 
  text, 
  className = "",
  speed = 50 
}: { 
  text: string
  className?: string
  speed?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: index * (speed / 1000)
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  )
}

// Magnetic button effect
export function MagneticButton({ 
  children, 
  className = "",
  strength = 0.3 
}: { 
  children: ReactNode
  className?: string
  strength?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`
  }

  const handleMouseLeave = () => {
    if (!ref.current) return
    ref.current.style.transform = 'translate(0px, 0px)'
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Reveal animation
export function RevealText({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
        delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Morphing shape
export function MorphingShape({ 
  className = "",
  colors = ["#ff6b35", "#f7931e", "#ffd23f"] 
}: { 
  className?: string
  colors?: string[]
}) {
  return (
    <motion.div
      animate={{
        borderRadius: ["20%", "50%", "30%", "40%", "20%"],
        background: colors,
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`w-20 h-20 ${className}`}
    />
  )
}

// Particle system (simple)
export function ParticleField({ 
  count = 20,
  className = "" 
}: { 
  count?: number
  className?: string
}) {
  const particles = Array.from({ length: count }, (_, i) => i)

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
}
