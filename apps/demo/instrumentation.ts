import { withStalescope } from 'stalescope'

export function register() {
  withStalescope({
    enabled: true,
    maxEvents: 500,
  })
}
