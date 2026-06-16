import React from 'react';
import { motion } from 'framer-motion';

const currentYear = new Date().getFullYear();
const version = '2.5.0';

function Footer() {
  return (
    <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-700 py-3 px-6 text-center">
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-gray-500 dark:text-gray-400"
      >
        &copy; {currentYear} 
        {' '}
        <a 
          href="mailto:juniorbaketegmartin@gmail.com" 
          className="text-mutas-600 dark:text-mutas-400 hover:underline transition-colors"
        >
          Junior Martin
        </a>
        {' '}- Tous droits réservés
      </motion.p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Version {version}</p>
    </footer>
  );
}

export default Footer;