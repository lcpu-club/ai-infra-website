import assert from 'node:assert/strict'
import test from 'node:test'
import { imageHasTransparency } from './media.mjs'

function pngWithColorType(colorType, extraChunkType) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ])
  const ihdr = Buffer.alloc(25)
  ihdr.writeUInt32BE(13, 0)
  ihdr.write('IHDR', 4, 'ascii')
  ihdr[17] = colorType
  const extra = extraChunkType
    ? Buffer.concat([
        Buffer.alloc(4),
        Buffer.from(extraChunkType, 'ascii'),
        Buffer.alloc(4)
      ])
    : Buffer.alloc(0)
  return Buffer.concat([signature, ihdr, extra])
}

test('detects alpha channels and transparency chunks in PNG images', () => {
  assert.equal(
    imageHasTransparency(pngWithColorType(6), 'image/png'),
    true
  )
  assert.equal(
    imageHasTransparency(pngWithColorType(2, 'tRNS'), 'image/png'),
    true
  )
  assert.equal(
    imageHasTransparency(pngWithColorType(2), 'image/png'),
    false
  )
})

test('does not mark JPEG images as transparent', () => {
  assert.equal(
    imageHasTransparency(Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg'),
    false
  )
})
