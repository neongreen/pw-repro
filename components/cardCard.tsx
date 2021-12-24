import { cardSettings } from "../lib/model-settings"
import { Badge, Card as BSCard } from 'react-bootstrap'
import Link from 'next/link'
import { Card } from "@prisma/client"

type Card_ = Card

// A card, e.g. in a board view.
export function CardCard({ card }: { card: Card_ }) {
  const isPrivate = cardSettings(card).visibility === 'private'
  return (
    <BSCard className={`mb-2 woc-card ${isPrivate ? "woc-card-private" : ""}`}>
      <BSCard.Body>
        <Link href={`/ShowCard?cardId=${card.id}`}><a className="stretched-link">{card.title}</a></Link>
      </BSCard.Body>
    </BSCard>
  )
}
