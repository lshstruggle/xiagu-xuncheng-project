package database

import (
	"testing"
)

func TestCollectionName(t *testing.T) {
	tests := []struct {
		name       string
		prefix     string
		collection string
		expected   string
	}{
		{
			name:       "production collection",
			prefix:     "",
			collection: "users",
			expected:   "users",
		},
		{
			name:       "test collection",
			prefix:     "test_",
			collection: "users",
			expected:   "test_users",
		},
		{
			name:       "preserves stable collection name",
			prefix:     "preview_",
			collection: "story_progress",
			expected:   "preview_story_progress",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := CollectionName(test.prefix, test.collection)

			if got != test.expected {
				t.Fatalf(
					"expected collection name %q, got %q",
					test.expected,
					got,
				)
			}
		})
	}
}

func TestCollectionsUsesConfiguredPrefix(t *testing.T) {
	collections := NewCollections(&HTTPClient{}, "test_")

	got := collections.Collection("users").Name()
	if got != "test_users" {
		t.Fatalf("expected collection name %q, got %q", "test_users", got)
	}
}
