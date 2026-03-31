import { Calendar, Clock3, MapPin, Ruler } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Race } from '../data/races'
import { formatCardDate, formatCurrency } from '../lib/race-utils'

export function RaceCard({ race }: { race: Race }) {
  return (
    <article className="race-card">
      <div className="race-card__media">
        <img src={race.imageUrl || '/images/race-card.jpg'} alt={race.name} loading="lazy" />
        <span className="price-badge">{formatCurrency(race.price)}</span>
      </div>

      <div className="race-card__body">
        <h3>{race.name}</h3>

        <div className="race-meta-list">
          <span>
            <Calendar size={15} />
            <span>{formatCardDate(race.date)}</span>
          </span>
          {race.time ? (
            <span>
              <Clock3 size={15} />
              <span>{race.time}</span>
            </span>
          ) : null}
          <span>
            <MapPin size={15} />
            <span>{race.location}</span>
          </span>
          <span>
            <Ruler size={15} />
            <span>{race.distance} km</span>
          </span>
        </div>

        {race.description ? <p>{race.description}</p> : null}
      </div>

      <div className="race-card__footer">
        <Link className="button button--primary race-card__button" to={`/register/${race.id}`}>
          Quero me inscrever
        </Link>
      </div>
    </article>
  )
}
