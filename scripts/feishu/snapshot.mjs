export function stableSnapshotJson(value) {
  const orderedSessions = Object.fromEntries(
    Object.entries(value.sessions).sort(([left], [right]) =>
      left.localeCompare(right)
    )
  )
  const output = {
    version: value.version,
    sessions: orderedSessions,
    ...(value.wiki ? { wiki: value.wiki } : {})
  }
  return `${JSON.stringify(output, null, 2)}\n`
}
