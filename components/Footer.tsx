'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="text-white pt-12 pb-4 mt-auto"
      style={{
        background: 'linear-gradient(135deg, #273c97 0%, #210838 100%)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Grid */}
        <div className="grid gap-8 mb-8"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
        >
          {/* Brand Column */}
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
              REBH
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed text-sm">
              شريكك الذكي في عالم المال والأعمال. نقدم حلولاً مبتكرة تعتمد على الذكاء الاصطناعي لتعزيز قراراتك الاستثمارية.
            </p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 hover:bg-blue-600"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="text-[#60a5fa] text-xl font-semibold mb-4 pb-2"
              style={{ borderBottom: '2px solid #60a5fa' }}
            >
              روابط سريعة
            </h3>
            <ul className="list-none p-0 m-0">
              {[
                { href: '/about', label: 'من نحن' },
                { href: '/services', label: 'خدماتنا' },
                { href: '/blog', label: 'المدونة' },
                { href: '/contact', label: 'تواصل معنا' },
              ].map(({ href, label }) => (
                <li key={href} className="mb-3">
                  <Link
                    href={href}
                    className="group text-gray-200 no-underline flex items-center gap-2 py-1 transition-all duration-300 hover:text-[#60a5fa] hover:translate-x-[-5px]"
                    style={{ borderBottom: '1px solid transparent' }}
                  >
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3
              className="text-[#60a5fa] text-xl font-semibold mb-4 pb-2"
              style={{ borderBottom: '2px solid #60a5fa' }}
            >
              خدماتنا
            </h3>
            <ul className="list-none p-0 m-0">
              {[
                { href: '#', label: 'التحليل المالي الذكي' },
                { href: '#', label: 'استشارات الأعمال' },
                { href: '#', label: 'التسويق الرقمي' },
                { href: '#', label: 'التكنولوجيا العقارية' },
              ].map(({ href, label }) => (
                <li key={label} className="mb-3">
                  <Link
                    href={href}
                    className="text-gray-200 no-underline block py-1 transition-all duration-300 hover:text-[#60a5fa] hover:translate-x-[-5px]"
                    style={{ borderBottom: '1px solid transparent' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3
              className="text-[#60a5fa] text-xl font-semibold mb-4 pb-2"
              style={{ borderBottom: '2px solid #60a5fa' }}
            >
              معلومات التواصل
            </h3>
            <ul className="list-none p-0 m-0 space-y-4">
              <li className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                <span>القاهرة، مصر - التجمع الخامس</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span dir="ltr">+201044330557</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span>ayman@rebh.ai</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div
          className="pt-6 text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm m-0">
              © {new Date().getFullYear()} REBH. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/privacy" className="text-gray-400 no-underline hover:text-white transition-colors">
                سياسة الخصوصية
              </Link>
              <Link href="/terms" className="text-gray-400 no-underline hover:text-white transition-colors">
                الشروط والأحكام
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}