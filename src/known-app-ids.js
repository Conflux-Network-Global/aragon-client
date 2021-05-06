import { hash as namehash } from 'eth-ens-namehash'

// These app IDs are generated from <name>.aragonpm.eth
export default {
  Agent: namehash('agent.aragonpm.cfx'),
  Finance: namehash('finance.aragonpm.cfx'),
  Fundraising: namehash('aragon-fundraising.aragonpm.cfx'),
  Survey: namehash('survey.aragonpm.cfx'),
  TokenManager: namehash('token-manager.aragonpm.cfx'),
  Vault: namehash('vault.aragonpm.cfx'),
  Voting: namehash('voting.aragonpm.cfx'),
}
