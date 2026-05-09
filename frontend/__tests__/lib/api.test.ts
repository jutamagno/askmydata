import { streamAsk } from '@/lib/api'

global.fetch = jest.fn()

const mockStream = (lines: string[]) => {
  const encoder = new TextEncoder()
  const chunks = lines.map((l) => encoder.encode(l + '\n'))
  let i = 0
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => {
          if (i < chunks.length) return { done: false, value: chunks[i++] }
          return { done: true, value: undefined }
        },
      }),
    },
  }
}

describe('streamAsk', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls the stream endpoint with correct body', async () => {
    const tokens = [
      'data: {"type":"token","content":"Hello"}\n',
      'data: {"type":"token","content":" world"}\n',
      'data: {"type":"done","engine":"sql","query":"SELECT 1","data":null}\n',
    ];
    (global.fetch as jest.Mock).mockResolvedValue(mockStream(tokens))

    const received: string[] = []
    const result = await streamAsk('proj-1', ['csv-1'], 'test question', (t) => received.push(t))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/query/stream'),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(received).toEqual(['Hello', ' world'])
    expect(result.engine).toBe('sql')
  })

  it('throws when server returns non-ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
    await expect(
      streamAsk('p', ['c'], 'q', () => {}),
    ).rejects.toThrow('HTTP 500')
  })
})
