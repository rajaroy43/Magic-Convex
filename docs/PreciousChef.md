# PreciousChef

> PreciousChef

Give PRECIOUS incentives to the Magic NFT lenders

_There would be 4 pools initially pid 0: Legion Main Pool pid 1: Legion Reserve Pool pid 2: Treasure Main Pool pid 3: Treasure Reserve Pool deposit/withdraw functions are only callable my the LendAuction contract_

## Methods

### addPool

```solidity
function addPool(uint256 allocPoint) external nonpayable
```

Add a new pool. Can only be called by the owner.

#### Parameters

| Name       | Type    | Description         |
| ---------- | ------- | ------------------- |
| allocPoint | uint256 | AP of the new pool. |

### deposit

```solidity
function deposit(uint256 pid, uint256 nftBoost, address to) external nonpayable
```

Deposit nftBoost to the pool for PRECIOUS allocation. Can only be called by the lendAuction contract

_The LendAuction contract calls this function_

#### Parameters

| Name     | Type    | Description                                |
| -------- | ------- | ------------------------------------------ |
| pid      | uint256 | The index of the pool. See `poolInfo`.     |
| nftBoost | uint256 | boost of nft to deposit.                   |
| to       | address | The user that receives `nftBoost` deposit. |

### harvest

```solidity
function harvest(uint256 pid, address to) external nonpayable
```

Harvest proceeds for transaction sender to `to`.

#### Parameters

| Name | Type    | Description                            |
| ---- | ------- | -------------------------------------- |
| pid  | uint256 | The index of the pool. See `poolInfo`. |
| to   | address | Receiver of PRECIOUS rewards.          |

### initialize

```solidity
function initialize(address _precious, uint256 _preciousPerBlock, address _lendAuction) external nonpayable
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| \_precious         | address | undefined   |
| \_preciousPerBlock | uint256 | undefined   |
| \_lendAuction      | address | undefined   |

### lendAuction

```solidity
function lendAuction() external view returns (address)
```

Address of LendAuction contract.

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### massUpdatePools

```solidity
function massUpdatePools(uint256[] pids) external nonpayable
```

Update reward variables for all pools. Be careful of gas spending!

#### Parameters

| Name | Type      | Description                                                          |
| ---- | --------- | -------------------------------------------------------------------- |
| pids | uint256[] | Pool IDs of all to be updated. Make sure to update all active pools. |

### owner

```solidity
function owner() external view returns (address)
```

_Returns the address of the current owner._

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### pendingPrecious

```solidity
function pendingPrecious(uint256 _pid, address _user) external view returns (uint256 pending)
```

View function to see pending PRECIOUS.

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| \_pid  | uint256 | The index of the pool. See `poolInfo`. |
| \_user | address | Address of user.                       |

#### Returns

| Name    | Type    | Description                       |
| ------- | ------- | --------------------------------- |
| pending | uint256 | PRECIOUS reward for a given user. |

### poolInfo

```solidity
function poolInfo(uint256) external view returns (uint128 accPreciousPerBoost, uint64 lastRewardBlock, uint64 allocPoint, uint256 boostSupply)
```

Info of each pool.

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

#### Returns

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| accPreciousPerBoost | uint128 | undefined   |
| lastRewardBlock     | uint64  | undefined   |
| allocPoint          | uint64  | undefined   |
| boostSupply         | uint256 | undefined   |

### poolLength

```solidity
function poolLength() external view returns (uint256 pools)
```

Returns the number of pools.

#### Returns

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| pools | uint256 | undefined   |

### precious

```solidity
function precious() external view returns (contract IERC20Upgradeable)
```

Address of PRECIOUS contract.

#### Returns

| Name | Type                       | Description |
| ---- | -------------------------- | ----------- |
| \_0  | contract IERC20Upgradeable | undefined   |

### preciousPerBlock

```solidity
function preciousPerBlock() external view returns (uint256)
```

PRECIOUS reward amount per block

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```

_Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner._

### set

```solidity
function set(uint256 pid, uint256 allocPoint, bool withUpdate) external nonpayable
```

Update the given pool&#39;s allocation point. Can only be called by the owner.

#### Parameters

| Name       | Type    | Description                            |
| ---------- | ------- | -------------------------------------- |
| pid        | uint256 | The index of the pool. See `poolInfo`. |
| allocPoint | uint256 | New AP of the pool.                    |
| withUpdate | bool    | Call `updatePool` fcn first if true.   |

### totalAllocPoint

```solidity
function totalAllocPoint() external view returns (uint256)
```

Total allocation points. Must be the sum of all allocation points in all pools.

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

_Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

### updatePool

```solidity
function updatePool(uint256 pid) external nonpayable returns (struct PreciousChef.PoolInfo pool)
```

Update reward variables of the given pool.

#### Parameters

| Name | Type    | Description                            |
| ---- | ------- | -------------------------------------- |
| pid  | uint256 | The index of the pool. See `poolInfo`. |

#### Returns

| Name | Type                  | Description                        |
| ---- | --------------------- | ---------------------------------- |
| pool | PreciousChef.PoolInfo | Returns the pool that was updated. |

### userInfo

```solidity
function userInfo(uint256, address) external view returns (uint256 boost, int256 rewardDebt)
```

Info of each user.

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |
| \_1  | address | undefined   |

#### Returns

| Name       | Type    | Description |
| ---------- | ------- | ----------- |
| boost      | uint256 | undefined   |
| rewardDebt | int256  | undefined   |

### withdraw

```solidity
function withdraw(uint256 pid, uint256 nftBoost, address from) external nonpayable
```

Withdraw nftBoost from the pool. Can only be called by the lendAuction contract

_The LendAuction contract calls this function_

#### Parameters

| Name     | Type    | Description                            |
| -------- | ------- | -------------------------------------- |
| pid      | uint256 | The index of the pool. See `poolInfo`. |
| nftBoost | uint256 | boost of nft to withdraw.              |
| from     | address | The user that lose the `nftBoost`      |

## Events

### AddPool

```solidity
event AddPool(uint256 indexed pid, uint256 allocPoint)
```

#### Parameters

| Name          | Type    | Description |
| ------------- | ------- | ----------- |
| pid `indexed` | uint256 | undefined   |
| allocPoint    | uint256 | undefined   |

### Deposit

```solidity
event Deposit(uint256 indexed pid, address indexed user, uint256 boost)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| pid `indexed`  | uint256 | undefined   |
| user `indexed` | address | undefined   |
| boost          | uint256 | undefined   |

### Harvest

```solidity
event Harvest(uint256 indexed pid, address indexed from, address to, uint256 amount)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| pid `indexed`  | uint256 | undefined   |
| from `indexed` | address | undefined   |
| to             | address | undefined   |
| amount         | uint256 | undefined   |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

### SetPool

```solidity
event SetPool(uint256 indexed pid, uint256 allocPoint)
```

#### Parameters

| Name          | Type    | Description |
| ------------- | ------- | ----------- |
| pid `indexed` | uint256 | undefined   |
| allocPoint    | uint256 | undefined   |

### UpdatePool

```solidity
event UpdatePool(uint256 indexed pid, uint256 accPreciousPerBoost)
```

#### Parameters

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| pid `indexed`       | uint256 | undefined   |
| accPreciousPerBoost | uint256 | undefined   |

### Withdraw

```solidity
event Withdraw(uint256 indexed pid, address indexed user, uint256 boost)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| pid `indexed`  | uint256 | undefined   |
| user `indexed` | address | undefined   |
| boost          | uint256 | undefined   |
