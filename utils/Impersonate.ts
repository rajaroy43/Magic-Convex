import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ImpersonateSend__factory } from '../typechain/factories/ImpersonateSend__factory'

export async function impersonate(address: string, funder: Wallet | SignerWithAddress, hre: HardhatRuntimeEnvironment) {
  new ImpersonateSend__factory(funder).deploy(address, { value: parseEther('0.01') })

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  })

  return hre.ethers.getSigner(address)
}
