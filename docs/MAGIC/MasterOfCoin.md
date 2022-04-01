# MasterOfCoin

## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | bytes32 | undefined   |

### MASTER_OF_COIN_ADMIN_ROLE

```solidity
function MASTER_OF_COIN_ADMIN_ROLE() external view returns (bytes32)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | bytes32 | undefined   |

### addStream

```solidity
function addStream(address _stream, uint256 _totalRewards, uint256 _startTimestamp, uint256 _endTimestamp, bool _callback) external nonpayable
```

#### Parameters

| Name             | Type    | Description                                                |
| ---------------- | ------- | ---------------------------------------------------------- |
| \_stream         | address | address of the contract that gets rewards                  |
| \_totalRewards   | uint256 | amount of MAGIC that should be distributed in total        |
| \_startTimestamp | uint256 | when MAGIC stream should start                             |
| \_endTimestamp   | uint256 | when MAGIC stream should end                               |
| \_callback       | bool    | should callback be used (if you don&#39;t know, set false) |

### callbackRegistry

```solidity
function callbackRegistry(address) external view returns (bool)
```

stream address =&gt; bool

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### defundStream

```solidity
function defundStream(address _stream, uint256 _amount) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |
| \_amount | uint256 | undefined   |

### fundStream

```solidity
function fundStream(address _stream, uint256 _amount) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |
| \_amount | uint256 | undefined   |

### getGlobalRatePerSecond

```solidity
function getGlobalRatePerSecond() external view returns (uint256 globalRatePerSecond)
```

#### Returns

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| globalRatePerSecond | uint256 | undefined   |

### getPendingRewards

```solidity
function getPendingRewards(address _stream) external view returns (uint256 pendingRewards)
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |

#### Returns

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| pendingRewards | uint256 | undefined   |

### getRatePerSecond

```solidity
function getRatePerSecond(address _stream) external view returns (uint256 ratePerSecond)
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |

#### Returns

| Name          | Type    | Description |
| ------------- | ------- | ----------- |
| ratePerSecond | uint256 | undefined   |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```

_Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {\_setRoleAdmin}._

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| role | bytes32 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | bytes32 | undefined   |

### getRoleMember

```solidity
function getRoleMember(bytes32 role, uint256 index) external view returns (address)
```

_Returns one of the accounts that have `role`. `index` must be a value between 0 and {getRoleMemberCount}, non-inclusive. Role bearers are not sorted in any particular way, and their ordering may change at any point. WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure you perform all queries on the same block. See the following https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post] for more information._

#### Parameters

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| role  | bytes32 | undefined   |
| index | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### getRoleMemberCount

```solidity
function getRoleMemberCount(bytes32 role) external view returns (uint256)
```

_Returns the number of accounts that have `role`. Can be used together with {getRoleMember} to enumerate all bearers of a role._

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| role | bytes32 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### getStreamConfig

```solidity
function getStreamConfig(address _stream) external view returns (struct IMasterOfCoin.CoinStream)
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |

#### Returns

| Name | Type                     | Description |
| ---- | ------------------------ | ----------- |
| \_0  | IMasterOfCoin.CoinStream | undefined   |

### getStreams

```solidity
function getStreams() external view returns (address[])
```

#### Returns

| Name | Type      | Description |
| ---- | --------- | ----------- |
| \_0  | address[] | undefined   |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```

_Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have `role`&#39;s admin role._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| role    | bytes32 | undefined   |
| account | address | undefined   |

### grantTokenToStream

```solidity
function grantTokenToStream(address _stream, uint256 _amount) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |
| \_amount | uint256 | undefined   |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```

_Returns `true` if `account` has been granted `role`._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| role    | bytes32 | undefined   |
| account | address | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### init

```solidity
function init(address _magic) external nonpayable
```

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| \_magic | address | undefined   |

### magic

```solidity
function magic() external view returns (contract IERC20Upgradeable)
```

#### Returns

| Name | Type                       | Description |
| ---- | -------------------------- | ----------- |
| \_0  | contract IERC20Upgradeable | undefined   |

### removeStream

```solidity
function removeStream(address _stream) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```

_Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been revoked `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| role    | bytes32 | undefined   |
| account | address | undefined   |

### requestRewards

```solidity
function requestRewards() external nonpayable returns (uint256 rewardsPaid)
```

#### Returns

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| rewardsPaid | uint256 | undefined   |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```

_Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have `role`&#39;s admin role._

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| role    | bytes32 | undefined   |
| account | address | undefined   |

### setCallback

```solidity
function setCallback(address _stream, bool _value) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |
| \_value  | bool    | undefined   |

### setMagicToken

```solidity
function setMagicToken(address _magic) external nonpayable
```

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| \_magic | address | undefined   |

### streamConfig

```solidity
function streamConfig(address) external view returns (uint256 totalRewards, uint256 startTimestamp, uint256 endTimestamp, uint256 lastRewardTimestamp, uint256 ratePerSecond, uint256 paid)
```

stream address =&gt; CoinStream

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

#### Returns

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| totalRewards        | uint256 | undefined   |
| startTimestamp      | uint256 | undefined   |
| endTimestamp        | uint256 | undefined   |
| lastRewardTimestamp | uint256 | undefined   |
| ratePerSecond       | uint256 | undefined   |
| paid                | uint256 | undefined   |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```

_See {IERC165-supportsInterface}._

#### Parameters

| Name        | Type   | Description |
| ----------- | ------ | ----------- |
| interfaceId | bytes4 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### updateStreamTime

```solidity
function updateStreamTime(address _stream, uint256 _startTimestamp, uint256 _endTimestamp) external nonpayable
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| \_stream         | address | undefined   |
| \_startTimestamp | uint256 | undefined   |
| \_endTimestamp   | uint256 | undefined   |

### withdrawMagic

```solidity
function withdrawMagic(address _to, uint256 _amount) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_to     | address | undefined   |
| \_amount | uint256 | undefined   |

## Events

### CallbackSet

```solidity
event CallbackSet(address stream, bool value)
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| stream | address | undefined   |
| value  | bool    | undefined   |

### RewardsPaid

```solidity
event RewardsPaid(address indexed stream, uint256 rewardsPaid, uint256 rewardsPaidInTotal)
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| stream `indexed`   | address | undefined   |
| rewardsPaid        | uint256 | undefined   |
| rewardsPaidInTotal | uint256 | undefined   |

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```

#### Parameters

| Name                        | Type    | Description |
| --------------------------- | ------- | ----------- |
| role `indexed`              | bytes32 | undefined   |
| previousAdminRole `indexed` | bytes32 | undefined   |
| newAdminRole `indexed`      | bytes32 | undefined   |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| role `indexed`    | bytes32 | undefined   |
| account `indexed` | address | undefined   |
| sender `indexed`  | address | undefined   |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```

#### Parameters

| Name              | Type    | Description |
| ----------------- | ------- | ----------- |
| role `indexed`    | bytes32 | undefined   |
| account `indexed` | address | undefined   |
| sender `indexed`  | address | undefined   |

### StreamAdded

```solidity
event StreamAdded(address indexed stream, uint256 amount, uint256 startTimestamp, uint256 endTimestamp)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| stream `indexed` | address | undefined   |
| amount           | uint256 | undefined   |
| startTimestamp   | uint256 | undefined   |
| endTimestamp     | uint256 | undefined   |

### StreamDefunded

```solidity
event StreamDefunded(address indexed stream, uint256 amount)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| stream `indexed` | address | undefined   |
| amount           | uint256 | undefined   |

### StreamFunded

```solidity
event StreamFunded(address indexed stream, uint256 amount)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| stream `indexed` | address | undefined   |
| amount           | uint256 | undefined   |

### StreamGrant

```solidity
event StreamGrant(address indexed stream, address from, uint256 amount)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| stream `indexed` | address | undefined   |
| from             | address | undefined   |
| amount           | uint256 | undefined   |

### StreamRemoved

```solidity
event StreamRemoved(address indexed stream)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| stream `indexed` | address | undefined   |

### StreamTimeUpdated

```solidity
event StreamTimeUpdated(address indexed stream, uint256 startTimestamp, uint256 endTimestamp)
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| stream `indexed` | address | undefined   |
| startTimestamp   | uint256 | undefined   |
| endTimestamp     | uint256 | undefined   |

### Withdraw

```solidity
event Withdraw(address to, uint256 amount)
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| to     | address | undefined   |
| amount | uint256 | undefined   |
