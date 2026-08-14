package repository

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson"

	"xiagu-server/internal/model"
)

func TestRewardItemSetUpdates(t *testing.T) {
	updates := rewardItemSetUpdates([]model.RewardItem{
		{Type: "knowledge_card", ID: "kc_wuhouci"},
		{Type: "knowledge_card", ID: "kc_wuhouci"},
		{Type: "knowledge_card", ID: "kc_caotang"},
		{Type: "badge", ID: "badge_history"},
		{Type: "unsupported", ID: "ignored"},
		{Type: "badge"},
	})

	knowledgeCards, ok := updates["knowledge_cards"].(bson.M)
	if !ok {
		t.Fatalf("expected multiple knowledge cards, got %#v", updates)
	}
	each, ok := knowledgeCards["$each"].([]string)
	if !ok || len(each) != 2 || each[0] != "kc_wuhouci" || each[1] != "kc_caotang" {
		t.Fatalf("unexpected knowledge card update: %#v", knowledgeCards)
	}
	if updates["badges"] != "badge_history" {
		t.Fatalf("unexpected badge update: %#v", updates["badges"])
	}
	if _, exists := updates["unsupported"]; exists {
		t.Fatal("unsupported rewards must not be persisted")
	}
}

func TestRewardItemSetUpdatesReturnsEmptyForNoSupportedItems(t *testing.T) {
	updates := rewardItemSetUpdates([]model.RewardItem{{
		Type: "coupon",
		ID:   "coupon-1",
	}})
	if len(updates) != 0 {
		t.Fatalf("expected no set updates, got %#v", updates)
	}
}
