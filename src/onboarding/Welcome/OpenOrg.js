import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { BackButton, Box, Button, GU, useKeyDown, useTheme } from '@conflux-/aragon-ui'
import { useWallet } from '../../wallet'
import KEYS from '../../keycodes'
import DomainField from '../../components/DomainField/DomainField'
import { useCheckDomain, DOMAIN_CHECK, DOMAIN_ERROR } from '../../check-domain'
import * as SC from './OpenOrgStyle'

function ErrorMessage(props) {
  const { message } = props
  return <SC.InfoMessage mode="error">{message}</SC.InfoMessage>
}

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
}
function OpenOrg({ onOpenOrg, onBack }) {
  const theme = useTheme()
  const [domainValue, setDomainValue] = useState('')
  const [displayError, setDisplayError] = useState(false)
  const domainCheckStatus = useCheckDomain(domainValue)
  const wallet = useWallet()
  const isUserLoggedIn = Boolean(wallet.account)
  const handleDomainChange = useCallback((subdomain, domain) => {
    setDomainValue(subdomain)
    setDisplayError(false)
  }, [])

  const handleSubmit = useCallback(() => {
    setDisplayError(domainCheckStatus === DOMAIN_ERROR)
    if (domainCheckStatus === DOMAIN_CHECK) {
      onOpenOrg(domainValue)
    }
  }, [domainValue, onOpenOrg, domainCheckStatus])

  useKeyDown(KEYS.esc, () => {
    onBack()
  })

  // focus on mount
  const handleDomainFieldRef = useCallback(ref => {
    if (ref) {
      ref.focus()
    }
  }, [])

  return (
    <Box padding={5 * GU}>
      <SC.StyledBar theme={theme}>
        <BackButton onClick={onBack} />
      </SC.StyledBar>
      <SC.Form onSubmit={handleSubmit}>
        <SC.InputsWrapper>
          <SC.RelativePosition>
            <DomainField
              ref={handleDomainFieldRef}
              detectFullDomains
              value={domainValue}
              onChange={handleDomainChange}
              status={domainCheckStatus}
              label="Name of existing organization"
            />
            {!isUserLoggedIn && (
              <ErrorMessage
                message={'You need to connect your account first!'}
              />
            )}
            {displayError && (
              <ErrorMessage
                message={'This organization doesnt seem to exist.'}
              />
            )}
          </SC.RelativePosition>
        </SC.InputsWrapper>
        <SC.ButtonWrapper>
          <Button
            label="Open organization"
            mode="strong"
            disabled={!isUserLoggedIn}
            onClick={handleSubmit}
          />
        </SC.ButtonWrapper>
      </SC.Form>
    </Box>
  )
}

OpenOrg.propTypes = {
  onBack: PropTypes.func.isRequired,
  onOpenOrg: PropTypes.func.isRequired,
}

export default OpenOrg
