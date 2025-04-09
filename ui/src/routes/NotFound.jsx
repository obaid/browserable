import { Link } from 'react-router-dom';
import { motion } from "motion/react"
import React from 'react';

function NotFound() {
  return (
    <section className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 flex items-center justify-center min-h-screen">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-gray-600 dark:text-gray-100">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
            Something's missing.
          </p>
          <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
            Sorry, we can't find that page. You'll find lots to explore on the home page.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17
            }}
          >
            <Link
              to="/dash"
              className="leading-none w-64 bg-gray-800 hover:bg-gray-900 text-white px-2 py-2 mx-auto rounded-md flex items-center justify-center gap-2 my-4"
            >
              <span>Back to dashboard</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
