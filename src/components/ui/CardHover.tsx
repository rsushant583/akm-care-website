import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type CardHoverProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardHover({ children, className }: CardHoverProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {children}
    </motion.div>
  );
}
