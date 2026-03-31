import { Link } from 'react-router-dom'

import { SiteLayout, usePageMeta } from '../components/Layout'

export function NotFoundPage() {
  usePageMeta('RunTrack | Pagina nao encontrada', 'A pagina procurada nao existe no RunTrack.')

  return (
    <SiteLayout>
      <section className="not-found">
        <div className="container not-found__content">
          <span className="section-eyebrow">404</span>
          <h1>Pagina nao encontrada</h1>
          <p>Volte para o inicio e continue explorando o produto.</p>
          <Link className="button button--primary" to="/">
            Ir para a home
          </Link>
        </div>
      </section>
    </SiteLayout>
  )
}
