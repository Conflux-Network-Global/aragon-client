import React from 'react'
import { IdentityBadge } from '@conflux-/aragon-ui'
import { network } from '../../environment'

const IdentityBadgeWithNetwork = React.memo(function IdentityBadgeWithNetwork(
  props
) {
  return (
    <IdentityBadge
      networkType={network.type}
      chainId={network.chainId}
      {...props}
    />
  )
})

export default IdentityBadgeWithNetwork
