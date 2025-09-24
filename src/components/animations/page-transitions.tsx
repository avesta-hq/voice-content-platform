"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
}

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
}

// Slide transition variants
const slideVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  in: {
    x: 0,
    opacity: 1
  },
  out: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
}

// Fade transition variants
const fadeVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
}

// Scale transition variants
const scaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  in: {
    opacity: 1,
    scale: 1
  },
  out: {
    opacity: 0,
    scale: 1.1
  }
}

interface PageTransitionProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'slide' | 'fade' | 'scale'
  direction?: number
}

export function PageTransition({ 
  children, 
  className = "", 
  variant = 'default',
  direction = 1 
}: PageTransitionProps) {
  const getVariants = () => {
    switch (variant) {
      case 'slide':
        return slideVariants
      case 'fade':
        return fadeVariants
      case 'scale':
        return scaleVariants
      default:
        return pageVariants
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={getVariants()}
      transition={pageTransition}
      custom={direction}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Staggered children animation
const containerVariants = {
  initial: {},
  in: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  out: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
}

const itemVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  out: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
}

export function StaggeredContainer({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="in"
      exit="out"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggeredItem({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Route transition wrapper
export function RouteTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition>
        {children}
      </PageTransition>
    </AnimatePresence>
  )
}
