package service

import "testing"

func TestMissingRequiredPOIs(t *testing.T) {
	required := []string{"poi-a", "poi-b", "poi-c"}
	visited := map[string]struct{}{"poi-a": {}, "poi-c": {}, "unrelated": {}}
	missing := missingRequiredPOIs(required, visited)
	if len(missing) != 1 || missing[0] != "poi-b" {
		t.Fatalf("unexpected missing POIs: %#v", missing)
	}
	if missing = missingRequiredPOIs(required, map[string]struct{}{
		"poi-a": {}, "poi-b": {}, "poi-c": {},
	}); len(missing) != 0 {
		t.Fatalf("completed route should have no missing POIs: %#v", missing)
	}
}
