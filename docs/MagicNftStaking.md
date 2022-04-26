# MagicNftStaking

> MagicNftStaking

nft staking by magicDepositor for boosting rewards

## Methods

### atlasMine

```solidity
function atlasMine() external view returns (contract IAtlasMine)
```

#### Returns

| Name | Type                | Description |
| ---- | ------------------- | ----------- |
| \_0  | contract IAtlasMine | undefined   |

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

### AtlasMineChanged

```solidity
event AtlasMineChanged(address atlasMine)
```

Event for setting atlasmine contract

#### Parameters

| Name      | Type    | Description                   |
| --------- | ------- | ----------------------------- |
| atlasMine | address | Address of atlasmine contract |

### LegionChanged

```solidity
event LegionChanged(address legion)
```

Event for setting legion contract

#### Parameters

| Name   | Type    | Description                |
| ------ | ------- | -------------------------- |
| legion | address | Address of legion contract |

### LendAuctionChanged

```solidity
event LendAuctionChanged(address lendAuction)
```

Event for setting lendAuction contract

#### Parameters

| Name        | Type    | Description                     |
| ----------- | ------- | ------------------------------- |
| lendAuction | address | Address of lendAuction contract |

### NftWithdrawn

```solidity
event NftWithdrawn(address nft, address to, uint256 tokenId, uint256 amount)
```

Event for withdrawing nft tokens

#### Parameters

| Name    | Type    | Description                             |
| ------- | ------- | --------------------------------------- |
| nft     | address | Address of nft token                    |
| to      | address | Address of user that receives nft token |
| tokenId | uint256 | nft token id                            |
| amount  | uint256 | Amount of nft token                     |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

### TreasureChanged

```solidity
event TreasureChanged(address treasure)
```

Event for setting treasure contract

#### Parameters

| Name     | Type    | Description                  |
| -------- | ------- | ---------------------------- |
| treasure | address | Address of treasure contract |
