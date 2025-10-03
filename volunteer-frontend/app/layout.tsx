import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>VolunteerProof - Decentralized Volunteer Records</title>
      </head>
      <body>
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">VP</span>
                </div>
                <span className="text-xl font-bold text-gray-800">VolunteerProof</span>
              </Link>
              <div className="flex space-x-1">
                <Link href="/" className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium">
                  Home
                </Link>
                <Link href="/add" className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium">
                  Submit
                </Link>
                <Link href="/my" className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium">
                  My Records
                </Link>
                <Link href="/wall" className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium">
                  Public Wall
                </Link>
                {/* Badges nav hidden */}
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-white mt-12 py-6 border-t">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
            <p>Powered by FHEVM & Zama | Sepolia Testnet</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
