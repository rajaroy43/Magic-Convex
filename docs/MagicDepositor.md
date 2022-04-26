# MagicDepositor

> MagicDepositor

cvxCRV like perpetual staking contract of MAGIC tokens

## Methods

### atlasDeposits

```solidity
function atlasDeposits(uint256) external view returns (uint256 activationTimestamp, uint256 accumulatedMagic, bool isActive)
```

Info of each deposit

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

#### Returns

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| activationTimestamp | uint256 | undefined   |
| accumulatedMagic    | uint256 | undefined   |
| isActive            | bool    | undefined   |

### atlasMine

```solidity
function atlasMine() external view returns (contract IAtlasMine)
```

#### Returns

| Name | Type                | Description |
| ---- | ------------------- | ----------- |
| \_0  | contract IAtlasMine | undefined   |

### claimMintedShares

```solidity
function claimMintedShares(uint256 atlasDepositIndex, bool stake) external nonpayable returns (uint256)
```

Claim prMagic token

#### Parameters

| Name              | Type    | Description                                                                  |
| ----------------- | ------- | ---------------------------------------------------------------------------- |
| atlasDepositIndex | uint256 | The index of deposit                                                         |
| stake             | bool    | If true, then stake prMagic into staking. Otherwise send prMagic to the user |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### currentAtlasDepositIndex

```solidity
function currentAtlasDepositIndex() external view returns (uint256)
```

Most recent accumulated atlasDeposit

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### deposit

```solidity
function deposit(uint256 amount) external nonpayable
```

Deposit Magic tokens

#### Parameters

| Name   | Type    | Description         |
| ------ | ------- | ------------------- |
| amount | uint256 | The amount of Magic |

### depositFor

```solidity
function depositFor(uint256 amount, address to) external nonpayable
```

Deposit Magic tokens

#### Parameters

| Name   | Type    | Description                    |
| ------ | ------- | ------------------------------ |
| amount | uint256 | The amount of Magic            |
| to     | address | The address to receive prMagic |

### getConfig

```solidity
function getConfig() external view returns (uint256, address, address)
```

VIEW FUNCTIONS

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |
| \_1  | address | undefined   |
| \_2  | address | undefined   |

### getUserDepositedMagic

```solidity
function getUserDepositedMagic(uint256 atlasDepositId, address user) external view returns (uint256)
```

Return the Magic token amount of the user deposited in a specific epoch

#### Parameters

| Name           | Type    | Description          |
| -------------- | ------- | -------------------- |
| atlasDepositId | uint256 | The index of deposit |
| user           | address | Address of user      |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### harvestForNextDeposit

```solidity
function harvestForNextDeposit() external view returns (uint256)
```

// Accumulated magic through harvest that is going to be recompounded on the next atlasDeposit

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### initialize

```solidity
function initialize(address _magic, address _prMagic, address _atlasMine, address _treasure, address _legion, address _lendAuction) external nonpayable
```

#### Parameters

| Name          | Type    | Description |
| ------------- | ------- | ----------- |
| \_magic       | address | undefined   |
| \_prMagic     | address | undefined   |
| \_atlasMine   | address | undefined   |
| \_treasure    | address | undefined   |
| \_legion      | address | undefined   |
| \_lendAuction | address | undefined   |

### legion

```solidity
function legion() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### lendAuction

```solidity
function lendAuction() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### magic

```solidity
function magic() external view returns (contract IERC20Upgradeable)
```

Address of Magic token

#### Returns

| Name | Type                       | Description |
| ---- | -------------------------- | ----------- |
| \_0  | contract IERC20Upgradeable | undefined   |

### onERC1155Received

```solidity
function onERC1155Received(address, address, uint256, uint256, bytes) external pure returns (bytes4)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |
| \_1  | address | undefined   |
| \_2  | uint256 | undefined   |
| \_3  | uint256 | undefined   |
| \_4  | bytes   | undefined   |

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | bytes4 | undefined   |

### onERC721Received

```solidity
function onERC721Received(address, address, uint256, bytes) external pure returns (bytes4)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |
| \_1  | address | undefined   |
| \_2  | uint256 | undefined   |
| \_3  | bytes   | undefined   |

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | bytes4 | undefined   |

### owner

```solidity
function owner() external view returns (address)
```

_Returns the address of the current owner._

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### prMagic

```solidity
function prMagic() external view returns (contract IPrMagicToken)
```

Address of prMagic token(similar to cvxCRV)

#### Returns

| Name | Type                   | Description |
| ---- | ---------------------- | ----------- |
| \_0  | contract IPrMagicToken | undefined   |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```

_Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner._

### setAtlasMine

```solidity
function setAtlasMine(address _atlasMine) external nonpayable
```

setting atlasmine contract

#### Parameters

| Name        | Type    | Description                |
| ----------- | ------- | -------------------------- |
| \_atlasMine | address | atlasmine contract address |

### setConfig

```solidity
function setConfig(uint256 _stakeRewardSplit, address _treasury, address _staking) external nonpayable
```

ACCESS-CONTROLLED FUNCTIONS

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| \_stakeRewardSplit | uint256 | undefined   |
| \_treasury         | address | undefined   |
| \_staking          | address | undefined   |

### setLegion

```solidity
function setLegion(address _legion) external nonpayable
```

setting legion contract

#### Parameters

| Name     | Type    | Description             |
| -------- | ------- | ----------------------- |
| \_legion | address | legion contract address |

### setLendAuction

```solidity
function setLendAuction(address _lendAuction) external nonpayable
```

setting LendingAuction contract

#### Parameters

| Name          | Type    | Description                     |
| ------------- | ------- | ------------------------------- |
| \_lendAuction | address | LendingAuction contract address |

### setTreasure

```solidity
function setTreasure(address _treasure) external nonpayable
```

setting treasure contract

#### Parameters

| Name       | Type    | Description               |
| ---------- | ------- | ------------------------- |
| \_treasure | address | treasure contract address |

### stakeLegion

```solidity
function stakeLegion(uint256 tokenId) external nonpayable
```

staking legion nft in atlasmine

#### Parameters

| Name    | Type    | Description         |
| ------- | ------- | ------------------- |
| tokenId | uint256 | legion nft token id |

### stakeTreasure

```solidity
function stakeTreasure(uint256 tokenId, uint256 amount) external nonpayable
```

staking treasure nft in atlasmine for boosting rewards

#### Parameters

| Name    | Type    | Description       |
| ------- | ------- | ----------------- |
| tokenId | uint256 | treasure token id |
| amount  | uint256 | amount of tokenId |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

_Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

### treasure

```solidity
function treasure() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### unStakeLegion

```solidity
function unStakeLegion(uint256 tokenId) external nonpayable
```

unstaking legion nft from atlasmine

#### Parameters

| Name    | Type    | Description         |
| ------- | ------- | ------------------- |
| tokenId | uint256 | legion nft token id |

### unStakeTreasure

```solidity
function unStakeTreasure(uint256 tokenId, uint256 amount) external nonpayable
```

unstaking treasure nft in atlasmine

#### Parameters

| Name    | Type    | Description       |
| ------- | ------- | ----------------- |
| tokenId | uint256 | treasure token id |
| amount  | uint256 | amount of tokenId |

### update

```solidity
function update() external nonpayable
```

Withdraw unlocked deposit, Harvest rewards for all deposits, Disperse rewards

### withdrawAndHarvestAll

```solidity
function withdrawAndHarvestAll() external nonpayable
```

Withdraw and harvest all deposit and keep in the contract

### withdrawERC1155

```solidity
function withdrawERC1155(address nft, address to, uint256 tokenId, uint256 amount) external nonpayable
```

withdrawing any erc1155 nfts

#### Parameters

| Name    | Type    | Description                     |
| ------- | ------- | ------------------------------- |
| nft     | address | nft token address               |
| to      | address | transfering nft to `to` address |
| tokenId | uint256 | nft token id                    |
| amount  | uint256 | amount of tokenId               |

### withdrawERC721

```solidity
function withdrawERC721(address nft, address to, uint256 tokenId) external nonpayable
```

withdrawing any erc721 nft

#### Parameters

| Name    | Type    | Description                     |
| ------- | ------- | ------------------------------- |
| nft     | address | nft token address               |
| to      | address | transfering nft to `to` address |
| tokenId | uint256 | nft token id                    |

## Events

### ActivateDeposit

```solidity
event ActivateDeposit(uint256 indexed atlasDepositIndex, uint256 depositAmount, uint256 accumulatedMagic)
```

Event for activating a deposit

#### Parameters

| Name                        | Type    | Description                                          |
| --------------------------- | ------- | ---------------------------------------------------- |
| atlasDepositIndex `indexed` | uint256 | Index of the deposit                                 |
| depositAmount               | uint256 | The amount of Magic token deposited into AtlasMine   |
| accumulatedMagic            | uint256 | The amount of Magic token deposited during the epoch |

### AtlasMineChanged

```solidity
event AtlasMineChanged(address atlasMine)
```

Event for setting atlasmine contract

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| atlasMine | address | undefined   |

### ClaimMintedShares

```solidity
event ClaimMintedShares(address indexed user, uint256 indexed atlasDepositIndex, uint256 claim)
```

Event for claiming prMagic for activated deposits

#### Parameters

| Name                        | Type    | Description                      |
| --------------------------- | ------- | -------------------------------- |
| user `indexed`              | address | Address of user claiming prMagic |
| atlasDepositIndex `indexed` | uint256 | Activated deposit index          |
| claim                       | uint256 | Amount of prMagic                |

### DepositFor

```solidity
event DepositFor(address indexed from, address indexed to, uint256 indexed atlasDepositIndex, uint256 amount)
```

Event for depositing Magic tokens

#### Parameters

| Name                        | Type    | Description                                  |
| --------------------------- | ------- | -------------------------------------------- |
| from `indexed`              | address | Address of user that deposits Magic tokens   |
| to `indexed`                | address | Address of user that receives prMagic tokens |
| atlasDepositIndex `indexed` | uint256 | undefined                                    |
| amount                      | uint256 | Amount of deposit                            |

### LegionChanged

```solidity
event LegionChanged(address legion)
```

Event for setting legion contract

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| legion | address | undefined   |

### LendAuctionChanged

```solidity
event LendAuctionChanged(address lendAuction)
```

Event for setting lendAuction contract

#### Parameters

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| lendAuction | address | undefined   |

### NftWithdrawn

```solidity
event NftWithdrawn(address nft, address to, uint256 tokenId, uint256 amount)
```

Event for withdrawing nft tokens

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| nft     | address | undefined   |
| to      | address | undefined   |
| tokenId | uint256 | undefined   |
| amount  | uint256 | undefined   |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

### RewardsEarmarked

```solidity
event RewardsEarmarked(address indexed user, uint256 treasuryReward, uint256 stakingReward)
```

Event for dispersing rewards to the staking and treasury

#### Parameters

| Name           | Type    | Description                                 |
| -------------- | ------- | ------------------------------------------- |
| user `indexed` | address | Address of user that trigger the dispersing |
| treasuryReward | uint256 | The amount of Magic tokens for the treasury |
| stakingReward  | uint256 | The amount of Magic tokens for the staking  |

### TreasureChanged

```solidity
event TreasureChanged(address treasure)
```

Event for setting treasure contract

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| treasure | address | undefined   |

### UpdatedConfiguration

```solidity
event UpdatedConfiguration(uint256 stakeRewardSplit, address treasury, address staking)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| stakeRewardSplit | uint256 | undefined   |
| treasury         | address | undefined   |
| staking          | address | undefined   |
