export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-3">About</h3>
            <p className="text-sm leading-relaxed">
              AI Agent Skills Directory is a comprehensive platform for discovering,
              sharing, and managing enterprise-grade AI agents.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/agents" className="hover:text-white transition-colors">
                  Directory
                </a>
              </li>
              <li>
                <a href="/upload" className="hover:text-white transition-colors">
                  Upload Agent
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <p className="text-sm">
              Learn more about AI agents and enterprise automation.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex items-center justify-between text-sm">
            <p>
              &copy; {currentYear} AI Agent Skills Directory. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
