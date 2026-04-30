export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border bg-bg-secondary text-text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-text-primary font-semibold mb-3">About</h3>
            <p className="text-sm leading-relaxed">
              AI Agent Skills Directory is a comprehensive platform for discovering,
              sharing, and managing enterprise-grade AI agents.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-text-primary font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-primary transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/agents" className="hover:text-primary transition-colors">
                  Directory
                </a>
              </li>
              <li>
                <a href="/upload" className="hover:text-primary transition-colors">
                  Upload Agent
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-text-primary font-semibold mb-3">Resources</h3>
            <p className="text-sm">
              Learn more about AI agents and enterprise automation.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between text-sm">
            <p>
              &copy; {currentYear} AI Agent Skills Directory. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
