import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ items }) => {
  return (
    <nav className="bg-gray-100 border-b">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-6 py-3">
          {items.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className="text-gray-700 hover:text-blue-600 transition"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
