package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"go.mongodb.org/mongo-driver/bson"
)

func TestReadAndValidateDocuments(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pois.json")
	data := []byte(`[
		{"poi_code":"cd_wuhouci","name":"武侯祠"},
		{"poi_code":"cd_caotang","name":"杜甫草堂"}
	]`)
	if err := os.WriteFile(path, data, 0o600); err != nil {
		t.Fatalf("write fixture: %v", err)
	}

	documents, err := readDocuments(path)
	if err != nil {
		t.Fatalf("read documents: %v", err)
	}
	if err := validateDocuments(documents, []string{"poi_code"}); err != nil {
		t.Fatalf("validate documents: %v", err)
	}
	filter, err := stableFilter(documents[0], []string{"poi_code"})
	if err != nil || filter["poi_code"] != "cd_wuhouci" {
		t.Fatalf("unexpected stable filter %#v, error %v", filter, err)
	}
}

func TestValidateDocumentsRejectsMissingAndDuplicateKeys(t *testing.T) {
	tests := []struct {
		name      string
		documents []bson.M
		expected  string
	}{
		{
			name:      "missing key",
			documents: []bson.M{{"name": "武侯祠"}},
			expected:  "missing",
		},
		{
			name: "duplicate key",
			documents: []bson.M{
				{"poi_code": "same"},
				{"poi_code": "same"},
			},
			expected: "duplicate",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateDocuments(test.documents, []string{"poi_code"})
			if err == nil || !strings.Contains(err.Error(), test.expected) {
				t.Fatalf("expected %q error, got %v", test.expected, err)
			}
		})
	}
}
