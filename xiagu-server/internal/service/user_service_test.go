package service

import "testing"

func TestValidateUserProfile(t *testing.T) {
	tests := []struct {
		name     string
		nickname string
		avatar   string
		valid    bool
	}{
		{
			name:     "valid WeChat profile",
			nickname: "峡谷玩家",
			avatar:   "cloud://test-env/user-avatars/user/avatar.jpg",
			valid:    true,
		},
		{
			name:     "empty nickname",
			nickname: "",
			avatar:   "cloud://test-env/avatar.jpg",
		},
		{
			name:     "nickname too long",
			nickname: "一二三四五六七八九十一二三四五六七八九十一",
			avatar:   "cloud://test-env/avatar.jpg",
		},
		{
			name:     "temporary local avatar is rejected",
			nickname: "峡谷玩家",
			avatar:   "wxfile://tmp/avatar.jpg",
		},
		{
			name:     "remote URL is rejected",
			nickname: "峡谷玩家",
			avatar:   "https://example.com/avatar.jpg",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateUserProfile(test.nickname, test.avatar)
			if test.valid && err != nil {
				t.Fatalf("expected valid profile, got %v", err)
			}
			if !test.valid && err == nil {
				t.Fatal("expected invalid profile")
			}
		})
	}
}
