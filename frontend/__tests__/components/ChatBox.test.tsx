import { render, screen, fireEvent } from '@testing-library/react'
import { ChatBox } from '@/components/chat/ChatBox'
import type { Message } from '@/types'

const defaultProps = {
  messages: [] as Message[],
  loading: false,
  asking: false,
  streamingId: null,
  messageData: {},
  activeCsv: null,
  onAsk: jest.fn(),
  onClear: jest.fn(),
}

describe('ChatBox', () => {
  it('shows suggestions when no messages', () => {
    render(<ChatBox {...defaultProps} />)
    expect(screen.getByText(/Pronto para explorar/i)).toBeInTheDocument()
  })

  it('shows loading spinner when loading prop is true', () => {
    render(<ChatBox {...defaultProps} loading={true} />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('calls onAsk when form is submitted', () => {
    const onAsk = jest.fn()
    render(<ChatBox {...defaultProps} onAsk={onAsk} />)
    const textarea = screen.getByPlaceholderText(/Pergunte qualquer coisa/i)
    fireEvent.change(textarea, { target: { value: 'What is the total?' } })
    fireEvent.click(screen.getByText('Enviar'))
    expect(onAsk).toHaveBeenCalledWith('What is the total?')
  })

  it('disables send button when asking', () => {
    render(<ChatBox {...defaultProps} asking={true} />)
    expect(screen.getByText('Enviar').closest('button')).toBeDisabled()
  })

  it('shows clear history button when messages exist', () => {
    const messages: Message[] = [{
      id: '1', role: 'user', content: 'Hello', engine: null, query: null,
      chart_data: null, created_at: new Date().toISOString(),
    }]
    render(<ChatBox {...defaultProps} messages={messages} />)
    expect(screen.getByText('Limpar histórico')).toBeInTheDocument()
  })

  it('calls onClear when clear button clicked', () => {
    const onClear = jest.fn()
    const messages: Message[] = [{
      id: '1', role: 'user', content: 'Hello', engine: null, query: null,
      chart_data: null, created_at: new Date().toISOString(),
    }]
    render(<ChatBox {...defaultProps} messages={messages} onClear={onClear} />)
    fireEvent.click(screen.getByText('Limpar histórico'))
    expect(onClear).toHaveBeenCalled()
  })
})
