import styled from 'styled-components'
import { GU, Bar, Info } from '@conflux-/aragon-ui'

export const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${36 * GU}px;
`
export const StyledBar = styled(Bar)`
  margin: -${5 * GU}px -${5 * GU}px 0;
  border: 0;
  border-bottom: 2px solid ${props => props.theme.border};
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
`
export const InputsWrapper = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: center;
`

export const RelativePosition = styled.div`
  position: relative;
`

export const InfoMessage = styled(Info)`
  position: absolute;
  top: ${10.5 * GU}px;
  width: 100%;
`
