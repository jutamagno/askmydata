import { render, screen } from '@testing-library/react'
import { MessageBubble } from '@/components/chat/MessageBubble'
import type { Message } from '@/types'

const base: Message = {
  id: '1', role: 'user', content: 'Hello', engine: null, query: null,
  chart_data: null, created_at: new Date().toISOString(),
}

describe('MessageBubble', () => {
  it('renders user message on the right', () => {
    const { container } = render(<MessageBubble message={base} />)
    expect(container.querySelector('.justify-end')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders assistant message on the left', () => {
    const msg: Message = { ...base, role: 'assistant', engine: 'sql' }
    const { container } = render(<MessageBubble message={msg} />)
    expect(container.querySelector('.justify-start')).toBeInTheDocument()
  })

  it('renders error state with amber box', () => {
    const msg: Message = { ...base, role: 'assistant', engine: 'error', content: 'Could not find answer' }
    const { container } = render(<MessageBubble message={msg} />)
    expect(container.querySelector('.bg-amber-50, .bg-amber-950')).toBeInTheDocument()
    expect(screen.getByText('Could not find answer')).toBeInTheDocument()
  })

  it('renders streaming cursor when isStreaming is true', () => {
    const msg: Message = { ...base, role: 'assistant', engine: null, content: 'Typing...' }
    const { container } = render(<MessageBubble message={msg} isStreaming={true} />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('does not render streaming cursor when not streaming', () => {
    const msg: Message = { ...base, role: 'assistant', engine: 'sql', content: 'Done' }
    const { container } = render(<MessageBubble message={msg} isStreaming={false} />)
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
  })
})
