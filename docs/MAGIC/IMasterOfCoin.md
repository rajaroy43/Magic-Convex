# IMasterOfCoin

## Methods

### addStream

```solidity
function addStream(address _stream, uint256 _totalRewards, uint256 _startTimestamp, uint256 _endTimestamp, bool _callback) external nonpayable
```

#### Parameters

| Name             | Type    | Description |
| ---------------- | ------- | ----------- |
| \_stream         | address | undefined   |
| \_totalRewards   | uint256 | undefined   |
| \_startTimestamp | uint256 | undefined   |
| \_endTimestamp   | uint256 | undefined   |
| \_callback       | bool    | undefined   |

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

### grantTokenToStream

```solidity
function grantTokenToStream(address _stream, uint256 _amount) external nonpayable
```

#### Parameters

| Name     | Type    | Description |
| -------- | ------- | ----------- |
| \_stream | address | undefined   |
| \_amount | uint256 | undefined   |

### requestRewards

```solidity
function requestRewards() external nonpayable returns (uint256 rewardsPaid)
```

#### Returns

| Name        | Type    | Description |
| ----------- | ------- | ----------- |
| rewardsPaid | uint256 | undefined   |

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
