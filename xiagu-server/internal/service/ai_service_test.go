package service

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestTruncateEndsCleanlyWithoutEllipsis(t *testing.T) {
	svc := &AIService{}
	input := strings.Repeat("成都的夜色很美，", 20)
	got := svc.truncate(input, 100)

	if utf8.RuneCountInString(got) > 100 {
		t.Fatalf("reply is too long: %d", utf8.RuneCountInString(got))
	}
	if strings.HasSuffix(got, "...") || strings.HasSuffix(got, "…") {
		t.Fatalf("reply ends with ellipsis: %q", got)
	}
	if !strings.HasSuffix(got, "。") {
		t.Fatalf("reply does not end cleanly: %q", got)
	}
}
