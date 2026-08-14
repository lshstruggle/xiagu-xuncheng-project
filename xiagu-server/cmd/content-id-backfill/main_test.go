package main

import (
	"testing"

	"xiagu-server/internal/rewardconfig"
)

func TestStableContentIdentitiesAreUniqueAndComplete(t *testing.T) {
	if len(poiCodes) != 32 {
		t.Fatalf("expected 32 POI identities, got %d", len(poiCodes))
	}
	knownCodes := map[string]struct{}{}
	for name, code := range poiCodes {
		if name == "" || code == "" {
			t.Fatalf("empty POI identity: %q=%q", name, code)
		}
		if _, duplicate := knownCodes[code]; duplicate {
			t.Fatalf("duplicate POI code %q", code)
		}
		knownCodes[code] = struct{}{}
	}
	if len(routeIdentities) != 3 {
		t.Fatalf("expected 3 route identities, got %d", len(routeIdentities))
	}
	routeCodes := map[string]struct{}{}
	for name, identity := range routeIdentities {
		if _, duplicate := routeCodes[identity.Code]; duplicate {
			t.Fatalf("duplicate route code %q", identity.Code)
		}
		routeCodes[identity.Code] = struct{}{}
		if len(identity.POICodes) == 0 {
			t.Fatalf("route %q has no POI sequence", name)
		}
		for _, code := range identity.POICodes {
			if _, exists := knownCodes[code]; !exists {
				t.Fatalf("route %q references unknown POI code %q", name, code)
			}
		}
	}
}

func TestMissingFrontendPOIDefinitionsAreComplete(t *testing.T) {
	if len(missingFrontendPOIs) != 13 {
		t.Fatalf("expected 13 missing frontend POIs, got %d", len(missingFrontendPOIs))
	}
	markerIDs := map[string]struct{}{}
	for _, definition := range missingFrontendPOIs {
		if _, duplicate := markerIDs[definition.MarkerID]; duplicate {
			t.Fatalf("duplicate marker ID %q", definition.MarkerID)
		}
		markerIDs[definition.MarkerID] = struct{}{}
		if poiCodes[definition.Name] != definition.Code {
			t.Fatalf("identity mismatch for %q", definition.Name)
		}
		if _, ok := rewardconfig.DefaultFragments(definition.Type); !ok {
			t.Fatalf("missing reward defaults for %q", definition.Type)
		}
	}
}
