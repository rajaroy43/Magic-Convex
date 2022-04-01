# RewardPool

> RewardPool

stake prMagic token and receive magic token

## Methods

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```

#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| account | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### currentRewards

```solidity
function currentRewards() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### donate

```solidity
function donate(uint256 _amount) external nonpayable
```

donate \_amount of magic token to this contract

#### Parameters

| Name     | Type    | Description                       |
| -------- | ------- | --------------------------------- |
| \_amount | uint256 | how much amount of token donation |

### duration

```solidity
function duration() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### earned

```solidity
function earned(address account) external view returns (uint256)
```

getting how much amount of reward token user have accumulated

#### Parameters

| Name    | Type    | Description         |
| ------- | ------- | ------------------- |
| account | address | for address account |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### getReward

```solidity
function getReward(address _account) external nonpayable
```

getting rewrd for address \_account

#### Parameters

| Name      | Type    | Description     |
| --------- | ------- | --------------- |
| \_account | address | address of user |

### historicalRewards

```solidity
function historicalRewards() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### lastTimeRewardApplicable

```solidity
function lastTimeRewardApplicable() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### lastUpdateTime

```solidity
function lastUpdateTime() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### newRewardRatio

```solidity
function newRewardRatio() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### operator

```solidity
function operator() external view returns (address)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

### periodFinish

```solidity
function periodFinish() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### queueNewRewards

```solidity
function queueNewRewards(uint256 _rewards) external nonpayable
```

updating new reward and reward rate ,if here time passes against periodFinish

#### Parameters

| Name      | Type    | Description                                          |
| --------- | ------- | ---------------------------------------------------- |
| \_rewards | uint256 | how much amount of \_rewards token operatow will add |

### queuedRewards

```solidity
function queuedRewards() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### rewardPerToken

```solidity
function rewardPerToken() external view returns (uint256)
```

get reward per token till now

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### rewardPerTokenStored

```solidity
function rewardPerTokenStored() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### rewardRate

```solidity
function rewardRate() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### rewardToken

```solidity
function rewardToken() external view returns (contract IERC20)
```

#### Returns

| Name | Type            | Description |
| ---- | --------------- | ----------- |
| \_0  | contract IERC20 | undefined   |

### rewards

```solidity
function rewards(address) external view returns (uint256)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### stake

```solidity
function stake(uint256 _amount) external nonpayable
```

staking amount of prMagic token for caller

#### Parameters

| Name     | Type    | Description                                        |
| -------- | ------- | -------------------------------------------------- |
| \_amount | uint256 | how much amount of prMagic user wan&#39;t to stake |

### stakeFor

```solidity
function stakeFor(address _for, uint256 _amount) external nonpayable
```

staking amount of prMagic token for \_for address

#### Parameters

| Name     | Type    | Description                                        |
| -------- | ------- | -------------------------------------------------- |
| \_for    | address | staking for address \_for                          |
| \_amount | uint256 | how much amount of prMagic user wan&#39;t to stake |

### stakingToken

```solidity
function stakingToken() external view returns (contract IERC20)
```

#### Returns

| Name | Type            | Description |
| ---- | --------------- | ----------- |
| \_0  | contract IERC20 | undefined   |

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### userRewardPerTokenPaid

```solidity
function userRewardPerTokenPaid(address) external view returns (uint256)
```

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | address | undefined   |

#### Returns

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_0  | uint256 | undefined   |

### withdraw

```solidity
function withdraw(uint256 _amount, bool claim) external nonpayable
```

unstaking amount of prMagic token from contract

#### Parameters

| Name     | Type    | Description                                                                    |
| -------- | ------- | ------------------------------------------------------------------------------ |
| \_amount | uint256 | how much amount of prMagic user wan&#39;t to unstake/withdraw                  |
| claim    | bool    | if claim true ,then after withdrawing user will get reward in same transaction |

## Events

### RewardAdded

```solidity
event RewardAdded(uint256 reward)
```

#### Parameters

| Name   | Type    | Description |
| ------ | ------- | ----------- |
| reward | uint256 | undefined   |

### RewardPaid

```solidity
event RewardPaid(address indexed user, uint256 reward)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| user `indexed` | address | undefined   |
| reward         | uint256 | undefined   |

### Staked

```solidity
event Staked(address indexed user, uint256 amount)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| user `indexed` | address | undefined   |
| amount         | uint256 | undefined   |

### Withdrawn

```solidity
event Withdrawn(address indexed user, uint256 amount)
```

#### Parameters

| Name           | Type    | Description |
| -------------- | ------- | ----------- |
| user `indexed` | address | undefined   |
| amount         | uint256 | undefined   |
