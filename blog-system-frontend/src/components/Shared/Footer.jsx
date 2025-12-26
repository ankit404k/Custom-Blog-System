import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Custom Blog System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
