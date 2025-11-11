import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { FileCheck, Upload, ListChecks, Moon, Sun } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import Logs from './pages/Logs';
import CustomerDetails from './pages/CustomerDetails';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Router>
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          {/* Navigation */}
          <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center space-x-8">
                  <div className="flex items-center">
                    <FileCheck className="h-8 w-8 text-primary-600" />
                    <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                      KYC Platform
                    </span>
                  </div>
                  
                  <div className="hidden md:flex space-x-4">
                    <Link
                      to="/"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to="/upload"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Link>
                    <Link
                      to="/logs"
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <ListChecks className="h-4 w-4 mr-2" />
                      Logs
                    </Link>
                  </div>
                </div>

                <div className="flex items-center">
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? (
                      <Sun className="h-5 w-5 text-gray-300" />
                    ) : (
                      <Moon className="h-5 w-5 text-gray-700" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/customer/:customerId" element={<CustomerDetails />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                AWS Serverless KYC Platform - Built with Lambda, Step Functions & EventBridge
              </p>
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;
