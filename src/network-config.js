import { getLocalChainId, getEnsRegistryAddress } from './local-settings'

const localEnsRegistryAddress = getEnsRegistryAddress()

export const networkConfigs = {
  local: {
    addresses: {
      ensRegistry: localEnsRegistryAddress,
    },
    nodes: {
      defaultEth: 'ws://localhost:8545',
    },
    settings: {
      // Local development environments by convention use
      // a chainId of value 1337, but for the sake of configuration
      // we expose a way to change this value.
      chainId: Number(getLocalChainId()),
      name: 'local testnet',
      shortName: 'Local',
      type: 'private',
      live: false,
    },
    providers: [{ id: 'provided' }, { id: 'frame' }],
  },
  cfx: {
    addresses: {
      ensRegistry:
        localEnsRegistryAddress || '0x87E87fA4b4402DfD641fd67dF7248C673Db31db1',
    },
    nodes: {
      defaultEth: 'wss://main.confluxrpc.com/ws/v2',
    },
    settings: {
      chainId: 2,
      maxGap: 1000,
      name: 'Conflux',
      shortName: 'cfx',
      type: 'private',
      indexServiceUrl: 'http://localhost:2000',
      live: true,
    },
    providers: [{ id: 'provided' }],
  },
  cfx_testnet: {
    addresses: {
      ensRegistry:
        localEnsRegistryAddress || '0x87E87fA4b4402DfD641fd67dF7248C673Db31db1',
    },
    nodes: {
      defaultEth: 'wss://test.confluxrpc.com/ws/v2',
    },
    settings: {
      chainId: 1,
      maxGap: 1000,
      name: 'Conflux Testnet',
      shortName: 'cfx-testnet',
      type: 'private',
      indexServiceUrl: 'http://localhost:2000',
      live: false,
    },
    providers: [{ id: 'provided' }],
  },
  unknown: {
    addresses: {
      ensRegistry: localEnsRegistryAddress,
    },
    nodes: {
      defaultEth: 'ws://localhost:8545',
    },
    settings: {
      name: `Unknown network`,
      shortName: 'Unknown',
      type: 'unknown',
      live: false,
    },
    providers: [{ id: 'provided' }, { id: 'frame' }],
  },
}

export function getNetworkConfig(type) {
  console.log('network', type)
  return (
    networkConfigs[type] || {
      ...networkConfigs.unknown,
      settings: {
        ...networkConfigs.unknown.settings,
        name: `Unsupported network (${type})`,
      },
    }
  )
}

export function getNetworkByChainId(chainId = -1) {
  chainId = Number(chainId)
  return (
    Object.values(networkConfigs).find(
      network => network.settings.chainId === chainId
    ) || networkConfigs.unknown
  )
}

export function sanitizeNetworkType(networkType) {
  if (networkType === 'private') {
    return 'localhost'
  } else if (networkType === 'main') {
    return 'mainnet'
  }
  return networkType
}
