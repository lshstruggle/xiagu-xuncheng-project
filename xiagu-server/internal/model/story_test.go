package model

import (
	"os"
	"path/filepath"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
)

func TestStorySeedDecodesAndHasValidTransitions(t *testing.T) {
	path := filepath.Join("..", "..", "seeds", "stories", "libai-chengdu.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read story seed: %v", err)
	}

	var definitions []StoryDefinition
	if err := bson.UnmarshalExtJSON(data, false, &definitions); err != nil {
		t.Fatalf("decode story seed: %v", err)
	}
	if len(definitions) != 1 {
		t.Fatalf("expected one story definition, got %d", len(definitions))
	}
	story := definitions[0]
	if story.ID != "libai-chengdu" || story.StartNodeID == "" {
		t.Fatalf("unexpected story identity: %#v", story)
	}
	if len(story.Nodes) != 44 || len(story.Chapters) != 6 {
		t.Fatalf("unexpected story size: nodes=%d chapters=%d", len(story.Nodes), len(story.Chapters))
	}
	if _, exists := story.Nodes[story.StartNodeID]; !exists {
		t.Fatalf("start node %q does not exist", story.StartNodeID)
	}

	rewardNodes := 0
	for key, node := range story.Nodes {
		if node.ID != key {
			t.Errorf("node map key %q does not match ID %q", key, node.ID)
		}
		if node.NextNodeID != "" {
			if _, exists := story.Nodes[node.NextNodeID]; !exists {
				t.Errorf("node %q points to missing node %q", key, node.NextNodeID)
			}
		}
		for _, choice := range node.Choices {
			if _, exists := story.Nodes[choice.NextNodeID]; !exists {
				t.Errorf("choice %q points to missing node %q", choice.ID, choice.NextNodeID)
			}
		}
		if node.Reward != nil {
			rewardNodes++
		}
	}
	if rewardNodes != 5 {
		t.Fatalf("expected 5 authoritative reward nodes, got %d", rewardNodes)
	}
}
