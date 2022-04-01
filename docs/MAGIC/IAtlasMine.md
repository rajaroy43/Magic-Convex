# IAtlasMine

## Methods

### deposit

```solidity
function deposit(uint256 amount, uint8 lockEnum) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| amount   | uint256 | undefined   |
| lockEnum | uint8   | undefined   |

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

### harvestAll

```solidity
function harvestAll() external nonpayable
```

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
function userInfo(address, uint256) external nonpayable returns (uint256, uint256, uint256, uint256, uint256, int256, uint8)
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
| \_1  | uint256 | undefined   |
| \_2  | uint256 | undefined   |
| \_3  | uint256 | undefined   |
| \_4  | uint256 | undefined   |
| \_5  | int256  | undefined   |
| \_6  | uint8   | undefined   |

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
