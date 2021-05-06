import React from 'react'
import PropTypes from 'prop-types'
import { AppBadge } from '@conflux-/aragon-ui'
import iconSvgAddressBook from './icons/address-book.svg'
import iconSvgAgent from './icons/agent.svg'
import iconSvgAllocations from './icons/allocations.svg'
import iconSvgDandelionVoting from './icons/dandelion-voting.svg'
import iconSvgDotVoting from './icons/dot-voting.svg'
import iconSvgFinance from './icons/finance.svg'
import iconSvgFundraising from './icons/fundraising.svg'
import iconSvgPayroll from './icons/payroll.svg'
import iconSvgProjects from './icons/projects.svg'
import iconSvgRedemptions from './icons/redemptions.svg'
import iconSvgRewards from './icons/rewards.svg'
import iconSvgTimeLock from './icons/time-lock.svg'
import iconSvgTokens from './icons/token-manager.svg'
import iconSvgTokenRequest from './icons/token-request.svg'
import iconSvgVault from './icons/vault.svg'
import iconSvgVoting from './icons/voting.svg'

const KNOWN_ICONS = new Map([
  ['address-book.aragonpm.cfx', iconSvgAddressBook],
  ['agent.aragonpm.cfx', iconSvgAgent],
  ['allocations.aragonpm.cfx', iconSvgAllocations],
  ['aragon-fundraising.aragonpm.cfx', iconSvgFundraising],
  ['dandelion-voting.aragonpm.cfx', iconSvgDandelionVoting],
  ['dot-voting.aragonpm.cfx', iconSvgDotVoting],
  ['finance.aragonpm.cfx', iconSvgFinance],
  ['payroll.aragonpm.cfx', iconSvgPayroll],
  ['projects.aragonpm.cfx', iconSvgProjects],
  ['redemptions.aragonpm.cfx', iconSvgRedemptions],
  ['rewards.aragonpm.cfx', iconSvgRewards],
  ['time-lock.aragonpm.cfx', iconSvgTimeLock],
  ['token-manager.aragonpm.cfx', iconSvgTokens],
  ['token-request.aragonpm.cfx', iconSvgTokenRequest],
  ['vault.aragonpm.cfx', iconSvgVault],
  ['voting.aragonpm.cfx', iconSvgVoting],
])

function KnownAppBadge({ appName, compact, label }) {
  return <AppBadge badgeOnly iconSrc={KNOWN_ICONS.get(appName)} label={label} />
}

KnownAppBadge.propTypes = {
  appName: PropTypes.string.isRequired,
  compact: PropTypes.bool,
  label: PropTypes.string.isRequired,
}

export default KnownAppBadge
