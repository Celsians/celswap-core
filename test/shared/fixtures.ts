import { Contract, Wallet } from 'ethers'
import { Web3Provider } from 'ethers/providers'
import { deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import ERC20 from '../../build/ERC20.json'
import UniswapV2Factory from '../../build/UniswapV2Factory.json'
import UniswapV2Pair from '../../build/UniswapV2Pair.json'

interface FactoryFixture {
  factory: Contract,
  baseToken: Contract
}

const overrides = {
  gasLimit: 9999999
}

export async function factoryFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<FactoryFixture> {
  const baseToken = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)

  const factory = await deployContract(wallet, UniswapV2Factory, [wallet.address, baseToken.address], overrides)
  return { factory, baseToken }
}

interface PairFixture extends FactoryFixture {
  token0: Contract
  token1: Contract
  pair: Contract
}

export async function pairFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<PairFixture> {
  const { factory, baseToken } = await factoryFixture(provider, [wallet])

  const token = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)

  await factory.createPair(baseToken.address, token.address, overrides)
  const pairAddress = await factory.getPair(baseToken.address, token.address)
  const pair = new Contract(pairAddress, JSON.stringify(UniswapV2Pair.abi), provider).connect(wallet)

  let token0, token1
  if (baseToken.address < token.address) {
    token0 = baseToken
    token1 = token
  } else {
    token0 = token
    token1 = baseToken
  }

  return { factory, baseToken, token0, token1, pair }
}
