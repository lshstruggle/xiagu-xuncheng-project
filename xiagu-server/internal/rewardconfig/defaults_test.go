package rewardconfig

import (
	"testing"

	"xiagu-server/internal/model"
)

func TestDefaultFragments(t *testing.T) {
	tests := []struct {
		poiType model.POIType
		hero    int
		skin    int
	}{
		{model.POIBlueBuff, 3, 1},
		{model.POIRedBuff, 4, 2},
		{model.POITower, 7, 3},
		{model.POIPlayerFootprint, 7, 3},
		{model.POISpiritLighthouse, 12, 4},
		{model.POIClub, 4, 2},
		{model.POIArena, 7, 3},
	}

	for _, test := range tests {
		config, ok := DefaultFragments(test.poiType)
		if !ok {
			t.Fatalf("expected defaults for %q", test.poiType)
		}
		if config.HeroFragments != test.hero ||
			config.SkinFragments != test.skin ||
			config.FirstCheckinMultiplier != 2 {
			t.Fatalf("unexpected defaults for %q: %#v", test.poiType, config)
		}
	}

	if _, ok := DefaultFragments(model.POIType("unknown")); ok {
		t.Fatal("unknown POI type must not receive a fallback reward")
	}
}
