function processBlockNum(block) {
  if (Number(block) || block === 'earliest') {
    return block
  } else {
    return 'latest_state'
  }
}

function processLog(log, epochNumber, blockHash, txHash) {
  log.blockNumber = epochNumber
  log.blockHash = blockHash
  log.transactionHash = txHash
  return log
}

function processFilter(filter) {
  if (filter.fromBlock) {
    filter.fromEpoch = processBlockNum(filter.fromBlock)
    delete filter.fromBlock
  } else {
    console.warn('filter with no fromBlock', filter)
    filter.fromEpoch = 'latest_state'
  }

  if (filter.toBlock) {
    filter.toEpoch = processBlockNum(filter.toBlock)
    delete filter.toBlock
  }

  return filter
}

function preprocess(req) {
  switch (req.method) {
    case 'eth_blockNumber':
      req.method = 'cfx_epochNumber'
      break

    case 'eth_call':
      req.method = 'cfx_call'

      if (req.params[1] === 'latest') {
        req.params[1] = 'latest_state'
      }

      break

    case 'eth_getBlockByNumber':
      req.method = 'cfx_getBlockByEpochNumber'

      if (req.params[0] === 'latest') {
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
      break

    case 'eth_getLogs':
      req.method = 'cfx_getLogs'
      req.params[0] = processFilter(req.params[0])
      console.log('cfx_getLogs [request]', req)
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

    default:
    // console.log('provider send:', req)
  }
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

  return response
}

function processTransaction(transactionData, epochNumber) {
  // ignore if transactionData is null and not an object (occurs when getBlockBy* is called with false - only transaction hashes are presented)
  if (typeof transactionData === 'object' && transactionData !== null) {
    transactionData.input = transactionData.data

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
  switch (req.method) {
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
}

function wrapProvider(provider) {
  // FIXME: do we need to handle `requests` and `sendAsync` as well?
  // they don't seem to be used here

  if (typeof provider.send === 'undefined') {
    return provider
  }

  var sendOriginal = provider.send

  provider.send = function(args, callback) {
    // short-circuit unsupported methods
    if (args.method === 'eth_chainId' || args.method === 'net_version') {
      return callback(new Error(`Unsupported method: '${args.method}'`))
    }

    // process request
    preprocess(args)

    // execute call
    return sendOriginal.call(this, args, (err, res) => {
      if (err) return callback(err)
      if (res.error) {
        console.error('request failed:', res, args)
        return callback(err, res)
      }

      // console.log('receiving response:', res, 'request:', args)

      // process response
      postprocess(args, res)

      callback(err, res)
    })
  }

  return provider
}

export const Wrapper = {
  wrapProvider,
}
