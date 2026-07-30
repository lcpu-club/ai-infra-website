const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
])

export function imageHasTransparency(buffer, contentType) {
  if (!Buffer.isBuffer(buffer)) return false

  const mediaType = String(contentType)
    .split(';', 1)[0]
    .trim()
    .toLowerCase()

  if (mediaType === 'image/png') return pngHasTransparency(buffer)
  if (mediaType === 'image/webp') return webpHasTransparency(buffer)
  if (mediaType === 'image/gif') return gifHasTransparency(buffer)
  return false
}

function pngHasTransparency(buffer) {
  if (
    buffer.length < PNG_SIGNATURE.length ||
    !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    return false
  }

  let colorType
  let offset = PNG_SIGNATURE.length
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const typeStart = offset + 4
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd + 4 > buffer.length) return false

    const type = buffer.toString('ascii', typeStart, typeStart + 4)
    if (type === 'IHDR' && length >= 10) {
      colorType = buffer[dataStart + 9]
      if (colorType === 4 || colorType === 6) return true
    }
    if (type === 'tRNS') return true
    if (type === 'IEND') break
    offset = dataEnd + 4
  }

  return false
}

function webpHasTransparency(buffer) {
  if (
    buffer.length < 20 ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return false
  }

  let offset = 12
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4)
    const length = buffer.readUInt32LE(offset + 4)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd > buffer.length) return false
    if (type === 'ALPH') return true
    if (type === 'VP8X' && length > 0 && (buffer[dataStart] & 0x10) !== 0) {
      return true
    }
    offset = dataEnd + (length % 2)
  }

  return false
}

function gifHasTransparency(buffer) {
  if (
    buffer.length < 8 ||
    !['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))
  ) {
    return false
  }

  for (let offset = 6; offset + 7 < buffer.length; offset += 1) {
    if (
      buffer[offset] === 0x21 &&
      buffer[offset + 1] === 0xf9 &&
      buffer[offset + 2] === 0x04 &&
      (buffer[offset + 3] & 0x01) !== 0
    ) {
      return true
    }
  }
  return false
}
