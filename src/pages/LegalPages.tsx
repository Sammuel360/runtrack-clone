import { SiteLayout, usePageMeta } from '../components/Layout'

export function PrivacyPage() {
  usePageMeta(
    'RunTrack | Politica de privacidade',
    'Regras basicas de tratamento de dados para o MVP do RunTrack.',
  )

  return (
    <LegalPage
      title="Politica de Privacidade"
      description="Esta pagina organiza as regras basicas de dados do MVP e melhora a confianca do produto."
      sections={[
        {
          title: '1. Dados coletados',
          body: [
            'O MVP coleta dados informados pelo usuario em formularios de inscricao e contato.',
            'Esses dados servem para registrar reservas, gerar confirmacoes, organizar o painel operacional e apoiar futuras evolucoes comerciais.',
          ],
        },
        {
          title: '2. Finalidade',
          body: [
            'As informacoes sao usadas para registrar inscricoes, acompanhar status de pagamento e permitir captacao de organizadores.',
            'Em uma etapa futura, esses dados poderao alimentar CRM, automacoes e integracoes de pagamento e email transacional.',
          ],
        },
        {
          title: '3. Armazenamento',
          body: [
            'No estado atual do projeto, os registros ficam persistidos em um backend local com armazenamento em arquivo.',
            'Quando a infraestrutura de producao for definida, esta politica deve ser atualizada com as regras reais de retencao, seguranca e acesso.',
          ],
        },
      ]}
    />
  )
}

export function TermsPage() {
  usePageMeta('RunTrack | Termos de uso', 'Termos basicos de uso para o MVP do RunTrack.')

  return (
    <LegalPage
      title="Termos de Uso"
      description="Os termos deixam claro o escopo atual do MVP e tornam a proposta mais profissional."
      sections={[
        {
          title: '1. Natureza do MVP',
          body: [
            'O RunTrack e um MVP voltado a descoberta de corridas, inscricao, captacao comercial e acompanhamento operacional.',
            'Algumas funcionalidades, como gateway de pagamento real e envio externo de emails, ainda dependem de integracoes futuras.',
          ],
        },
        {
          title: '2. Responsabilidade do usuario',
          body: [
            'Ao preencher formularios, o usuario declara que as informacoes fornecidas sao verdadeiras.',
            'Cada atleta continua responsavel por avaliar sua aptidao fisica e seguir orientacoes medicas e esportivas adequadas.',
          ],
        },
        {
          title: '3. Evolucao do produto',
          body: [
            'Este projeto pode sofrer ajustes de fluxo, regras e integracoes conforme o produto amadurece.',
            'A equipe pode revisar estes termos sempre que houver mudanca relevante na operacao.',
          ],
        },
      ]}
    />
  )
}

function LegalPage({
  title,
  description,
  sections,
}: {
  title: string
  description: string
  sections: Array<{ title: string; body: string[] }>
}) {
  return (
    <SiteLayout>
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="section-eyebrow">Base institucional</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="section section--compact">
        <div className="container legal-stack">
          {sections.map((section) => (
            <article className="panel legal-panel" key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  )
}
