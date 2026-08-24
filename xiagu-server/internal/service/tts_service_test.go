package service

import (
	"testing"
	"time"
)

func TestSplitTTSSegmentsHonorsLimitAndPrefersPunctuation(t *testing.T) {
	segments := splitTTSSegments("长安一片月，万户捣衣声。秋风吹不尽，总是玉关情。何日平胡虏，良人罢远征。", 15)
	if len(segments) < 2 {
		t.Fatalf("expected multiple segments, got %#v", segments)
	}
	for _, segment := range segments {
		if got := len([]rune(segment)); got > 15 {
			t.Fatalf("segment exceeds limit (%d): %q", got, segment)
		}
	}
}

func TestTTSTicketRejectsTamperingAndExpiry(t *testing.T) {
	now := time.Date(2026, 8, 15, 12, 0, 0, 0, time.UTC)
	svc := &TTSService{secret: []byte("test-ticket-secret"), now: func() time.Time { return now }}
	ticket := svc.sign(ttsTicketClaims{
		UserID: "user-a", HeroID: "libai", TextHash: textHash("大河之剑"), Index: 1,
		Expires: now.Add(time.Minute).Unix(),
	})
	claims, err := svc.verify(ticket)
	if err != nil || claims.UserID != "user-a" || claims.Index != 1 {
		t.Fatalf("expected valid ticket, claims=%+v err=%v", claims, err)
	}
	if err := svc.ValidateTicketForTest(ticket + "x"); err == nil {
		t.Fatal("expected tampered ticket rejection")
	}
	expired := svc.sign(ttsTicketClaims{Expires: now.Add(-time.Second).Unix()})
	if err := svc.ValidateTicketForTest(expired); err == nil {
		t.Fatal("expected expired ticket rejection")
	}
}
