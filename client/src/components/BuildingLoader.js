import { motion } from 'framer-motion';
import { FaCity, FaHardHat, FaTools } from 'react-icons/fa';

const BuildingLoader = () => {
  return (
    <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
      
      {/* Animated Buildings */}
      <div className="flex items-end space-x-2 mb-4">
        {/* Building 1 */}
        <motion.div
          initial={{ scaleY: 0.1, opacity: 0.3 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0 }}
          className="origin-bottom"
        >
            <FaCity className="text-gray-300 text-4xl" />
        </motion.div>

        {/* Building 2 (Taller & Center) */}
        <motion.div
          initial={{ scaleY: 0.1, opacity: 0.3 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.3 }}
          className="origin-bottom"
        >
            <FaCity className="text-indigo-400 text-6xl" />
        </motion.div>

        {/* Building 3 */}
        <motion.div
           initial={{ scaleY: 0.1, opacity: 0.3 }}
           animate={{ scaleY: 1, opacity: 1 }}
           transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", delay: 0.6 }}
           className="origin-bottom"
        >
            <FaCity className="text-gray-300 text-4xl" />
        </motion.div>
      </div>

      {/* Loading Text with Tools */}
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }} 
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex items-center gap-2 font-bold text-gray-500 text-sm uppercase tracking-widest"
      >
        <FaHardHat className="text-yellow-500 text-lg" />
        <span>Site Loading...</span>
        <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
            <FaTools className="text-gray-400"/>
        </motion.span>
      </motion.div>
    </div>
  );
};

export default BuildingLoader;