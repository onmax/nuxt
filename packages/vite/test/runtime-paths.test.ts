import { describe, expect, it } from 'vitest'

import { RuntimePathsPlugin } from '../src/plugins/runtime-paths.ts'

describe('RuntimePathsPlugin', () => {
  it('only sends modules that reference vite assets, outside css, to the transform', () => {
    const { filter } = RuntimePathsPlugin().transform as { filter?: { id: { exclude: RegExp[] }, code: RegExp } }
    const reaches = (code: string, id: string) => !!filter && !filter.id.exclude.some(re => re.test(id)) && filter.code.test(code)
    const asset = 'export default "__VITE_ASSET__abc__"'
    expect(reaches(asset, '/app/a.ts')).toBe(true)
    expect(reaches('export default "__VITE_PUBLIC_ASSET__abc__"', '/app/a.vue')).toBe(true)
    expect(reaches(asset, '/app/a.vue?vue&type=script')).toBe(true)
    expect(reaches(asset, '/app/logo.svg?ref=theme.css')).toBe(true)
    expect(reaches('export default 1', '/app/a.ts')).toBe(false)
    expect(reaches(asset, '/app/a.css')).toBe(false)
    expect(reaches(asset, '/app/a.scss?inline')).toBe(false)
    expect(reaches(asset, '/app/a.css?v=1.2')).toBe(false)
    expect(reaches(asset, '/app/a.vue?vue&type=style&index=0&lang.css')).toBe(false)
  })
})
