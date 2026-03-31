import {
  BriefcaseBusiness,
  Search,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export type ContentCard = {
  icon: LucideIcon
  title: string
  description: string
}

export const featureHighlights: ContentCard[] = [
  {
    icon: Zap,
    title: 'Descoberta rapida',
    description:
      'Pesquise corridas por nome, cidade, distancia e faixa de preco em um unico lugar.',
  },
  {
    icon: Target,
    title: 'Inscricao com pagamento',
    description:
      'Capte o atleta no mesmo fluxo, registre os dados e conclua a confirmacao com pagamento.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Painel para organizadores',
    description:
      'Acompanhe inscricoes, leads e emails operacionais sem depender do Hostinger antigo.',
  },
]

export const processSteps: ContentCard[] = [
  {
    icon: Search,
    title: '1. Encontrar a corrida certa',
    description: 'Use busca, filtros e ordenacao para chegar rapido ao evento ideal.',
  },
  {
    icon: ShieldCheck,
    title: '2. Reservar e pagar',
    description: 'Registre os dados do atleta, escolha o meio de pagamento e confirme a vaga.',
  },
  {
    icon: Users,
    title: '3. Operar e acompanhar',
    description:
      'Use o painel para acompanhar conversao, leads e disparos operacionais de email.',
  },
]

export const organizerBenefits = [
  'Receba interessados em publicar novos eventos.',
  'Acompanhe pagamentos confirmados e vagas ainda pendentes.',
  'Use o site como base comercial para captar patrocinadores, parceiros e novos atletas.',
]

export const productRoadmap = [
  'Conectar gateway real de pagamento e email transacional.',
  'Liberar login com sincronizacao em nuvem para atleta e organizador.',
  'Adicionar check-in, kits, cupons e relatorios operacionais.',
]

export const dashboardBenefits = [
  'Historico centralizado de inscricoes e pagamentos.',
  'Base inicial para login e acompanhamento real do atleta.',
  'Ponto de partida para CRM, notificacoes e operacao do evento.',
]

export const productMetrics = [
  { value: 'catalog', label: 'catalogo funcional' },
  { value: 'acquisition', label: 'captacao de demanda' },
  { value: 'conversion', label: 'base pronta para conversao' },
]

export const athleteValueProps = [
  'Explorar corridas por cidade, distancia e preco.',
  'Reservar vaga e finalizar o pagamento no mesmo fluxo.',
  'Receber comprovante e status atualizado da inscricao.',
]

export const organizerValueProps = [
  'Publicar eventos e captar leads.',
  'Acompanhar leads, pagamentos e emails em um painel unico.',
  'Abrir caminho para comercial, operacao e expansao do catalogo.',
]

export const heroBenefits = [
  { icon: Target, label: 'catalogo' },
  { icon: Users, label: 'pagamento' },
  { icon: Trophy, label: 'painel operacional' },
]
