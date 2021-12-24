import { Comment } from '@prisma/client'
import React from 'react'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { Formik } from 'formik'
import { callCreateReply } from 'pages/api/replies/create'
import { Reply_ } from 'components/commentComponent'

export class CreateReplyModal extends React.Component<{
  show: boolean
  comment: Comment
  onHide: () => void
  afterReplyCreated: (newReply: Reply_) => void
}> {
  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
      >
        <Modal.Header closeButton>
          <Modal.Title>Post a reply</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{ content: '' }}
            onSubmit={async (values) => {
              const reply = await callCreateReply({
                ...values,
                commentId: this.props.comment.id,
              })
              this.props.afterReplyCreated(reply)
            }}
          >
            {formik => (
              <Form onSubmit={formik.handleSubmit} className="woc-reply-form">
                <Form.Control name="content" id="content" type="text"
                  value={formik.values.content} onChange={formik.handleChange} />
                <Button variant="primary" type="submit">Post a reply</Button>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    )
  }
}
