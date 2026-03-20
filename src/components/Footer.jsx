import React from 'react'
import { footerStyles } from '../assets/dummyStyles'

const navLinks = [
  { label: 'Live', href: '#' },
  { label: 'Upcoming', href: '#' },
  { label: 'About', href: '#' },
]

const socialLinks = [
  {
    label: 'Twitter',
    href: 'https://x.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={footerStyles.socialIcon} aria-hidden="true">
        <path d="M18.901 2.25h3.68l-8.04 9.188 9.458 10.312h-7.406l-5.802-6.271-5.49 6.271H1.62l8.6-9.83L1.15 2.25h7.594l5.245 5.679L18.9 2.25Zm-1.298 17.285h2.039L7.631 4.35H5.443l12.16 15.185Z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={footerStyles.socialIcon} aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12 2C6.476 2 2 6.589 2 12.25c0 4.528 2.865 8.372 6.839 9.728.5.096.682-.223.682-.495 0-.244-.01-1.046-.014-1.898-2.782.62-3.37-1.222-3.37-1.222-.454-1.194-1.11-1.512-1.11-1.512-.908-.637.07-.625.07-.625 1.005.073 1.533 1.06 1.533 1.06.892 1.574 2.34 1.119 2.91.856.09-.668.349-1.12.635-1.377-2.22-.26-4.555-1.14-4.555-5.075 0-1.122.39-2.04 1.03-2.759-.102-.26-.446-1.31.099-2.73 0 0 .84-.276 2.75 1.054A9.303 9.303 0 0 1 12 6.84c.85.004 1.707.118 2.507.348 1.909-1.33 2.748-1.054 2.748-1.054.547 1.42.202 2.47.1 2.73.64.72 1.03 1.637 1.03 2.759 0 3.945-2.338 4.812-4.564 5.067.359.318.678.942.678 1.898 0 1.369-.012 2.472-.012 2.81 0 .274.18.595.688.494C19.138 20.618 22 16.776 22 12.25 22 6.589 17.524 2 12 2Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
]

const Footer = () => {
  return (
    <footer className={footerStyles.container}>
      <div className={footerStyles.innerContainer}>
        <div className={footerStyles.content}>
          <p className={footerStyles.copyright}>@ 2026 Nethmal Digital Services</p>

          <div className={footerStyles.navContainer}>
            <nav className={footerStyles.nav} aria-label="Footer navigation">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className={footerStyles.navLink}>
                  {link.label}
                </a>
              ))}
            </nav>

            <div className={footerStyles.socialContainer}>
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={footerStyles.socialLink}
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
