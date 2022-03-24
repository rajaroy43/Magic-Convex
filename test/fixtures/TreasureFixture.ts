import { deployments } from 'hardhat'
import { AtlasMine, MasterOfCoin, Magic, MgMagicToken, XmgMagicToken, MagicDepositor, IERC20 } from '../../typechain'
import { TEN_MILLION_MAGIC_BN, ONE_YEAR_IN_SECONDS, MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG } from '../../utils/constants'
import { parseEther } from 'ethers/lib/utils'

export const TreasureFixture = deployments.createFixture(async ({ ethers, getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts()

  const [alice, bob, carol, dave, mallory] = await ethers.getSigners()
  const secondaryUsers = [bob, carol, dave]

  // deploy and initialize TreasureDAO contracts
  const Magic = await ethers.getContractFactory('Magic')
  const magicToken = <Magic>await Magic.deploy()

  const AtlasMine = await ethers.getContractFactory('AtlasMine')
  const atlasMine = <AtlasMine>await AtlasMine.deploy()

  const MasterOfCoin = await ethers.getContractFactory('MasterOfCoin')
  const masterOfCoin = <MasterOfCoin>await MasterOfCoin.deploy()

  await atlasMine.init(magicToken.address, masterOfCoin.address)
  await masterOfCoin.init(magicToken.address)

  // override the utilization
  await atlasMine.setUtilizationOverride(parseEther('1').div(2)) // 50%

  // fund magic
  await magicToken.connect(alice).mint(TEN_MILLION_MAGIC_BN)
  await magicToken.connect(bob).mint(TEN_MILLION_MAGIC_BN)
  await magicToken.connect(bob).transfer(masterOfCoin.address, TEN_MILLION_MAGIC_BN)
  for (const user of secondaryUsers) {
    await magicToken.connect(user).mint(TEN_MILLION_MAGIC_BN)
  }

  // add stream
  let { timestamp } = await ethers.provider.getBlock('latest')

  await masterOfCoin.addStream(
    atlasMine.address,
    TEN_MILLION_MAGIC_BN,
    ++timestamp,
    timestamp + ONE_YEAR_IN_SECONDS * 2,
    false
  )

  // deploy Precious contracts
  const MgMagicToken = await ethers.getContractFactory('mgMagicToken')
  const mgMagicToken = <MgMagicToken>await MgMagicToken.deploy()

  const XmgMagicToken = await ethers.getContractFactory('xmgMagicToken')
  const xmgMagicToken = <XmgMagicToken>await XmgMagicToken.deploy(mgMagicToken.address)

  const MagicDepositor = await ethers.getContractFactory('MagicDepositor')
  const magicDepositor = <MagicDepositor>(
    await MagicDepositor.deploy(magicToken.address, mgMagicToken.address, atlasMine.address)
  )

  await magicDepositor.setConfig(
    MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG.rewards,
    MAGIC_DEPOSITOR_SPLITS_DEFAULT_CONFIG.treasury,
    deployer,
    xmgMagicToken.address
  )
  await mgMagicToken.transferOwnership(magicDepositor.address).then((tx) => tx.wait())

  const [stakeRewardSplit, treasurySplit, treasuryAddress, stakingAddress] = await Promise.all([
    magicDepositor.stakeRewardSplit(),
    magicDepositor.treasurySplit(),
    magicDepositor.treasury(),
    magicDepositor.staking(),
  ])

  await magicToken.approve(magicDepositor.address, ethers.constants.MaxUint256)

  return {
    alice,
    bob,
    carol,
    dave,
    mallory,
    atlasMine,
    magicToken: magicToken as any,
    mgMagicToken,
    magicDepositor,
    stakeRewardSplit,
    treasurySplit,
    treasuryAddress,
    stakingAddress,
  }
})
