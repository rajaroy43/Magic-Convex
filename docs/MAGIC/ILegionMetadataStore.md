# ILegionMetadataStore

## Methods

### increaseConstellationRank

```solidity
function increaseConstellationRank(uint256 _tokenId, enum Constellation _constellation, uint8 _to) external nonpayable
```

#### Parameters

| Name            | Type               | Description |
| --------------- | ------------------ | ----------- |
| \_tokenId       | uint256            | undefined   |
| \_constellation | enum Constellation | undefined   |
| \_to            | uint8              | undefined   |

### increaseCraftLevel

```solidity
function increaseCraftLevel(uint256 _tokenId) external nonpayable
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |

### increaseQuestLevel

```solidity
function increaseQuestLevel(uint256 _tokenId) external nonpayable
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |

### metadataForLegion

```solidity
function metadataForLegion(uint256 _tokenId) external view returns (struct LegionMetadata)
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |

#### Returns

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| \_0  | LegionMetadata | undefined   |

### setInitialMetadataForLegion

```solidity
function setInitialMetadataForLegion(address _owner, uint256 _tokenId, enum LegionGeneration _generation, enum LegionClass _class, enum LegionRarity _rarity, uint256 _oldId) external nonpayable
```

#### Parameters

| Name         | Type                  | Description |
| ------------ | --------------------- | ----------- |
| \_owner      | address               | undefined   |
| \_tokenId    | uint256               | undefined   |
| \_generation | enum LegionGeneration | undefined   |
| \_class      | enum LegionClass      | undefined   |
| \_rarity     | enum LegionRarity     | undefined   |
| \_oldId      | uint256               | undefined   |

### tokenURI

```solidity
function tokenURI(uint256 _tokenId) external view returns (string)
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_tokenId | uint256 | undefined   |

#### Returns

| Name | Type   | Description |
| ---- | ------ | ----------- |
| \_0  | string | undefined   |
