# LendingAuctionNft

> LendingAuctionNft

nft lending auction for boosting rewards by staking to magicDepositor

## Methods

### TOTAL_LEGIONS

```solidity
function TOTAL_LEGIONS() external view returns (uint8)
```

#### Returns

| Name | Type  | Description |
| ---- | ----- | ----------- |
| \_0  | uint8 | undefined   |

### TOTAL_TREASURES

```solidity
function TOTAL_TREASURES() external view returns (uint8)
```

#### Returns

| Name | Type  | Description |
| ---- | ----- | ----------- |
| \_0  | uint8 | undefined   |

### atlasmine

```solidity
function atlasmine() external view returns (contract IAtlasMine)
```

#### Returns

| Name | Type                | Description |
| ---- | ------------------- | ----------- |
| \_0  | contract IAtlasMine | undefined   |

### depositLegion

```solidity
function depositLegion(uint256 tokenId) external nonpayable
```

depositing legion nft

#### Parameters

| Name    | Type    | Description    |
| ------- | ------- | -------------- |
| tokenId | uint256 | legion tokenId |

### depositTreasures

```solidity
function depositTreasures(uint256 tokenId, uint256 amount) external nonpayable
```

depositing Treasures nft

#### Parameters

| Name    | Type    | Description      |
| ------- | ------- | ---------------- |
| tokenId | uint256 | Treasure tokenId |
| amount  | uint256 | Treasure amount  |

### getLegionUserBoosts

```solidity
function getLegionUserBoosts() external view returns (struct LendingAuctionNft.UserBoost[], struct LendingAuctionNft.UserBoost[])
```

getting all userBoosts present in legionMainPool and legionReservePool

#### Returns

| Name | Type                          | Description |
| ---- | ----------------------------- | ----------- |
| \_0  | LendingAuctionNft.UserBoost[] | undefined   |
| \_1  | LendingAuctionNft.UserBoost[] | undefined   |

### getTreasureUserBoosts

```solidity
function getTreasureUserBoosts() external view returns (struct LendingAuctionNft.UserBoost[], struct LendingAuctionNft.UserBoost[])
```

getting all userBoosts present in treasureMainPool and treasureReservePool

#### Returns

| Name | Type                          | Description |
| ---- | ----------------------------- | ----------- |
| \_0  | LendingAuctionNft.UserBoost[] | undefined   |
| \_1  | LendingAuctionNft.UserBoost[] | undefined   |

### getUserIndexTreasureBoosts

```solidity
function getUserIndexTreasureBoosts(address user, uint256 tokenId, uint256 amount) external view returns (uint256[])
```

getting all treasure userBoosts indexes array

#### Parameters

| Name    | Type    | Description              |
| ------- | ------- | ------------------------ |
| user    | address | address of user          |
| tokenId | uint256 | legion tokenId           |
| amount  | uint256 | amount of treasure token |

#### Returns

| Name | Type      | Description |
| ---- | --------- | ----------- |
| \_0  | uint256[] | undefined   |

### getUserLegionData

```solidity
function getUserLegionData(address user, uint256 tokenId) external view returns (struct LendingAuctionNft.UserBoost)
```

getting all tokenIds present in legionMainPool and legionReservePool

#### Parameters

| Name    | Type    | Description     |
| ------- | ------- | --------------- |
| user    | address | address of user |
| tokenId | uint256 | legion tokenId  |

#### Returns

| Name | Type                        | Description |
| ---- | --------------------------- | ----------- |
| \_0  | LendingAuctionNft.UserBoost | undefined   |

### getUserTreasureData

```solidity
function getUserTreasureData(enum LendingAuctionNft.WhichPool whichPool, uint256 index) external view returns (struct LendingAuctionNft.UserBoost)
```

getting user treasure data at index

#### Parameters

| Name      | Type                             | Description                                          |
| --------- | -------------------------------- | ---------------------------------------------------- |
| whichPool | enum LendingAuctionNft.WhichPool | whichPool : TreasureMainPool and TreasureReservePool |
| index     | uint256                          | array index                                          |

#### Returns

| Name | Type                        | Description |
| ---- | --------------------------- | ----------- |
| \_0  | LendingAuctionNft.UserBoost | undefined   |

### initialize

```solidity
function initialize(address _treasure, address _legion, address _atlasMine) external nonpayable
```

#### Parameters

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| \_treasure  | address | undefined   |
| \_legion    | address | undefined   |
| \_atlasMine | address | undefined   |

### legion

```solidity
function legion() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### legionPoolTokenIds

```solidity
function legionPoolTokenIds(enum LendingAuctionNft.WhichPool whichPool) external view returns (uint256[])
```

getting all tokenIds present in legionMainPool and legionReservePool

#### Parameters

| Name      | Type                             | Description                                      |
| --------- | -------------------------------- | ------------------------------------------------ |
| whichPool | enum LendingAuctionNft.WhichPool | whichPool : LegionMainPool and LegionReservePool |

#### Returns

| Name | Type      | Description |
| ---- | --------- | ----------- |
| \_0  | uint256[] | undefined   |

### magicDepositor

```solidity
function magicDepositor() external view returns (contract IMagicNftDepositor)
```

#### Returns

| Name | Type                        | Description |
| ---- | --------------------------- | ----------- |
| \_0  | contract IMagicNftDepositor | undefined   |

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

### preciousChef

```solidity
function preciousChef() external view returns (contract IPreciousChef)
```

#### Returns

| Name | Type                   | Description |
| ---- | ---------------------- | ----------- |
| \_0  | contract IPreciousChef | undefined   |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```

_Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner._

### setMagicDepositor

```solidity
function setMagicDepositor(address _magicDepositor) external nonpayable
```

setting magicDepositor contract

#### Parameters

| Name             | Type    | Description                     |
| ---------------- | ------- | ------------------------------- |
| \_magicDepositor | address | magicDepositor contract address |

### setPreciousChef

```solidity
function setPreciousChef(address _preciousChef) external nonpayable
```

Set PreciousChef address

#### Parameters

| Name           | Type    | Description                   |
| -------------- | ------- | ----------------------------- |
| \_preciousChef | address | PreciousChef contract address |

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

### treasureInPool

```solidity
function treasureInPool(enum LendingAuctionNft.WhichPool whichPool) external view returns (uint256)
```

getting all deposits in TreasureMainPool/TreasureReservePool

#### Parameters

| Name      | Type                             | Description                                          |
| --------- | -------------------------------- | ---------------------------------------------------- |
| whichPool | enum LendingAuctionNft.WhichPool | whichPool : TreasureMainPool and TreasureReservePool |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### withdrawLegion

```solidity
function withdrawLegion(uint256 tokenId) external nonpayable
```

Withdrawing legion nft

#### Parameters

| Name    | Type    | Description    |
| ------- | ------- | -------------- |
| tokenId | uint256 | legion tokenId |

### withdrawTreasure

```solidity
function withdrawTreasure(uint256 tokenId, uint256 amount) external nonpayable
```

withdrawing Treasures nft

#### Parameters

| Name    | Type    | Description      |
| ------- | ------- | ---------------- |
| tokenId | uint256 | Treasure tokenId |
| amount  | uint256 | Treasure amount  |

## Events

### Deposit

```solidity
event Deposit(address nft, uint256 tokenId, uint256 amount)
```

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| nft     | address | undefined   |
| tokenId | uint256 | undefined   |
| amount  | uint256 | undefined   |

### MagicDepositorChanged

```solidity
event MagicDepositorChanged(address magicDepositor)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| magicDepositor | address | undefined   |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

### SetPreciousChef

```solidity
event SetPreciousChef(address preciousChef)
```

#### Parameters

| Name         | Type    | Description |
| ------------ | ------- | ----------- |
| preciousChef | address | undefined   |

### Withdrawn

```solidity
event Withdrawn(address nft, uint256 tokenId, uint256 amount)
```

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| nft     | address | undefined   |
| tokenId | uint256 | undefined   |
| amount  | uint256 | undefined   |
