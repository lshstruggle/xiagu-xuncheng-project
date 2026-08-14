package rewardconfig

import "xiagu-server/internal/model"

// DefaultFragments returns the values used to initialize POI documents.
// Runtime reward calculation reads the stored POI configuration instead.
func DefaultFragments(poiType model.POIType) (model.FragmentRewardConfig, bool) {
	config := model.FragmentRewardConfig{FirstCheckinMultiplier: 2}

	switch poiType {
	case model.POIBlueBuff:
		config.HeroFragments = 3
		config.SkinFragments = 1
	case model.POIRedBuff, model.POIClub:
		config.HeroFragments = 4
		config.SkinFragments = 2
	case model.POITower, model.POIPlayerFootprint, model.POIArena:
		config.HeroFragments = 7
		config.SkinFragments = 3
	case model.POISpiritLighthouse:
		config.HeroFragments = 12
		config.SkinFragments = 4
	default:
		return model.FragmentRewardConfig{}, false
	}

	return config, true
}
