import { motion } from 'framer-motion';

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
};

export const AnimatedListItem = ({ children, ...props }) => (
  <motion.div
    variants={listItemVariants}
    initial="hidden"
    animate="visible"
    {...props}
  >
    {children}
  </motion.div>
);

export default AnimatedListItem;
