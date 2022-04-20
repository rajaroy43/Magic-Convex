# MagicDepositorConfig

## Methods

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

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```

_Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner._

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| newOwner | address | undefined   |

## Events

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```

#### Parameters

| Name                    | Type    | Description |
| ----------------------- | ------- | ----------- |
| previousOwner `indexed` | address | undefined   |
| newOwner `indexed`      | address | undefined   |

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
