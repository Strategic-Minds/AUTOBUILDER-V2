export {}

declare global {
  function fetch(
    input: string | URL | Request,
    init?: Omit<RequestInit, 'body'> & {
      body?: BodyInit | Uint8Array<ArrayBufferLike> | null
    },
  ): Promise<Response>
}
