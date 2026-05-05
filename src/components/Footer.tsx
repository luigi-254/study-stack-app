import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="mt-20">
    {/* Wavy transition into black footer */}
    <div className="relative -mb-px">
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="block w-full h-16 md:h-24"
        aria-hidden="true"
      >
        <path
          d="M0,64 C240,128 480,0 720,48 C960,96 1200,32 1440,80 L1440,120 L0,120 Z"
          fill="#000000"
        />
      </svg>
    </div>
    <div className="bg-black text-white">
      <div className="container py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <Link to="/" className="font-display font-extrabold text-3xl tracking-tight">
            NoteHub
          </Link>
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold">
            <Link to="/" className="text-white/80 hover:text-white transition-colors">About</Link>
            <Link to="/" className="text-white/80 hover:text-white transition-colors">Help</Link>
            <Link to="/" className="text-white/80 hover:text-white transition-colors">Privacy</Link>
            <Link to="/" className="text-white/80 hover:text-white transition-colors">Terms</Link>
          </nav>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-xs text-white/50">© 2026 NoteHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
