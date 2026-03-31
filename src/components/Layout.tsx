import { useEffect, useState, type ReactNode } from 'react'
import { Cloud, Mail, Menu, Phone, ShieldCheck, X, Zap } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { useAthleteAuth } from './AthleteAuth'

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title

    const meta =
      document.querySelector('meta[name="description"]') ??
      document.head.appendChild(document.createElement('meta'))

    meta.setAttribute('name', 'description')
    meta.setAttribute('content', description)
  }, [description, title])
}

export function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname, location.search])

  return null
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <Header />
      <main className="site-main">{children}</main>
      <Footer />
    </div>
  )
}

export function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="operator-shell">
      <header className="operator-header">
        <div className="container operator-header__inner">
          <Link className="operator-brand" to="/organizer">
            <span className="brand-mark operator-brand__mark">
              <Zap size={18} strokeWidth={2.4} />
            </span>
            <span className="operator-brand__copy">
              <strong>RunTrack Ops</strong>
              <span>Backoffice e controle operacional</span>
            </span>
          </Link>

          <div className="operator-header__meta" aria-label="Status da plataforma">
            <span className="operator-header__pill operator-header__pill--primary">
              <ShieldCheck size={14} />
              <span>Ops Suite</span>
            </span>
            <span className="operator-header__pill">
              <Cloud size={14} />
              <span>Cloud sync</span>
            </span>
          </div>

          <nav className="operator-nav" aria-label="Navegacao do operador">
            <NavLink
              className={({ isActive }) =>
                `operator-nav__link${isActive ? ' operator-nav__link--active' : ''}`
              }
              end
              to="/organizer"
            >
              Painel
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `operator-nav__link${isActive ? ' operator-nav__link--active' : ''}`
              }
              to="/organizer/login"
            >
              Acesso
            </NavLink>
            <Link className="operator-nav__link operator-nav__link--public" to="/">
              <ShieldCheck size={15} />
              <span>Area publica</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="operator-main">{children}</main>
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <div className="section-heading">
      {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { session } = useAthleteAuth()
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" onClick={closeMenu}>
          <span className="brand-mark">
            <Zap size={18} strokeWidth={2.4} />
          </span>
          <span className="brand-name">RunTrack</span>
        </Link>

        <nav className="desktop-nav" aria-label="Principal">
          <NavItem to="/">Inicio</NavItem>
          <NavItem to="/races">Corridas</NavItem>
          <NavItem to="/my-registrations">Minhas inscricoes</NavItem>
          <NavItem to="/organizer">Painel</NavItem>
          <NavItem to="/contact">Contato</NavItem>
          <Link className="button button--secondary button--small" to="/athlete/login">
            {session ? 'Conta do atleta' : 'Entrar atleta'}
          </Link>
          <Link
            className="button button--primary button--small header-cta"
            to="/contact?audience=organizer"
          >
            Publicar evento
          </Link>
        </nav>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="mobile-nav">
          <div className="container mobile-nav-inner">
            <NavItem to="/" mobile onSelect={closeMenu}>
              Inicio
            </NavItem>
            <NavItem to="/races" mobile onSelect={closeMenu}>
              Corridas
            </NavItem>
            <NavItem to="/my-registrations" mobile onSelect={closeMenu}>
              Minhas inscricoes
            </NavItem>
            <NavItem to="/organizer" mobile onSelect={closeMenu}>
              Painel
            </NavItem>
            <NavItem to="/contact" mobile onSelect={closeMenu}>
              Contato
            </NavItem>
            <Link className="button button--secondary" to="/athlete/login" onClick={closeMenu}>
              {session ? 'Conta do atleta' : 'Entrar atleta'}
            </Link>
            <Link
              className="button button--primary"
              to="/contact?audience=organizer"
              onClick={closeMenu}
            >
              Publicar evento
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function NavItem({
  children,
  mobile = false,
  onSelect,
  to,
}: {
  children: ReactNode
  mobile?: boolean
  onSelect?: () => void
  to: string
}) {
  return (
    <NavLink
      className={({ isActive }) =>
        mobile
          ? `mobile-nav-link${isActive ? ' mobile-nav-link--active' : ''}`
          : `nav-link${isActive ? ' nav-link--active' : ''}`
      }
      to={to}
      onClick={onSelect}
    >
      {children}
    </NavLink>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-block">
          <div className="brand footer-brand">
            <span className="brand-mark">
              <Zap size={18} strokeWidth={2.4} />
            </span>
            <span className="brand-name">RunTrack</span>
          </div>
          <p className="footer-copy">
            Plataforma para descoberta e operacao de corridas com backend proprio, login em
            nuvem, pagamentos prontos para gateway real, email transacional e painel de
            organizacao.
          </p>
        </div>

        <div className="footer-block">
          <span className="footer-heading">Navegacao</span>
          <div className="footer-links">
            <Link to="/">Inicio</Link>
            <Link to="/races">Corridas</Link>
            <Link to="/my-registrations">Minhas inscricoes</Link>
            <Link to="/organizer">Painel do Organizador</Link>
            <Link to="/contact">Contato</Link>
            <Link to="/privacy">Politica de Privacidade</Link>
            <Link to="/terms">Termos de Uso</Link>
          </div>
        </div>

        <div className="footer-block">
          <span className="footer-heading">Fale conosco</span>
          <div className="footer-contact-list">
            <a href="mailto:contato@runtrack.com">
              <Mail size={16} />
              <span>contato@runtrack.com</span>
            </a>
            <a href="tel:+5511999999999">
              <Phone size={16} />
              <span>(11) 99999-9999</span>
            </a>
          </div>
          <div className="footer-socials" aria-label="Redes sociais">
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              <span className="footer-social-label" aria-hidden="true">
                f
              </span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              <span className="footer-social-label" aria-hidden="true">
                x
              </span>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <span className="footer-social-label" aria-hidden="true">
                ig
              </span>
            </a>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>(c) {currentYear} RunTrack. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
