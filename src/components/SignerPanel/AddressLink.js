import React from 'react'
import PropTypes from 'prop-types'
import { Link } from '@conflux-/aragon-ui'
import { EthereumAddressType } from '../../prop-types'
import EtherscanLink from '../Etherscan/EtherscanLink'
import { formatAddress } from '../../web3-utils'

const AddressLink = ({ children, to }) =>
  to ? (
    <EtherscanLink address={to}>
      {url =>
        url ? (
          <Link href={url} focusRingSpacing={[3, 2]}>
            {children || formatAddress(to)}
          </Link>
        ) : (
          formatAddress(to)
        )
      }
    </EtherscanLink>
  ) : (
    'an address or app'
  )
AddressLink.propTypes = {
  children: PropTypes.node,
  to: EthereumAddressType,
}

export default AddressLink
