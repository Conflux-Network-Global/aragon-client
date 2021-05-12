import { format } from 'js-conflux-sdk'
import { network } from './environment'
import Web3 from 'web3'

let logsProvider = null

function getLogsProvider() {
  if (!logsProvider) {
    const options = {
      keepAlive: true,
      withCredentials: false,
      timeout: 100000, // ms
      headers: [
        {
          name: 'Access-Control-Allow-Origin',
          value: '*',
        },
      ],
    }

    logsProvider = new Web3.providers.HttpProvider(
      network.indexServiceUrl,
      options
    )

    const onOriginal = logsProvider.on

    logsProvider.on = function(event, handler) {
      return onOriginal.call(this, event, args => {
        if (event === 'data' && args.method === 'cfx_subscription') {
          args.params.result = processLog(
            args.params.result,
            args.params.result.epochNumber,
            args.params.result.blockHash,
            args.params.result.transactionHash
          )

          args.params.result.address = formatHex(args.params.result.address)
        }

        return handler(args)
      })
    }
  }

  return logsProvider
}

function processBlockNum(block) {
  if (Number(block) || block === 'earliest') {
    return block
  } else {
    return 'latest_state'
  }
}

function processLog(log, epochNumber, blockHash, txHash) {
  log.address = format.hexAddress(log.address, network.chainId)
  log.blockNumber = epochNumber
  log.blockHash = blockHash
  log.transactionHash = txHash
  return log
}

function processFilter(filter) {
  if (filter.fromBlock) {
    filter.fromEpoch = processBlockNum(filter.fromBlock)
    delete filter.fromBlock
  } else if (!filter.fromEpoch) {
    console.warn('filter with no fromBlock', filter)
    filter.fromEpoch = 'latest_state'
  }

  if (filter.toBlock) {
    filter.toEpoch = processBlockNum(filter.toBlock)
    delete filter.toBlock
  }

  if (filter.address) {
    filter.address = format.address(filter.address, network.chainId, true)
  }

  return filter
}

function preprocessMessage(method, params) {
  const makeMsg = (method, params) => {
    return {
      id: Math.floor(Math.random() * 1000000),
      jsonrpc: '2.0',
      method,
      params,
    }
  }
  let req

  switch (method) {
    case 'eth_getBalance':
      params[0] = format.address(params[0], network.chainId)
      if (params[1] === 'latest') {
        params[1] = 'latest_state'
      }
      req = makeMsg('cfx_getBalance', params)
      break
    case 'eth_blockNumber':
      req = makeMsg('cfx_epochNumber', [])
      break
    case 'eth_getCode':
      params[0] = format.address(params[0], network.chainId)
      req = makeMsg('cfx_getCode', params)
      break
    default:
      throw new Error(`Method ${method} not handled preprocess message!`)
  }

  return req
}

function preprocess(req) {
  // console.log('preprocess begin', req)

  switch (req.method) {
    case 'eth_getBalance':
      req.params[0] = format.address(req.params[0], network.chainId)
      if (req.params[1] === 'latest') {
        req.params[1] = 'latest_state'
      }
      req.method = 'cfx_getBalance'
      break
    case 'eth_sendTransaction':
      req.method = 'cfx_sendTransaction'

      // workaround for a bug where storage limit is not estimated automatically
      delete req.params[0].gas
      delete req.params[0].gasPrice

      // console.trace(req)
      break

    case 'eth_blockNumber':
      req.method = 'cfx_epochNumber'
      break

    case 'eth_call':
      req.method = 'cfx_call'

      if (req.params[1] === 'latest') {
        req.params[1] = 'latest_state'
      }

      if (req.params[0] && req.params[0].to) {
        req.params[0].to = format.address(req.params[0].to, network.chainId)
      }

      if (req.params[0] && req.params[0].from) {
        req.params[0].from = format.address(req.params[0].from, network.chainId)
      }

      // console.trace(req)
      break

    case 'eth_getBlockByNumber':
      req.method = 'cfx_getBlockByEpochNumber'

      if (req.params[0] === 'latest' || !req.params[0]) {
        req.params[0] = 'latest_state'
      }

      break

    case 'eth_getTransactionByHash':
      req.method = 'cfx_getTransactionByHash'
      break

    case 'eth_getTransactionReceipt':
      req.method = 'cfx_getTransactionReceipt'
      break

    case 'eth_estimateGas':
      req.method = 'cfx_estimateGasAndCollateral'
      if (req.params[0] && req.params[0].to) {
        req.params[0].to = format.address(req.params[0].to, network.chainId)
      }
      if (req.params[0] && req.params[0].from) {
        req.params[0].from = format.address(req.params[0].from, network.chainId)
      }
      break

    case 'eth_getLogs':
      req.method = 'cfx_getLogs'
      req.params[0] = processFilter(req.params[0])
      // console.log('cfx_getLogs [request]', req)
      // console.trace('cfx_getLogs', req)
      break

    case 'eth_subscribe':
      req.method = 'cfx_subscribe'

      if (req.params[0] === 'logs') {
        req.params[1] = processFilter(req.params[1])
      }
      // console.log('cfx_subscribe [request]', req)
      break

    case 'eth_unsubscribe':
      req.method = 'cfx_unsubscribe'
      break

    case 'cfx_getBlockByEpochNumber':
    case 'cfx_epochNumber':
    case 'cfx_call':
      break

    default:
      console.log(`Method ${req.method} not handled in preprocess!`)
  }

  // console.log('preprocess end', req)

  return req
}

function processBlockResponse(response) {
  // response.result.sha3Uncles =
  //   '0x' +
  //   keccak256(Buffer.from(response.result.refereeHashes)).toString('hex');
  response.result.stateRoot = response.result.deferredStateRoot
  response.result.receiptsRoot = response.result.deferredReceiptsRoot
  response.result.gasUsed = '0x0' // no gasUsed parameter from CFX response (replacing with 0)
  response.result.extraData = '0x' + '0'.repeat(64) // no equivalent parameter
  // response.result.uncles = response.result.refereeHashes;
  response.result.uncles = []
  response.result.number = response.result.epochNumber
  response.result.transactions = response.result.transactions.map(transaction =>
    processTransaction(transaction, response.result.epochNumber)
  )
  response.result.miner = format.hexAddress(response.result.miner)

  return response
}

function processTransaction(transactionData, epochNumber) {
  // ignore if transactionData is null and not an object (occurs when getBlockBy* is called with false - only transaction hashes are presented)
  if (typeof transactionData === 'object' && transactionData !== null) {
    transactionData.input = transactionData.data

    if (transactionData.to) {
      transactionData.to = format.hexAddress(transactionData.to)
    }

    if (transactionData.from) {
      transactionData.from = format.hexAddress(transactionData.from)
    }

    if (epochNumber !== null) {
      transactionData.blockNumber = epochNumber
    }
  }

  return transactionData
}

function processReceiptResponse(receipt) {
  receipt.result.transactionIndex = receipt.result.index
  receipt.result.cumulativeGasUsed = receipt.result.gasUsed
  receipt.result.blockNumber = receipt.result.epochNumber

  receipt.result.logs = receipt.result.logs.map(log =>
    processLog(
      log,
      receipt.result.epochNumber,
      receipt.result.blockHash,
      receipt.result.transactionHash
    )
  )

  return receipt
}

function postprocess(req, resp) {
  // console.log('postprocess begin', req, resp)

  switch (req.method) {
    case 'cfx_getStatus':
      resp = resp.result.chainId
      break

    case 'cfx_getBlockByEpochNumber':
      resp = processBlockResponse(resp)
      break

    case 'cfx_getTransactionByHash':
      if (!resp.result) return

      resp.result = processTransaction(resp.result, resp.result.epochNumber)

      break

    case 'cfx_getTransactionReceipt':
      if (!resp.result) return
      resp = processReceiptResponse(resp)
      break

    case 'cfx_getLogs':
      resp.result = resp.result.map(log =>
        processLog(log, log.epochNumber, log.blockHash, log.transactionHash)
      )
      // console.log('cfx_getLogs [response]', resp)
      break

    case 'cfx_estimateGasAndCollateral':
      resp.result = resp.result.gasLimit
      break

    case 'cfx_subscription':
      // console.log('cfx_subscription [response]', resp)

      if (req.params[0] === 'logs') {
        resp.result = processLog(
          resp.result,
          resp.result.epochNumber,
          resp.result.blockHash,
          resp.result.transactionHash
        )
      }

      break
  }

  // console.log('postprocess end', req, resp)

  return resp
}

function wrapSendAsync(provider) {
  if (typeof provider.sendAsync !== 'undefined') {
    const sendAsyncOriginal = provider.sendAsync

    provider.sendAsync = function(message, callback) {
      console.log('Conflux Portal sendAsync:', message)

      if (message.method === 'net_version') {
        return callback(new Error(`Unsupported method: '${message.method}'`))
      }

      if (message.method === 'eth_sendTransaction') {
        message.method = 'cfx_sendTransaction'

        // workaround for a bug where storage limit is not estimated automatically
        delete message.params[0].gas
        delete message.params[0].gasPrice

        // console.trace(data)
      }

      if (message.method === 'eth_chainId') {
        return callback(undefined, {
          jsonrpc: '2.0',
          id: message.id,
          result: network.chainId,
        })
      }

      const handle = (err, response) => {
        if (err || (response && response.error)) {
          console.error(
            'sendAsync request failed:',
            err || response.error,
            message,
            response
          )
          return callback(err || (response && response.error))
        }

        if (message.method === 'eth_getBlockByNumber') {
          response.result.miner = format.hexAddress(response.result.miner)
        }

        /*
        console.log(
          'sendAsync success',
          'data:',
          message,
          'response:',
          response
        )
        */
        return callback(err || (response && response.error), response)
      }

      return message.method === 'cfx_getLogs'
        ? getLogsProvider().sendAsync(message, handle)
        : sendAsyncOriginal.call(this, message, handle)
    }
  }
}

function wrapSend(provider) {
  if (typeof provider.send !== 'undefined') {
    const sendOriginal = provider.send

    provider.send = function() {
      // console.log('Conflux Portal send start:', arguments)

      // message is a string, handle it as an array
      if (typeof arguments[0] === 'string') {
        const method = arguments[0]
        const args = arguments[1]

        return new Promise((resolve, reject) => {
          if (method === 'eth_requestAccounts') {
            return reject(new Error(`Unsupported method: '${method}'`))
          }

          if (method === 'eth_chainId') {
            return resolve(network.chainId)
          }

          // short-circuit unsupported methods
          let message = preprocessMessage(method, args)

          const handle = (err, response) => {
            // console.log('Conflux Portal send end:', message, response)
            if (err || (response && response.error)) {
              console.error(
                'send request failed:',
                err || response.error,
                message,
                response
              )
              return reject(err || (response && response.error))
            }
            return resolve(postprocess(message, response))
          }

          // execute call
          return message.method === 'cfx_getLogs'
            ? getLogsProvider().send(message, handle)
            : sendOriginal.call(this, message, handle)
        })
      }
      // lets hope message is an object, handle it as an object with callback
      else {
        let [message, callback] = arguments

        if (message.method === 'net_version') {
          return callback(new Error(`Unsupported method: '${message.method}'`))
        }

        if (message.method === 'eth_chainId') {
          return callback(undefined, {
            jsonrpc: '2.0',
            id: message.id,
            result: network.chainId,
          })
        }

        // process request
        message = preprocess(message)

        const handle = (err, response) => {
          // console.log('Conflux Portal send end:', message, response)

          if (err || (response && response.error)) {
            console.error(
              'send request failed:',
              err || response.error,
              message,
              response
            )
            // console.trace()
            return callback(err || (response && response.error))
          }

          // process response
          response = postprocess(message, response)

          // console.log('Conflux Portal send final:', message, response)
          return callback(err || (response && response.error), response)
        }

        // execute call
        return message.method === 'cfx_getLogs'
          ? getLogsProvider().send(message, handle)
          : sendOriginal.call(this, message, handle)
      }
    }
  }
}

function formatHex(addr) {
  if (typeof addr === 'undefined') {
    return undefined
  }

  return format.hexAddress(addr)
}

function wrapCfx(conflux) {
  if (conflux && typeof conflux.enable !== 'undefined') {
    const originalEnable = conflux.enable
    conflux.enable = async function() {
      const accs = await originalEnable.call(this)
      const acc = format.hexAddress(accs[0])
      return [acc]
    }

    wrapSend(conflux)
    wrapSendAsync(conflux)

    const onOriginal = conflux.on

    conflux.on = function(event, handler) {
      return onOriginal.call(this, event, args => {
        if (event === 'data' && args.method === 'cfx_subscription') {
          args.params.result = processLog(
            args.params.result,
            args.params.result.epochNumber,
            args.params.result.blockHash,
            args.params.result.transactionHash
          )

          args.params.result.address = formatHex(args.params.result.address)
        }

        return handler(args)
      })
    }

    return conflux
  }
}

function wrapProvider(provider) {
  wrapSend(provider)
  wrapSendAsync(provider)

  const onOriginal = provider.on

  provider.on = function(event, handler) {
    return onOriginal.call(this, event, args => {
      if (event === 'data' && args.method === 'cfx_subscription') {
        args.params.result = processLog(
          args.params.result,
          args.params.result.epochNumber,
          args.params.result.blockHash,
          args.params.result.transactionHash
        )

        args.params.result.address = formatHex(args.params.result.address)
      }

      return handler(args)
    })
  }

  return provider
}

export const Wrapper = {
  wrapProvider,
  wrapCfx,
}
