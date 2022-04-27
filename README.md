# Precious Finance Smart Contracts

## Overview

Precious utilizes the convex-model to create the most optimized staking avenue for MAGIC by creating a liquid staking derivative (Convex-style) and accumulation of some key NFTs (bonding event).

## Precious Contracts

Smart contract function documentation can be found in [docs/](https://github.com/advancedblockchain/precious/tree/main/docs)

### MagicDepositor

`MagicDepositor` allows users deposit any amount of Magic tokens and receive back prMagic tokens in exchange of providing Magic. Magic tokens deposited during an epoch are deposited into `AtlasMine`. `MagicDepositor` can hold `Treasure` and `Legions` nfts and deposit to `AtlasMine` to boot rewards. Harvested Magic rewards from AtlasMine splits into treasury and `prMagicStaking` contract.

### prMagicStaking

Like `Convex` users should deposit the `prMagic` tokens into `prMagicStaking` contract to get the Magic token rewards.

### prMagic

Locked Magic token (similar to `cvxCRV`).

### PreciousNFTLending

NFT lending contract for Treasure and Legion tokens for APY boosting on AtlasMine staking.

### PreciousChef

Precious token distribution contract based on boosting from PreciousNFTLending

## Token & Fund Flow Diagrams

### High-level architecture

```mermaid
graph LR
    U(User) -->|MAGIC deposit|D
    D[MagicDepositor] -->|MAGIC lock| AM[AtlasMine]
    D --> |stake| S[prMagicStaking]
    U --> |NFT deposit/withdraw| NFT[PreciousNFTLending]
    NFT -->|NFT deposit/withdraw| D
    NFT --> |deposit/withdraw| PRMC[PreciousChef]
    U --> |harvest| PRMC

```

### Token Flow Diagram

```mermaid
graph TD;
    U[User] -->|MAGIC| D[1. Deposits to MagicDepositor]
    D --> |MAGIC| L[2. Locks on AtlasMine]
    L --> M[3. Mints prMAGIC]
    M -->|prMAGIC| S{Stake}
    S --> |Y| S1[3. Stakes to prMagicStaking]
    S1 --> U
    S --> |No| U
```

### Fund Flow Diagram

```mermaid
graph TD
    A[User] --> B(Deposit)
    subgraph MagicDepositor
        B ---> |Magic| C{Withdraw}
        C ---> |Y| D(Withdraw Magic)
        C ---> |N| E{Harvest}
        E ---> |Y| F(Harvest Magic)
        E ---> |N| G{Active}
        G ---> |Y| H(Mint prMagic)
        H ---> |prMagic| H ---> I(Deposit Magic)
    end
    subgraph AtlasMine
    end
    D -.-> AtlasMine -.-> |Magic| D --> E
    F -.-> AtlasMine -.-> |Magic| F ---> G
    I -.-> |Magic| AtlasMine -.-> I
    G ---> |N| J
    I ---> J
    J[End]
```

## Project Setup

The following are the commands to set up the environment.

### Clone the Precious:

In the directory of your choice run the command:

```
    git clone git@github.com:advancedblockchain/precious.git
```

### Install dependencies:

```
    $ cd precious
    $ yarn(or npm install)
```

### Create Environment Variable

Create `.env` file in the root directory and the following variable:

```
    NODE_URL = ALCHEMY_ARBITRUM_MAINNET
    MAINNET_PRIVKEY = YOUR_PRIVATE_KEY
    TESTNET_PRIVKEY = YOUR_PRIVATE_KEY
```

### Compile

Compile the smart contracts with Hardhat:

```
    $ yarn compile
```

### Test

Run the hardhat contract tests:

```
    $ yarn test
```

### Configuration for Precious Deployment

Already set predefined params that will be needed for precious mainnet deployment .
But you may change any params under util/constant.ts .

1.  For deployment of MagicDepositorContract :(deploy/hardhat/006_deploy_magic_depositor.ts)

        Set magicToken address,prMagic Token address,atlasMine contract address,
            treasure contract address,legion contract address
        Set all above params , In util/constant.ts(We already set these contract address)

2.  For deployment of RewardPool:(deploy/hardhat/007_deploy_rewardpool.ts)

        Set StakingToken as prMagicToken , RewardToken as magicToken and operator as magicDepositorContract address

3.  For deployment of LendingAuctionNft:(deploy/hardhat/008_deploy_lendingAuctionNFT.ts)

        Set treasure,legion and atlasmine contract address and after that call
        setMagicDepositor(magicDepositorAddress)

### Precious Deployment on arbitrum mainnet

It will deploy Precious System on ArbitrumMainnet

```
   $ yarn deploy:live

```
