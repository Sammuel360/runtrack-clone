export type RaceStatus = 'draft' | 'published'

export type Race = {
  id: string
  name: string
  date: string
  description: string
  distance: number
  featured: boolean
  imageUrl: string
  location: string
  price: number
  status: RaceStatus
  time: string
}

export const races: Race[] = [
  {
    id: '2txtk71oi4aobtg',
    name: 'Maratona da Cidade',
    date: '2026-04-15',
    description:
      'Uma maratona completa de 42.2km atraves das ruas vibrantes da cidade. Perfeita para corredores experientes que buscam um desafio epico.',
    distance: 42.2,
    featured: true,
    imageUrl: '',
    location: 'Sao Paulo, SP',
    price: 89.99,
    status: 'published',
    time: '05:30',
  },
  {
    id: 'fy9o0l4sl1bsosx',
    name: 'Corrida Divertida 5K',
    date: '2026-04-22',
    description:
      'Uma corrida casual de 5km ideal para iniciantes e familias. Divirta-se enquanto se exercita em um ambiente acolhedor.',
    distance: 5,
    featured: true,
    imageUrl: '',
    location: 'Rio de Janeiro, RJ',
    price: 29.99,
    status: 'published',
    time: '07:00',
  },
  {
    id: '1ajy4p5g5d92oez',
    name: 'Corrida de Trilha 10K',
    date: '2026-05-10',
    description:
      'Desafio de 10km em trilhas naturais com paisagens deslumbrantes. Recomendado para corredores com experiencia em terrenos variados.',
    distance: 10,
    featured: true,
    imageUrl: '',
    location: 'Belo Horizonte, MG',
    price: 49.99,
    status: 'published',
    time: '06:15',
  },
  {
    id: 'ewr6sosw1f5crue',
    name: 'Meia Maratona',
    date: '2026-05-18',
    description:
      'Uma meia maratona de 21.1km para corredores intermediarios. Teste sua resistencia em um percurso bem organizado.',
    distance: 21.1,
    featured: false,
    imageUrl: '',
    location: 'Brasilia, DF',
    price: 59.99,
    status: 'published',
    time: '05:45',
  },
  {
    id: 'bd38rc5bepi7auy',
    name: 'Corrida Sprint',
    date: '2026-05-30',
    description:
      'Uma corrida rapida de 3km perfeita para quem quer comecar. Otima para melhorar sua velocidade e resistencia.',
    distance: 3,
    featured: false,
    imageUrl: '',
    location: 'Curitiba, PR',
    price: 19.99,
    status: 'published',
    time: '08:00',
  },
  {
    id: 'f8ct8txg6nwc39z',
    name: 'City Marathon',
    date: '2026-06-05',
    description:
      'Percurso urbano com altimetria equilibrada para atletas que querem performance e experiencia internacional.',
    distance: 42.2,
    featured: false,
    imageUrl: '',
    location: 'Downtown',
    price: 89,
    status: 'published',
    time: '06:00',
  },
  {
    id: '9nuur3msbwg4a4s',
    name: 'Spring 5K',
    date: '2026-06-12',
    description:
      'Prova leve e colorida pensada para iniciantes, assessorias e publico corporativo.',
    distance: 5,
    featured: false,
    imageUrl: '',
    location: 'Central Park',
    price: 25,
    status: 'published',
    time: '07:30',
  },
  {
    id: 'af0ojzcz2bu6xwc',
    name: 'Mountain Trail Run',
    date: '2026-06-19',
    description:
      'Trilhas tecnicas e vistas amplas para atletas que buscam aventura e contato com a natureza.',
    distance: 15,
    featured: false,
    imageUrl: '',
    location: 'Mountain Ridge',
    price: 45,
    status: 'published',
    time: '06:40',
  },
  {
    id: '30i6crjv5xoex08',
    name: 'Half Marathon Challenge',
    date: '2026-06-26',
    description:
      'Evento desenhado para quem quer buscar recorde pessoal em um circuito rapido e seguro.',
    distance: 21.1,
    featured: false,
    imageUrl: '',
    location: 'Riverside',
    price: 65,
    status: 'published',
    time: '05:50',
  },
  {
    id: 'f3gxztqb7jsaker',
    name: 'Urban 10K',
    date: '2026-07-03',
    description:
      'Corrida de 10km para atletas que gostam de cidade, ritmo forte e estrutura premium.',
    distance: 10,
    featured: false,
    imageUrl: '',
    location: 'City Streets',
    price: 35,
    status: 'draft',
    time: '07:10',
  },
]

export const featuredRaces = races.filter((race) => race.featured).slice(0, 3)

export function getRaceById(raceId: string) {
  return races.find((race) => race.id === raceId) ?? null
}
