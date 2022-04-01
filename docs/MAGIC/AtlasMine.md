# AtlasMine

## Methods

### ATLAS_MINE_ADMIN_ROLE

```solidity
function ATLAS_MINE_ADMIN_ROLE() external view returns (bytes32)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | bytes32 | undefined   |

### DAY

```solidity
function DAY() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | bytes32 | undefined   |

### ONE

```solidity
function ONE() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### ONE_MONTH

```solidity
function ONE_MONTH() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### ONE_WEEK

```solidity
function ONE_WEEK() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### SIX_MONTHS

```solidity
function SIX_MONTHS() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### THREE_MONTHS

```solidity
function THREE_MONTHS() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### TWELVE_MONTHS

```solidity
function TWELVE_MONTHS() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### TWO_WEEKS

```solidity
function TWO_WEEKS() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### accMagicPerShare

```solidity
function accMagicPerShare() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### addExcludedAddress

```solidity
function addExcludedAddress(address _exclude) external nonpayable
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_exclude | address | undefined   |

### boosts

```solidity
function boosts(address) external view returns (uint256)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### calcualteVestedPrincipal

```solidity
function calcualteVestedPrincipal(address _user, uint256 _depositId) external view returns (uint256 amount)
```

#### Parameters

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| \_user      | address | undefined   |
| \_depositId | uint256 | undefined   |

#### Returns

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| amount | uint256 | undefined   |

### currentId

```solidity
function currentId(address) external view returns (uint256)
```

user =&gt; deposit index

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### deposit

```solidity
function deposit(uint256 _amount, enum AtlasMine.Lock _lock) external nonpayable
```

#### Parameters

| Name     | Type                | Description |
| -------- | ------------------- | ----------- |
| \_amount | uint256             | undefined   |
| \_lock   | enum AtlasMine.Lock | undefined   |

### getAllUserDepositIds

```solidity
function getAllUserDepositIds(address _user) external view returns (uint256[])
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| \_user | address | undefined   |

#### Returns

| Name | Type      | Description |
| ---- | --------- | ----------- |
| \_0  | uint256[] | undefined   |

### getExcludedAddresses

```solidity
function getExcludedAddresses() external view returns (address[])
```

#### Returns

| Name | Type      | Description |
| ---- | --------- | ----------- |
| \_0  | address[] | undefined   |

### getLegionBoost

```solidity
function getLegionBoost(uint256 _legionGeneration, uint256 _legionRarity) external view returns (uint256)
```

#### Parameters

| Name               | Type    | Description |
| ------------------ | ------- | ----------- |
| \_legionGeneration | uint256 | undefined   |
| \_legionRarity     | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### getLegionBoostMatrix

```solidity
function getLegionBoostMatrix() external view returns (uint256[][])
```

#### Returns

| Name | Type        | Description |
| ---- | ----------- | ----------- |
| \_0  | uint256[][] | undefined   |

### getLockBoost

```solidity
function getLockBoost(enum AtlasMine.Lock _lock) external pure returns (uint256 boost, uint256 timelock)
```

#### Parameters

| Name   | Type                | Description |
| ------ | ------------------- | ----------- |
| \_lock | enum AtlasMine.Lock | undefined   |

#### Returns

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| boost    | uint256 | undefined   |
| timelock | uint256 | undefined   |

### getNftBoost

```solidity
function getNftBoost(address _nft, uint256 _tokenId, uint256 _amount) external view returns (uint256)
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_nft     | address | undefined   |
| \_tokenId | uint256 | undefined   |
| \_amount  | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### getRealMagicReward

```solidity
function getRealMagicReward(uint256 _magicReward) external view returns (uint256 distributedRewards, uint256 undistributedRewards)
```

#### Parameters

| Name          | Type    | Description |
| ------------- | ------- | ----------- |
| \_magicReward | uint256 | undefined   |

#### Returns

| Name                 | Type    | Description |
| -------------------- | ------- | ----------- |
| distributedRewards   | uint256 | undefined   |
| undistributedRewards | uint256 | undefined   |

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

### getStakedLegions

```solidity
function getStakedLegions(address _user) external view returns (uint256[])
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| \_user | address | undefined   |

#### Returns

| Name | Type      | Description |
| ---- | --------- | ----------- |
| \_0  | uint256[] | undefined   |

### getTreasureBoost

```solidity
function getTreasureBoost(uint256 _tokenId, uint256 _amount) external pure returns (uint256 boost)
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |
| \_amount  | uint256 | undefined   |

#### Returns

| Name  | Type    | Description |
| ----- | ------- | ----------- |
| boost | uint256 | undefined   |

### getUserBoost

```solidity
function getUserBoost(address _user) external view returns (uint256)
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| \_user | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### getVestingTime

```solidity
function getVestingTime(enum AtlasMine.Lock _lock) external pure returns (uint256 vestingTime)
```

#### Parameters

| Name   | Type                | Description |
| ------ | ------------------- | ----------- |
| \_lock | enum AtlasMine.Lock | undefined   |

#### Returns

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| vestingTime | uint256 | undefined   |

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

### harvestAll

```solidity
function harvestAll() external nonpayable
```

### harvestPosition

```solidity
function harvestPosition(uint256 _depositId) external nonpayable
```

#### Parameters

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| \_depositId | uint256 | undefined   |

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
function init(address _magic, address _masterOfCoin) external nonpayable
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| \_magic        | address | undefined   |
| \_masterOfCoin | address | undefined   |

### isLegion1_1

```solidity
function isLegion1_1(uint256 _tokenId) external view returns (bool)
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### isLegion1_1Staked

```solidity
function isLegion1_1Staked(address) external view returns (bool)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### legion

```solidity
function legion() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### legionBoostMatrix

```solidity
function legionBoostMatrix(uint256, uint256) external view returns (uint256)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |
| \_1  | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### legionMetadataStore

```solidity
function legionMetadataStore() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### magic

```solidity
function magic() external view returns (contract IERC20Upgradeable)
```

#### Returns

| Name | Type                       | Description |
| ---- | -------------------------- | ----------- |
| \_0  | contract IERC20Upgradeable | undefined   |

### magicTotalDeposits

```solidity
function magicTotalDeposits() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### masterOfCoin

```solidity
function masterOfCoin() external view returns (contract IMasterOfCoin)
```

#### Returns

| Name | Type                   | Description |
| ---- | ---------------------- | ----------- |
| \_0  | contract IMasterOfCoin | undefined   |

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) external nonpayable returns (bytes4)
```

#### Parameters

| Name | Type      | Description |
| ---- | --------- | ----------- |
| \_0  | address   | undefined   |
| \_1  | address   | undefined   |
| \_2  | uint256[] | undefined   |
| \_3  | uint256[] | undefined   |
| \_4  | bytes     | undefined   |

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | bytes4 | undefined   |

### onERC1155Received

```solidity
function onERC1155Received(address, address, uint256, uint256, bytes) external nonpayable returns (bytes4)
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

### pendingRewardsAll

```solidity
function pendingRewardsAll(address _user) external view returns (uint256 pending)
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| \_user | address | undefined   |

#### Returns

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| pending | uint256 | undefined   |

### pendingRewardsPosition

```solidity
function pendingRewardsPosition(address _user, uint256 _depositId) external view returns (uint256 pending)
```

#### Parameters

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| \_user      | address | undefined   |
| \_depositId | uint256 | undefined   |

#### Returns

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| pending | uint256 | undefined   |

### removeExcludedAddress

```solidity
function removeExcludedAddress(address _excluded) external nonpayable
```

#### Parameters

| Name       | Type    | Description |
| ---------- | ------- | ----------- |
| \_excluded | address | undefined   |

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

### setLegion

```solidity
function setLegion(address _legion) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_legion | address | undefined   |

### setLegionBoostMatrix

```solidity
function setLegionBoostMatrix(uint256[][] _legionBoostMatrix) external nonpayable
```

#### Parameters

| Name                | Type        | Description |
| ------------------- | ----------- | ----------- |
| \_legionBoostMatrix | uint256[][] | undefined   |

### setLegionMetadataStore

```solidity
function setLegionMetadataStore(address _legionMetadataStore) external nonpayable
```

#### Parameters

| Name                  | Type    | Description |
| --------------------- | ------- | ----------- |
| \_legionMetadataStore | address | undefined   |

### setMagicToken

```solidity
function setMagicToken(address _magic) external nonpayable
```

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| \_magic | address | undefined   |

### setTreasure

```solidity
function setTreasure(address _treasure) external nonpayable
```

#### Parameters

| Name       | Type    | Description |
| ---------- | ------- | ----------- |
| \_treasure | address | undefined   |

### setUtilizationOverride

```solidity
function setUtilizationOverride(uint256 _utilizationOverride) external nonpayable
```

#### Parameters

| Name                  | Type    | Description |
| --------------------- | ------- | ----------- |
| \_utilizationOverride | uint256 | undefined   |

### stakeLegion

```solidity
function stakeLegion(uint256 _tokenId) external nonpayable
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |

### stakeTreasure

```solidity
function stakeTreasure(uint256 _tokenId, uint256 _amount) external nonpayable
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |
| \_amount  | uint256 | undefined   |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```

#### Parameters

| Name        | Type   | Description |
| ----------- | ------ | ----------- |
| interfaceId | bytes4 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### toggleUnlockAll

```solidity
function toggleUnlockAll() external nonpayable
```

EMERGENCY ONLY

### totalLpToken

```solidity
function totalLpToken() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### totalRewardsEarned

```solidity
function totalRewardsEarned() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### totalUndistributedRewards

```solidity
function totalUndistributedRewards() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### treasure

```solidity
function treasure() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### treasureStaked

```solidity
function treasureStaked(address, uint256) external view returns (uint256)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |
| \_1  | uint256 | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### treasureStakedAmount

```solidity
function treasureStakedAmount(address) external view returns (uint256)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### unlockAll

```solidity
function unlockAll() external view returns (bool)
```

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### unstakeLegion

```solidity
function unstakeLegion(uint256 _tokenId) external nonpayable
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |

### unstakeTreasure

```solidity
function unstakeTreasure(uint256 _tokenId, uint256 _amount) external nonpayable
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |
| \_amount  | uint256 | undefined   |

### userInfo

```solidity
function userInfo(address, uint256) external view returns (uint256 originalDepositAmount, uint256 depositAmount, uint256 lpAmount, uint256 lockedUntil, uint256 vestingLastUpdate, int256 rewardDebt, enum AtlasMine.Lock lock)
```

user =&gt; depositId =&gt; UserInfo

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |
| \_1  | uint256 | undefined   |

#### Returns

| Name                  | Type                | Description |
| --------------------- | ------------------- | ----------- |
| originalDepositAmount | uint256             | undefined   |
| depositAmount         | uint256             | undefined   |
| lpAmount              | uint256             | undefined   |
| lockedUntil           | uint256             | undefined   |
| vestingLastUpdate     | uint256             | undefined   |
| rewardDebt            | int256              | undefined   |
| lock                  | enum AtlasMine.Lock | undefined   |

### utilization

```solidity
function utilization() external view returns (uint256 util)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| util | uint256 | undefined   |

### utilizationOverride

```solidity
function utilizationOverride() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### withdrawAll

```solidity
function withdrawAll() external nonpayable
```

### withdrawAndHarvestAll

```solidity
function withdrawAndHarvestAll() external nonpayable
```

### withdrawAndHarvestPosition

```solidity
function withdrawAndHarvestPosition(uint256 _depositId, uint256 _amount) external nonpayable
```

#### Parameters

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| \_depositId | uint256 | undefined   |
| \_amount    | uint256 | undefined   |

### withdrawPosition

```solidity
function withdrawPosition(uint256 _depositId, uint256 _amount) external nonpayable returns (bool)
```

#### Parameters

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| \_depositId | uint256 | undefined   |
| \_amount    | uint256 | undefined   |

#### Returns

| Name | Type | Description |
| ---- | ---- | ----------- |
| \_0  | bool | undefined   |

### withdrawUndistributedRewards

```solidity
function withdrawUndistributedRewards(address _to) external nonpayable
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_to | address | undefined   |

## Events

### Deposit

```solidity
event Deposit(address indexed user, uint256 indexed index, uint256 amount, enum AtlasMine.Lock lock)
```

#### Parameters

| Name            | Type                | Description |
| --------------- | ------------------- | ----------- |
| user `indexed`  | address             | undefined   |
| index `indexed` | uint256             | undefined   |
| amount          | uint256             | undefined   |
| lock            | enum AtlasMine.Lock | undefined   |

### Harvest

```solidity
event Harvest(address indexed user, uint256 indexed index, uint256 amount)
```

#### Parameters

| Name            | Type    | Description |
| --------------- | ------- | ----------- |
| user `indexed`  | address | undefined   |
| index `indexed` | uint256 | undefined   |
| amount          | uint256 | undefined   |

### LogUpdateRewards

```solidity
event LogUpdateRewards(uint256 distributedRewards, uint256 undistributedRewards, uint256 lpSupply, uint256 accMagicPerShare)
```

#### Parameters

| Name                 | Type    | Description |
| -------------------- | ------- | ----------- |
| distributedRewards   | uint256 | undefined   |
| undistributedRewards | uint256 | undefined   |
| lpSupply             | uint256 | undefined   |
| accMagicPerShare     | uint256 | undefined   |

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

### Staked

```solidity
event Staked(address nft, uint256 tokenId, uint256 amount, uint256 currentBoost)
```

#### Parameters

| Name         | Type    | Description |
| ------------ | ------- | ----------- |
| nft          | address | undefined   |
| tokenId      | uint256 | undefined   |
| amount       | uint256 | undefined   |
| currentBoost | uint256 | undefined   |

### UndistributedRewardsWithdraw

```solidity
event UndistributedRewardsWithdraw(address indexed to, uint256 amount)
```

#### Parameters

| Name         | Type    | Description |
| ------------ | ------- | ----------- |
| to `indexed` | address | undefined   |
| amount       | uint256 | undefined   |

### Unstaked

```solidity
event Unstaked(address nft, uint256 tokenId, uint256 amount, uint256 currentBoost)
```

#### Parameters

| Name         | Type    | Description |
| ------------ | ------- | ----------- |
| nft          | address | undefined   |
| tokenId      | uint256 | undefined   |
| amount       | uint256 | undefined   |
| currentBoost | uint256 | undefined   |

### UtilizationRate

```solidity
event UtilizationRate(uint256 util)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| util | uint256 | undefined   |

### Withdraw

```solidity
event Withdraw(address indexed user, uint256 indexed index, uint256 amount)
```

#### Parameters

| Name            | Type    | Description |
| --------------- | ------- | ----------- |
| user `indexed`  | address | undefined   |
| index `indexed` | uint256 | undefined   |
| amount          | uint256 | undefined   |
