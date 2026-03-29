import { Zap, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="py-20 border-t dark:border-white/5 border-black/5">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 gap-12 mb-16 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tighter font-display">Belsuite</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              The all-in-one AI platform for content creators and brands. Create, automate, and scale with intelligence.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">AI Video</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Ad Engine</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Social</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 border rounded-full dark:border-white/10 border-black/10 hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="p-2 border rounded-full dark:border-white/10 border-black/10 hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="p-2 border rounded-full dark:border-white/10 border-black/10 hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="p-2 border rounded-full dark:border-white/10 border-black/10 hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-6 pt-8 border-t dark:border-white/5 border-black/5 md:flex-row">
          <p className="text-xs text-gray-500">
            © 2026 Belsuite AI Inc. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-gray-500">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
