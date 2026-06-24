"use client";

import { FaGithub, FaLinkedin, FaGlobe } from 'react-icons/fa';

const Footer = () => (
  <footer className="w-full gradient-card border-t border-primary/20 py-8 shadow-elegant">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 gap-3 md:gap-0">
      <div className="text-base text-muted-foreground font-medium">
        &copy; {new Date().getFullYear()} <span className="font-bold text-gradient-primary">Alumni Dashboard</span>. All rights reserved.
      </div>
    
      <div className="text-sm text-muted-foreground mt-2 md:mt-0 font-medium">
        Designed & developed by <a 
          href="https://www.sparvixainnovations.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-bold text-gradient-gold hover:text-primary transition-colors duration-200 cursor-pointer"
        >
          Sparvixa Innovations
        </a>
      </div>
    </div>
  </footer>
);

export default Footer; 