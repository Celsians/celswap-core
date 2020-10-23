import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { AddressZero } from 'ethers/constants'
import { bigNumberify } from 'ethers/utils'
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle'

import { getCreate2Address } from './shared/utilities'
import { factoryFixture } from './shared/fixtures'

import UniswapV2Pair from '../build/UniswapV2Pair.json'

chai.use(solidity)

const TEST_ADDRESSES: [string, string] = [
  '0x1000000000000000000000000000000000000000',
  '0x2000000000000000000000000000000000000000'
]

describe('UniswapV2Factory', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
  const [wallet, other, liquidityProvider] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet, other])

  let factory: Contract
  let baseToken: Contract
  beforeEach(async () => {
    const fixture = await loadFixture(factoryFixture)
    factory = fixture.factory
    baseToken = fixture.baseToken
  })

  it('feeTo, feeToSetter, allPairsLength', async () => {
    expect(await factory.feeTo()).to.eq(AddressZero)
    expect(await factory.admin()).to.eq(wallet.address)
    expect(await factory.allPairsLength()).to.eq(0)
  })

  async function registerLiquidityProvider() {
    await expect(factory.registerLiquidityProvider(liquidityProvider.address))
      .to.emit(factory, 'LiquidityProviderRegistered')
      .withArgs(liquidityProvider.address)
  }

  async function createPair(tokens: [string, string]) {
    const bytecode = `0x${UniswapV2Pair.evm.bytecode.object}`
    const create2Address = getCreate2Address(factory.address, tokens, bytecode)
    await expect(factory.connect(liquidityProvider).createPair(...tokens))
      .to.emit(factory, 'PairCreated')
      .withArgs(TEST_ADDRESSES[0], baseToken.address, create2Address, bigNumberify(1))

    await expect(factory.connect(liquidityProvider).createPair(...tokens)).to.be.revertedWith('Celswap: PAIR_EXISTS')
    await expect(factory.connect(liquidityProvider).createPair(...tokens.slice().reverse())).to.be.revertedWith(
      'Celswap: PAIR_EXISTS'
    )
    expect(await factory.getPair(...tokens)).to.eq(create2Address)
    expect(await factory.getPair(...tokens.slice().reverse())).to.eq(create2Address)
    expect(await factory.allPairs(0)).to.eq(create2Address)
    expect(await factory.allPairsLength()).to.eq(1)

    const pair = new Contract(create2Address, JSON.stringify(UniswapV2Pair.abi), provider)
    expect(await pair.factory()).to.eq(factory.address)
    expect(await pair.token0()).to.eq(TEST_ADDRESSES[0])
    expect(await pair.token1()).to.eq(baseToken.address)
  }

  it('registerLiquidityProvider', async () => {
    await registerLiquidityProvider()
  })

  it('registerLiquidityProvider:nonAdmin', async () => {
    await expect(factory.connect(other).registerLiquidityProvider(liquidityProvider.address)).to.be.revertedWith(
      'Celswap: FORBIDDEN'
    )
  })

  it('registerLiquidityProvider:alreadyRegistered', async () => {
    await registerLiquidityProvider()
    await expect(factory.registerLiquidityProvider(liquidityProvider.address)).to.be.revertedWith(
      'Celswap: ALREADY_REGISTERED'
    )
  })

  it('createPair', async () => {
    await registerLiquidityProvider()
    await createPair([baseToken.address, TEST_ADDRESSES[0]])
  })

  it('createPair:reverse', async () => {
    await registerLiquidityProvider()
    await createPair([TEST_ADDRESSES[0], baseToken.address])
  })

  it('createPair:nonBaseToken', async () => {
    await expect(factory.createPair(...TEST_ADDRESSES)).to.be.revertedWith('Celswap: NON_BASE_TOKEN_PAIR')
  })

  it('createPair:gas', async () => {
    await registerLiquidityProvider()
    const tx = await factory.connect(liquidityProvider).createPair(baseToken.address, TEST_ADDRESSES[0])
    const receipt = await tx.wait()
    expect(receipt.gasUsed).to.eq(2622840)
  })

  it('createPair:nonLiquidityProvider', async () => {
    await registerLiquidityProvider()
    await expect(factory.connect(other).createPair(baseToken.address, TEST_ADDRESSES[0])).to.be.revertedWith(
      'Celswap: FORBIDDEN'
    )
  })

  it('setFeeTo', async () => {
    await expect(factory.connect(other).setFeeTo(other.address)).to.be.revertedWith('Celswap: FORBIDDEN')
    await factory.setFeeTo(wallet.address)
    expect(await factory.feeTo()).to.eq(wallet.address)
  })

  it('setAdmin', async () => {
    await expect(factory.connect(other).setAdmin(other.address)).to.be.revertedWith('Celswap: FORBIDDEN')
    await factory.setAdmin(other.address)
    expect(await factory.admin()).to.eq(other.address)
    await expect(factory.setAdmin(wallet.address)).to.be.revertedWith('Celswap: FORBIDDEN')
  })
})
