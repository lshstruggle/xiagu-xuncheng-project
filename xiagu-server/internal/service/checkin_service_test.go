package service

import (
	"testing"

	"xiagu-server/internal/model"
)

func TestConfiguredFragmentsUsesPOIReward(t *testing.T) {
	reward := &model.POIReward{
		Fragments: &model.FragmentRewardConfig{
			HeroFragments:          4,
			SkinFragments:          2,
			FirstCheckinMultiplier: 2,
		},
	}

	hero, skin, err := configuredFragments(reward, false)
	if err != nil || hero != 4 || skin != 2 {
		t.Fatalf("repeat reward = (%d, %d, %v), want (4, 2, nil)", hero, skin, err)
	}

	hero, skin, err = configuredFragments(reward, true)
	if err != nil || hero != 8 || skin != 4 {
		t.Fatalf("first reward = (%d, %d, %v), want (8, 4, nil)", hero, skin, err)
	}
}

func TestConfiguredFragmentsRejectsMissingOrInvalidConfig(t *testing.T) {
	tests := []struct {
		name   string
		reward *model.POIReward
	}{
		{name: "missing reward"},
		{name: "missing fragments", reward: &model.POIReward{}},
		{
			name: "negative fragments",
			reward: &model.POIReward{Fragments: &model.FragmentRewardConfig{
				HeroFragments:          -1,
				FirstCheckinMultiplier: 1,
			}},
		},
		{
			name: "invalid multiplier",
			reward: &model.POIReward{Fragments: &model.FragmentRewardConfig{
				HeroFragments: 1,
				SkinFragments: 1,
			}},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if _, _, err := configuredFragments(test.reward, true); err == nil {
				t.Fatal("expected invalid reward configuration to fail")
			}
		})
	}
}

func TestConfiguredRewardItemsUseStableBusinessIDs(t *testing.T) {
	reward := &model.POIReward{Items: []model.RewardItem{{
		Type: "knowledge_card",
		ID:   "kc_wuhouci",
		Name: "武侯祠历史卡",
	}}}

	items := configuredRewardItems(reward)
	if len(items) != 1 || items[0].ID != "kc_wuhouci" {
		t.Fatalf("unexpected configured items: %#v", items)
	}

	items[0].ID = "changed"
	if reward.Items[0].ID != "kc_wuhouci" {
		t.Fatal("configured reward items must be copied before use")
	}
}

func TestAppendRewardIfMissingIsIdempotent(t *testing.T) {
	reward := model.RewardItem{Type: "spirit_badge", ID: "badge_esports"}
	items := appendRewardIfMissing(nil, reward)
	items = appendRewardIfMissing(items, reward)
	if len(items) != 1 {
		t.Fatalf("expected one reward, got %#v", items)
	}
}

func TestNormalizeHeroIDSupportsExistingMiniProgramAlias(t *testing.T) {
	if got := normalizeHeroID("li_bai"); got != "libai" {
		t.Fatalf("normalizeHeroID(li_bai) = %q, want libai", got)
	}
	if got := normalizeHeroID("daqiao"); got != "daqiao" {
		t.Fatalf("normalizeHeroID(daqiao) = %q, want unchanged", got)
	}
}
