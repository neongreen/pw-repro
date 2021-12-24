import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card } from '@prisma/client'
import { prisma } from '../lib/db'
import { boardSettings, cardSettings } from '../lib/model-settings'
import { Accordion, Badge, Button, Card as BSCard, Form } from 'react-bootstrap'
import { CardCard } from '../components/cardCard'
import React, { useState } from 'react'
import _ from 'lodash'
import { getSession } from 'next-auth/react'
import { serialize, deserialize } from 'superjson'
import { SuperJSONResult } from 'superjson/dist/types'
import { callCreateCard } from './api/cards/create'
import { useFormik } from 'formik'
import { useRouter } from 'next/router'

type Card_ = Card
type Board_ = Board & { owner: User, cards: Card_[] }

type Props = {
  userId: User['id'] | null
  board: Board_
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  let board = await prisma.board.findUnique({
    where: {
      id: context.query.boardId as string
    },
    include: {
      owner: true,
      cards: true,
    }
  })
  const props: Props = {
    userId: session?.userId,
    board: board!
  }
  return { props: serialize(props) }
}

function AddCardForm(props: {
  boardId: Board['id']
  afterCardCreated: (card: Card) => void
}) {
  const formik = useFormik({
    initialValues: {
      title: '',
      private: false,
    },
    onSubmit: async (values) => {
      const card = await callCreateCard({
        boardId: props.boardId,
        ...values
      })
      props.afterCardCreated(card)
      formik.resetForm()
    }
  })
  return (
    <Form onSubmit={formik.handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Control
          name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
          type="text" placeholder="Card title"
          style={{ maxWidth: "40rem", width: "100%" }} />
      </Form.Group>
      <Button variant="primary" type="submit">Add a card</Button>
      <Form.Check
        name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
        type="checkbox" className="ms-4" inline label="🔒 Private card" />
    </Form>
  )
}

const ShowBoard: NextPage<SuperJSONResult> = (props) => {
  const { board: initialBoard } = deserialize<Props>(props)

  const [cards, setCards] = useState(initialBoard.cards)
  const addCard = (card: Card) => {
    setCards(cards => (cards.concat([card])))
  }

  const [board, setBoard] = useState(_.omit(initialBoard, ['cards']))

  const [normalCards, archivedCards] =
    _.partition(
      _.orderBy(cards, ['createdAt'], ['desc']),
      card => (!cardSettings(card).archived))

  return (
    <>
      <h1 style={{ marginBottom: "1em" }}>
        {board.title}
      </h1>

      <AddCardForm boardId={board.id} afterCardCreated={addCard} />
      <div style={{ marginTop: "30px" }}>
        {normalCards.map(card => (
          <CardCard key={card.id} card={card} />
        ))}
      </div>
    </>
  )
}

export default ShowBoard
