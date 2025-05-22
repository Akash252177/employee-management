import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

export const AnimatedContainer = ({ children, ...props }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    {...props}
  >
    {children}
  </motion.div>
);

export default AnimatedContainer;
